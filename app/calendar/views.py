from flask import Blueprint, render_template, flash, redirect, url_for, request, jsonify, current_app
from flask_login import login_required, current_user
from app.calendar.forms import CourseFilterForm
from app.calendar.models import CourseFilter
from app.exts import oauth, db
from datetime import datetime, timedelta
from app.exts import cache
import logging
from functools import wraps
from dateutil.relativedelta import relativedelta

blueprint = Blueprint('calendar', __name__, url_prefix='/calendar', template_folder='../templates', static_folder='../static')

def cache_header(max_age, **ckwargs):
    def decorator(view):
        f = cache.cached(max_age, **ckwargs)(view)

        @wraps(f)
        def wrapper(*args, **wkwargs):
            response = f(*args, **wkwargs)
            response.cache_control.max_age = max_age
            response.cache_control.private = True
            extra = timedelta(seconds=max_age)
            if not response.last_modified:
                response.last_modified = datetime.utcnow()
            response.expires = response.last_modified + extra
            response.headers['Content-Type'] = 'application/json; charset=utf-8'
            response.headers['mimetype'] = 'application/json'
            response.add_etag()
            return response.make_conditional(request)
        return wrapper
    return decorator

@blueprint.route('')
@login_required
def calendar():
    return render_template('calendar.html', title='Calendar')

def get_current_user():
    request.cache_error = False
    try:
        return str(current_user.id)
    except Exception:
        app.logger.error('Caching error with user events.')
        return 'view/%s'

@blueprint.route('/events')
@login_required
@cache_header(1800, key_prefix=get_current_user)
def events():
    return jsonify(sort_events(get_user_events(current_user, request.cache)))


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
    period_start = now + relativedelta(months=-1)
    period_end = now + relativedelta(months=1)
    for realm in realms:
        realm_items = oauth.schoology.get(('users/{}/' + realm.split('/')[0]).format(user.id), **cache)
        realm_items = realm_items.json()
        realm_items = realm_items[realm.split('/')[0][:-1]]
        if not realm_items:
            continue
        for item in realm_items:
            realm_events = oauth.schoology.get((realm + '/events').format(item['id']) +
                                               f'?start_date={period_start.strftime("%Y-%m-%d")}' +
                                               f'&end_date={period_end.strftime("%Y-%m-%d")}', **cache).json()['event']
            events += realm_events
    return events

def event_time_relative(event):
    now = datetime.now()
    start_time = datetime.strptime(event['start'], '%Y-%m-%d %H:%M:%S')
    return start_time - now

def event_time_length(event):
    start_time = datetime.strptime(event['start'].split(' ')[0], '%Y-%m-%d')
    if event['has_end'] == 0:
        return timedelta()
    end_time = datetime.strptime(event['end'].split(' ')[0], '%Y-%m-%d')
    relative = end_time - start_time
    return relative

def sort_events(events):
    events.sort(key=event_time_relative)
    events.sort(key=event_time_length, reverse=True)
    return events
    
