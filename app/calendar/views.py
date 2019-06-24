from flask import Blueprint, render_template, flash, redirect, url_for, request, jsonify, current_app
from flask_login import login_required, current_user
from app.calendar.forms import CourseFilterForm
from app.calendar.models import CourseFilter
from app.exts import oauth, db
from datetime import datetime, timedelta
from app.exts import cache
import json
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
            # response.add_etag()
            return response.make_conditional(request)
        return wrapper
    return decorator

@blueprint.route('')
@login_required
def calendar():
    return render_template('calendar.html', title='Calendar', filters=current_user.filters, 
                            colors=current_user.colors.all())

def get_current_user():
    try:
        return str(current_user.id)
    except Exception:
        current_app.logger.error('Caching error with user events.')
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
        current_user.filters.append(filter)
        db.session.add(filter)
        db.session.commit()

@blueprint.route('/identifiers')
@login_required
def courses():
    user = oauth.schoology.get('users/me', **request.cache).json()
    sections = [{section['id']: section['course_title'], 'realm': 'section'} for section in oauth.schoology.get(f'users/{user["uid"]}/sections', **request.cache).json()['section']]
    groups = [{group['id']: group['title'], 'realm': 'group'} for group in oauth.schoology.get(f'users/{user["uid"]}/groups', **request.cache).json()['group']]
    school = [{str(user['building_id']): 'School Events', 'realm': 'school'}]
    district = [{str(user['school_id']): 'District Events', 'realm': 'district'}]
    userEvents = [{user['uid']: 'My Events', 'realm': 'user'}]
    return jsonify(userEvents + sections + groups + school + district)

realms = frozenset(['sections/{}', 'groups/{}'])
def get_user_events(user, cache):
    events = []
    now = datetime.now()
    period_start = now + relativedelta(months=-1)
    period_end = now + relativedelta(months=1)
    time_queries = f'?start_date={period_start.strftime("%Y-%m-%d")}&end_date={period_end.strftime("%Y-%m-%d")}'
    for realm in realms:
        realm_items = oauth.schoology.get(('users/{}/' + realm.split('/')[0]).format(user.id), **cache)
        realm_items = realm_items.json()
        realm_items = realm_items[realm.split('/')[0][:-1]]
        if not realm_items:
            continue
        for item in realm_items:
            realm_events = oauth.schoology.get((realm + '/events').format(item['id']) +
                                               time_queries, **cache).json()['event']
            events += realm_events
    eventsTwo = oauth.schoology.get(f'users/{user.id}/events' + time_queries + '&limit=200', **cache).json()['event']
    school_id = oauth.schoology.get('users/me', **cache).json()['building_id']
    events += oauth.schoology.get(f'schools/{school_id}/events' + time_queries, **cache).json()['event']
    return [json.loads(string) for string in set((json.dumps(dic) for dic in events))]

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
    
