from collections import defaultdict
from datetime import datetime
from functools import partial
from typing import Optional

from dateutil.relativedelta import relativedelta
from flask import (Blueprint, current_app, flash, jsonify, make_response,
                   render_template, request, g)
from flask_login import current_user, login_required
import pytz

from app.blueprints.calendar.forms import CourseFilterForm, AlertForm
from app.blueprints.calendar.models import CourseFilter, EventAlert, CourseIdentifier
from app.blueprints.main.models import User
from app.exts import db, oauth
from app.schoology.api import get_paged_data
from app.view_utils import cache_header
from .types import SchoologyCalendar

blueprint = Blueprint('calendar', __name__, url_prefix='/calendar', template_folder='../../templates',
                      static_folder='../../bundle')


@blueprint.route('')
@login_required
def calendar():
    return render_template(
        'calendar.html',
        colors=current_user.colors.all(),
        id=current_user.id,
        ical_secret=current_user.ical_secret,
        base_url=request.url_root.split('://')[1]
    )


def get_current_user(extra=''):
    try:
        return str(current_user.id) + extra
    except Exception:
        current_app.logger.error('Caching error with user events.')
        return 'view/%s'


@blueprint.route('/ical/<int:user_id>/<secret>/calendar.ics')
@cache_header(1800)
def ical_file(user_id: int, secret: str):
    user: User = User.query.filter_by(id=user_id).first()

    if user is not None and user.ical_secret == secret:
        g.current_id = user.id
        events_list = get_user_events(user, True)
        timezone = pytz.timezone(user.timezone)

        calendar = SchoologyCalendar(creator=current_app.config['APP_NAME'], timezone=timezone,
                                     events=events_list, alerts=user.alerts.all())

        # Turn calendar object into a string
        response = make_response(''.join(calendar.ical))
        response.headers['Content-Disposition'] = 'attachment; filename=calendar.ics'
        response.headers['Content-Type'] = 'text/calendar; charset=utf-8'
        return response

    flash('File not found')
    return render_template('500.html'), 500


@blueprint.route('/events')
@login_required
@cache_header(1800, key_prefix=partial(get_current_user, 'events'))
def events():
    return jsonify(SchoologyCalendar.sort_events(get_user_events(current_user)))


@blueprint.route('/alerts', methods=['GET', 'POST'])
@blueprint.route('/alerts/<int:id>', methods=['DELETE'])
@login_required
def alerts(id: Optional[int] = None):
    if request.method == 'GET':
        all_alerts = [alert.to_json() for alert in current_user.alerts.all()]
        alerts = defaultdict(list)

        for alert in all_alerts:
            alerts[str(alert['event_id'])].append(alert)

        return jsonify(alerts)

    if request.method == 'DELETE' and id is not None:
        if alert := current_user.alerts.filter_by(id=id).first():
            current_user.alerts.remove(alert)
            db.session.add(current_user)
            db.session.commit()
            return jsonify(success=True), 200

    if request.method == 'POST':
        form = AlertForm.from_json(request.get_json())
        if form.validate_on_submit():
            alert = current_user.alerts.filter_by(id=form.id.data).first()

            if alert is None:
                alert = EventAlert(event_id=form.event_id.data, timedelta=form.timedelta.data, type=form.type.data)
                current_user.alerts.append(alert)
            else:
                alert.timedelta = form.timedelta.data
                alert.type = form.type.data

            db.session.add(alert)
            db.session.add(current_user)
            db.session.commit()
            return jsonify(success=True), 201
    return jsonify(data='Invalid alert data'), 400


@blueprint.route('/filter', methods=['GET', 'POST'])
@login_required
def filter_modify():
    if request.method == 'GET':
        return jsonify([item.to_json() for item in current_user.filters])

    form_data = CourseFilterForm.from_json(request.get_json())
    if form_data.validate_on_submit():
        course_ids = [CourseIdentifier(**course_data) for course_data in form_data.course_ids.data]
        course_filter = current_user.filters.filter_by(id=form_data.id.data).first()

        if course_filter is None:
            course_filter = CourseFilter(
                positive=form_data.positive.data,
                course_ids=course_ids)
            current_user.filters.append(course_filter)
        else:
            course_filter.positive = form_data.positive.data
            course_filter.course_ids.delete()
            course_filter.course_ids = course_ids

        db.session.add(current_user)
        db.session.commit()
        return jsonify(success=True), 201
    return jsonify(data='Invalid filter data'), 400


@blueprint.route('/identifiers')
@login_required
@cache_header(900, key_prefix=partial(get_current_user, 'identifiers'))
def courses():
    user = oauth.schoology.get('users/me', cache=True).json()
    sections = [{'id': section['id'], 'name': section['course_title'], 'realm': 'section'} for section in
                oauth.schoology.get(f'users/{user["uid"]}/sections', cache=True).json()['section']]
    groups = [{'id': group['id'], 'name': group['title'], 'realm': 'group'} for group in
              oauth.schoology.get(f'users/{user["uid"]}/groups', cache=True).json()['group']]
    school = {'id': str(user['building_id']), 'name': 'School Events', 'realm': 'school'}
    district = {'id': str(user['school_id']), 'name': 'District Events', 'realm': 'district'}
    user_identifier = {'id': user['uid'], 'name': 'My Events', 'realm': 'user'}
    return jsonify(sections + groups + [school] + [district] + [user_identifier])


# TODO: Cache this with cache.memoize
def get_user_events(user: User, filter: bool = False):
    # This dictionary maps section ids, user ids, group ids to events so that only the ids have to be checked
    # This is more efficient if realms have many events
    events = defaultdict(list)

    now = datetime.now()
    period_start = now + relativedelta(months=-2)
    period_end = now + relativedelta(months=2)
    time_queries = f'?start_date={period_start.strftime("%Y-%m-%d")}&end_date={period_end.strftime("%Y-%m-%d")}'

    req_function = oauth.schoology.get
    if current_user.is_authenticated:
        req_function = partial(req_function, cache=True)

    events_json = get_paged_data(
        req_function,
        f'users/{user.id}/events' + time_queries + '&limit=200',
        'event'
    )

    for event in events_json:
        realm_id = event[event['realm'] + '_id']
        events[str(realm_id)].append(event)

    realm_ids = list(events.keys())

    if filter:
        user.apply_filters(realm_ids)

    # Add all events that are in unfiltered realms to the combined events list
    combined_events = []
    for realm_id in events.keys():
        if realm_id in realm_ids:
            combined_events += events[realm_id]
    return combined_events
