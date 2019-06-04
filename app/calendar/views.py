from flask import Blueprint, render_template, flash, redirect, url_for, request, jsonify
from flask_login import login_required, current_user
from app.calendar.forms import CourseFilterForm
from app.calendar.models import CourseFilter
from app.exts import oauth, db
from datetime import datetime
from dateutil.relativedelta import relativedelta

blueprint = Blueprint('calendar', __name__, url_prefix='/calendar', template_folder='../templates', static_folder='../static')


@blueprint.route('')
@login_required
def calendar():
    print(oauth.schoology.get('users/me', **request.cache).json())
    print(current_user.id)
    return render_template('calendar.html')


@blueprint.route('/events')
@login_required
def events():
    return jsonify(get_user_events(current_user, request.cache))


@blueprint.route('/filter', methods=['GET', 'POST'])
@login_required
def filter_modify():
    if request.method == 'GET':
        current_user.apply_filters(None)
        return jsonify([item.to_json() for item in current_user.filters])
    form = CourseFilterForm()
    if form.validate_on_submit():
        filter = CourseFilter(positive=(not form.negative), course_ids=form.course_ids)
        db.session.add(filter)
        db.session.commit()


realms = frozenset(['sections/{}', 'groups/{}'])
def get_user_events(user, cache):
    events = []
    now = datetime.now()
    period_end = now + relativedelta(months=1)
    for realm in realms:
        realm_items = oauth.schoology.get(('users/{}/' + realm.split('/')[0]).format(user.id), **cache).json()
        realm_items = realm_items[realm.split('/')[0][:-1]]
        if not realm_items:
            continue
        for item in realm_items:
            realm_events = oauth.schoology.get((realm + '/events').format(item['id']) +
                                               f'?start_date={now.strftime("%Y-%m-%d")}' +
                                               f'&end_date={period_end.strftime("%Y-%m-%d")}', **cache).json()['event']
            for event in realm_events:
                start_time = datetime.strptime(event['start'], '%Y-%m-%d %H:%M:%S')
                if now <= start_time <= period_end:
                    events.append(event)
    return events
