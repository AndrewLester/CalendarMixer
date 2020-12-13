from datetime import date
from typing import Optional
from urllib.parse import urlparse, parse_qs

import pytz
from flask import (
    Blueprint,
    current_app,
    flash,
    g,
    jsonify,
    make_response,
    render_template,
    request,
)
from flask_login import current_user

from app.blueprints.calendar.forms import AlertForm, CourseColorForm, CourseFilterForm
from app.blueprints.calendar.models import CourseFilter, CourseIdentifier, EventAlert
from app.blueprints.main.models import User
from app.exts import db, oauth, cache
from app.view_utils import cache_header, login_required, rest_endpoint

from .calendar import SchoologyCalendar
from .data import get_user_events
from .models import CourseColor, EventAlert, CourseFilter

blueprint = Blueprint(
    'calendar',
    __name__,
    url_prefix='/calendar',
    template_folder='../../templates',
    static_folder='../../bundle',
)


@blueprint.route('')
@login_required
def calendar():
    """
    View your Schoology Calendar on Calendar Mixer. Add alerts, filter events, and
    make your Schoology Calendar more powerful than before.
    """
    return render_template(
        'calendar.html',
        id=current_user.id,
        ical_secret=current_user.ical_secret,
        base_url=request.url_root.split('://')[1],
        title='Calendar',
    )


@blueprint.route('/ical/<int:user_id>/<secret>/calendar.ics')
@cache_header(1800)
def ical_file(user_id: int, secret: str):
    user: Optional[User] = User.query.get(user_id)

    if user is not None and user.ical_secret == secret:
        g.current_id = user.id
        events_list = get_user_events(user, True)
        timezone = pytz.timezone(user.timezone)

        calendar = SchoologyCalendar(
            creator=current_app.config['APP_NAME'],
            timezone=timezone,
            events=events_list,
            alerts=user.alerts.all(),
        )

        # Turn calendar object into a string
        response = make_response(''.join(calendar.ical))  # type: ignore
        response.headers['Content-Disposition'] = 'attachment; filename=calendar.ics'
        response.headers['Content-Type'] = 'text/calendar; charset=utf-8'
        return response

    flash('File not found')
    return render_template('500.html'), 500


@blueprint.route('/events')
@login_required
@cache_header(
    1800,
    key_prefix=lambda: str(current_user.id) + 'events/' + urlparse(request.url).query,
)
def events():
    dates = parse_qs(urlparse(request.url).query)
    time_range = None
    if dates.get('start', False) and dates.get('end', False):
        time_range = (
            date.fromisoformat(dates['start'][0]),
            date.fromisoformat(dates['end'][0]),
        )

    user_events = get_user_events(current_user, time_range=time_range)  # type: ignore
    return jsonify(SchoologyCalendar.sort_events(user_events))


@rest_endpoint(
    blueprint,
    '/alerts',
    model=EventAlert,
    form=AlertForm,
    methods={'GET', 'POST', 'PUT', 'DELETE'},
)
def alerts(form: AlertForm) -> EventAlert:
    alert = current_user.alerts.filter_by(id=form.id.data).first()

    if alert is None:
        alert = EventAlert(
            event_id=form.event_id.data,
            timedelta=form.timedelta.data,
            type=form.type.data,
        )
        current_user.alerts.append(alert)
    else:
        alert.timedelta = form.timedelta.data
        alert.type = form.type.data

    return alert


@rest_endpoint(
    blueprint,
    '/filter',
    model=CourseFilter,
    form=CourseFilterForm,
    methods={'GET', 'POST', 'PUT', 'DELETE'},
)
def filters(form: CourseFilterForm) -> CourseFilter:
    course_filter = current_user.filters.filter_by(id=form.id.data).first()
    if course_filter is None:
        course_filter = CourseFilter(positive=form.positive.data)
        current_user.filters.append(course_filter)
    else:
        course_filter.positive = form.positive.data
        course_filter.course_ids.delete()

    for course_data in form.course_ids.data:
        course_id = CourseIdentifier.query.get(course_data['id'])
        if course_id is None:
            course_id = CourseIdentifier(**course_data)
            db.session.add(course_id)
        course_filter.course_ids.append(course_id)

    return course_filter


@rest_endpoint(
    blueprint,
    '/colors',
    model=CourseColor,
    form=CourseColorForm,
    methods={'GET', 'POST', 'PUT', 'DELETE'},
)
def colors(form: CourseColorForm) -> CourseColor:
    course_color = current_user.colors.filter_by(id=form.id.data).first()

    # POST
    if course_color is None:
        course_color = CourseColor(
            user_id=current_user.id,
            course_id=form.course.data['id'],
            color=form.color.data,
        )

        course = CourseIdentifier.query.get(form.course.data['id'])

        if course is None:
            course = CourseIdentifier(
                id=form.course.data['id'],
                name=form.course.data['name'],
                realm=form.course.data['realm'],
            )

        course.course_colors.append(course_color)
        current_user.colors.append(course_color)
    # PUT
    else:
        course_color.color = form.color.data

    return course_color


@blueprint.route('/identifiers')
@login_required
# @cache_header(900, key_prefix=lambda: str(current_user.id) + 'identifiers')
def courses():
    user = oauth.schoology.get('users/me', cache=True).json()
    sections = [
        {'id': section['id'], 'name': section['course_title'], 'realm': 'section',}
        for section in oauth.schoology.get(
            f'users/{user["uid"]}/sections', cache=True
        ).json()['section']
    ]
    groups = [
        {'id': group['id'], 'name': group['title'], 'realm': 'group'}
        for group in oauth.schoology.get(
            f'users/{user["uid"]}/groups', cache=True
        ).json()['group']
    ]
    school = (
        [{'id': str(user['building_id']), 'name': 'School Events', 'realm': 'school'}]
        if user.get('building_id')
        else []
    )
    district = (
        [{'id': str(user['school_id']), 'name': 'District Events', 'realm': 'district'}]
        if user.get('school_id')
        else []
    )

    user_identifier = {'id': user['uid'], 'name': 'My Events', 'realm': 'user'}
    return jsonify([user_identifier] + sections + groups + school + district)
