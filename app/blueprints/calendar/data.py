from collections import defaultdict
from datetime import date, datetime
from functools import partial
from time import time
from typing import Any, Dict, List, Tuple
from urllib.parse import urlencode

from dateutil.relativedelta import relativedelta
from flask_login import current_user

from app.blueprints.main.models import User
from app.exts import cache, oauth
from app.schoology.api import get_paged_data


# TODO: Create TypedDict for Event Data (Returned by this function)
# @cache.memoize(timeout=300)
def get_user_events(
    user: User, filter: bool = False, time_range: Tuple[date, date] = None
) -> List[Dict[str, Any]]:
    # This dictionary maps section ids, user ids, group ids to events so that only the ids have to be checked
    # This is more efficient if realms have many events
    events = defaultdict(list)

    if time_range is None:
        now = date.today()
        # Reset date to the start of the current month
        now.replace(day=1)
        # Since the range is at the start of months, go one month further on the end
        time_range = (now + relativedelta(months=-2), now + relativedelta(months=+3))

    range_start, range_end = time_range

    req_function = oauth.schoology.get
    if current_user.is_authenticated:
        # Use user specific cache if the user is logged in
        req_function = partial(req_function, cache=True)

    query_args = {
        'start_date': range_start.strftime("%Y-%m-%d"),
        'end_date': range_end.strftime("%Y-%m-%d"),
        'limit': '200',
    }
    events_json = get_paged_data(
        req_function, f'users/{user.id}/events' + f'?{urlencode(query_args)}', 'event'
    )

    for event in events_json:
        start_date = date.fromisoformat(event['start'].split(' ')[0])
        end_date = date.fromisoformat(
            event['end' if event['has_end'] == 1 else 'start'].split(' ')[0]
        )
        # Throw away events that aren't in the specified time range
        if end_date > range_start and start_date < range_end:
            realm_id = event[event['realm'] + '_id']
            events[str(realm_id)].append(event)

    realm_ids = list(events.keys())

    if filter:
        user.apply_filters(realm_ids)

    # Add all events that are in unfiltered realms to the combined events list
    combined_events = []
    for realm_id in realm_ids:
        combined_events += events[realm_id]
    return combined_events
