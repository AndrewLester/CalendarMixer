import functools
from datetime import timedelta, datetime
from typing import Protocol

from flask import Response, request

from app.exts import cache


class LocalizedTz(Protocol):
    def localize(self, dt, is_dst=False) -> datetime: ...


def cache_header(max_age, **ckwargs):
    def decorator(view):
        f = cache.cached(max_age, **ckwargs)(view)

        @functools.wraps(f)
        def wrapper(*args, **kwargs):
            response: Response = f(*args, **kwargs)
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