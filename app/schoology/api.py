from datetime import datetime
import pytz
from app.view_utils import LocalizedTz


def get_paged_data(
    request_function, 
    endpoint: str, 
    data_key: str,
    next_key: str = 'links',
    max_pages: int = -1, 
    *request_args, 
    **request_kwargs
):
    data = []
    page = 0
    next_url = ''
    while next_url is not None and (page < max_pages or max_pages == -1):
        json = request_function(next_url if next_url else endpoint, *request_args, **request_kwargs).json()
        try:
            next_url = json[next_key]['next']
        except KeyError:
            next_url = None
        data += json[data_key]
        page += 1

    return data


def schoology_to_datetime(string: str, tz: LocalizedTz = pytz.utc, return_localized: bool = False) -> datetime:
    """Turn a Schoology time string into a datetime object with tz set to UTC"""
    time: datetime = datetime.strptime(string, '%Y-%m-%d %H:%M:%S')
    # Turn naive time into local time at the specified timezone. Accounts for DST
    time = tz.localize(time)
    # Return time back in UTC
    if return_localized:
        return time
    return time.astimezone(pytz.utc)
