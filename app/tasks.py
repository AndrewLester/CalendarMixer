import time
from ics import Calendar, Event
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from app.exts import oauth
import json

def example(seconds):
    print('Starting task')
    for i in range(seconds):
        print(i)
        time.sleep(1)


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


realms = frozenset(['sections/{}', 'groups/{}'])
def get_events(user, request_cache):
    events = []
    now = datetime.now()
    period_start = now + relativedelta(months=-2)
    period_end = now + relativedelta(months=2)
    time_queries = f'?start_date={period_start.strftime("%Y-%m-%d")}&end_date={period_end.strftime("%Y-%m-%d")}'
    for realm in realms:
        realm_items = oauth.schoology.get(('users/{}/' + realm.split('/')[0]).format(user.id), request_cache)
        realm_items = realm_items.json()
        realm_items = realm_items[realm.split('/')[0][:-1]]
        if not realm_items:
            continue
        for item in realm_items:
            realm_events = oauth.schoology.get((realm + '/events').format(item['id']) +
                                               time_queries, request_cache).json()['event']
            events += realm_events
    user_events = oauth.schoology.get(f'users/{user.id}/events' + time_queries + '&limit=200', request_cache).json()['event']
    school_id = oauth.schoology.get('users/me', request_cache).json()['building_id']
    events += oauth.schoology.get(f'schools/{school_id}/events' + time_queries, request_cache).json()['event']
    events += user_events
    return [json.loads(string) for string in set((json.dumps(dic) for dic in events))]


def generate_ical(user, request_cache):
    cal = Calendar()
    events = get_events(user, request_cache)
    for event in events:
        e = Event()
        cal.events.add(e)



