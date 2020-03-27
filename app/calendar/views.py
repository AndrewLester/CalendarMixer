from flask import Blueprint, render_template, request, jsonify, current_app, make_response, flash, g
from flask_login import login_required, current_user
from app.calendar.forms import CourseFilterForm
from app.calendar.models import CourseFilter
from app.main.models import User
from app.exts import oauth, db
from datetime import datetime, timedelta
from app.exts import cache, csrf
from app.schoology.api import get_paged_data
import json
from collections import defaultdict
import itertools
import re
import ics
import pytz
import functools
from datetime import datetime
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
            extra = timedelta(seconds=max_age)
            if response.last_modified is None:
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
    return render_template('calendar.html', title='Calendar', filters=current_user.filters, 
                            colors=current_user.colors.all(), id=current_user.id,
                            ical_secret=current_user.ical_secret,
                            base_url=request.url_root.split('://')[1])

def get_current_user(extra=''):
    try:
        return str(current_user.id) + extra
    except Exception:
        current_app.logger.error('Caching error with user events.')
        return 'view/%s'

@blueprint.route('/ical/<int:user_id>/<secret>/calendar.ics')
def ical_file(user_id, secret):
    user: User = User.query.filter_by(id=user_id).first()

    if user is None:
        flash('File not found')
        return render_template('500.html'), 500

    if user.ical_secret == secret:
        g.current_id = user.id
        events_list = get_user_events(user, {}, filter=True)
        cal = ics.Calendar(events=make_calendar_events(events_list, pytz.timezone(user.timezone)), creator='CalendarMixer')
        response = make_response(''.join(cal))
        response.headers["Content-Disposition"] = "inline; filename=calendar.ics"
        response.headers["Content-Type"] = "text/calendar; charset=utf-8"
        return response

    flash('File not found')
    return render_template('500.html'), 500


def get_url_prop(prop_name):
    """
    Get the value of a url property from outside of its handler
    Example: /<int:user_id/
    :param prop_name:
    :return: url property value
    """
    pass


@blueprint.route('/events')
@login_required
@cache_header(1800, key_prefix=functools.partial(get_current_user, 'events'))
def events():
    return jsonify(sort_events(get_user_events(current_user, request.cache)))


@blueprint.route('/filter', methods=['GET', 'POST'])
@login_required
def filter_modify():
    if request.method == 'GET':
        # current_user.apply_filters(None)
        return jsonify([item.to_json() for item in current_user.filters])
    
    form_data = CourseFilterForm()
    if form_data.valid:
        course_filter = current_user.filters.filter_by(id=form_data.filter_id).first()
        if course_filter is None:
            course_filter = CourseFilter(
                positive=form_data.positive,
                course_ids=form_data.course_ids)
            current_user.filters.append(course_filter)
        else:
            course_filter.positive = form_data.positive
            course_filter.course_ids.delete()
            course_filter.course_ids = form_data.course_ids

        db.session.add(current_user)
        db.session.commit()
        return jsonify(data=[item.to_json() for item in current_user.filters])
    return jsonify(data='Invalid filter data'), 400

@blueprint.route('/identifiers')
@login_required
@cache_header(900, key_prefix=functools.partial(get_current_user, 'identifiers'))
def courses():
    user = oauth.schoology.get('users/me', **request.cache).json()
    sections = [{section['id']: section['course_title'], 'realm': 'section'} for section in oauth.schoology.get(f'users/{user["uid"]}/sections', **request.cache).json()['section']]
    groups = [{group['id']: group['title'], 'realm': 'group'} for group in oauth.schoology.get(f'users/{user["uid"]}/groups', **request.cache).json()['group']]
    school = [{str(user['building_id']): 'School Events', 'realm': 'school'}]
    district = [{str(user['school_id']): 'District Events', 'realm': 'district'}]
    userEvents = [{user['uid']: 'My Events', 'realm': 'user'}]
    return jsonify(userEvents + sections + groups + school + district)

# TODO: Cache this with cache.memoize
def get_user_events(user: User, cache, filter=False):
    # This dictionary maps section ids, user ids, group ids to events so that only the ids have to be checked
    # This is more efficient if realms have many events
    events = defaultdict(list)

    now = datetime.now()
    period_start = now + relativedelta(months=-2)
    period_end = now + relativedelta(months=2)
    time_queries = f'?start_date={period_start.strftime("%Y-%m-%d")}&end_date={period_end.strftime("%Y-%m-%d")}'

    events_json = get_paged_data(
        oauth.schoology.get,
        f'users/{user.id}/events' + time_queries + '&limit=200',
        'event',
        **cache
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

def make_calendar_events(json, tz):
    events_list = []
    for event in json:
        if len(event['end']) == 0:
            event['end'] = event['start']
        cal_event = ics.Event(
            event['title'], 
            string_to_time(event['start'], tz), string_to_time(event['end'], tz), 
            None, str(event['id']), 
            event['description'], None
        )
        if event['all_day'] == 1:
            cal_event.make_all_day()
        events_list.append(cal_event)

    return events_list

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

def string_to_time(string: str, tz = pytz.utc) -> datetime:
    """Turn a schoology time string into a datetime object with tz set to UTC"""
    time: datetime = datetime.strptime(string, '%Y-%m-%d %H:%M:%S')
    # Turn naive time into local time at the specified timezone. Accounts for DST
    time = tz.localize(time)
    # Return time back in UTC
    return time.astimezone(pytz.utc)