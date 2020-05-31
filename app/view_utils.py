import functools
from datetime import timedelta, datetime
import inspect
from typing import Protocol

from flask import Response, request, make_response, request, current_app, render_template
from flask_login import current_user

from app.exts import cache


class LocalizedTz(Protocol):
    def localize(self, dt, is_dst=False) -> datetime: ...


def cache_header(max_age, **ckwargs):
    def decorator(view):
        f = cache.cached(max_age, **ckwargs)(view)

        @functools.wraps(f)
        def wrapper(*args, **kwargs):
            # Coerce view-function output to a response
            response: Response = make_response(f(*args, **kwargs))
            response.cache_control.max_age = max_age
            extra = timedelta(seconds=max_age)
            if response.last_modified is None:
                response.last_modified = datetime.utcnow()
            response.expires = response.last_modified + extra
            response.add_etag()
            return response.make_conditional(request)
        return wrapper
    return decorator


def web_crawler_cloak(func):
    """
    Cloaks a view function so that it only displays basic info to webcrawlers,
    rather than redirecting to some form of login for normal users.

    Uses the view functions name in title case as the info title and the view function's
    docstring as the description.
    """
    @functools.wraps(func)
    def decorated_view(*args, **kwargs):
        if request.user_agent.browser in current_app.config['WEB_CRAWLER_USERAGENTS']:
            desc = func.__doc__ or 'Calendar Mixer'
            return render_template('web_crawler.html', title=func.__name__.title(),
                                   desc=inspect.cleandoc(desc).replace('\n', ' '))
        return func(*args, **kwargs)
    return decorated_view


def login_required(func):
    @functools.wraps(func)
    def decorated_view(*args, **kwargs):
        if current_app.config.get('LOGIN_DISABLED'):
            return func(*args, **kwargs)
        elif request.user_agent.browser in current_app.config['WEB_CRAWLER_USERAGENTS']:
            desc = func.__doc__ or 'Calendar Mixer'
            return render_template('web_crawler.html', title=func.__name__.title(),
                                   desc=inspect.cleandoc(desc).replace('\n', ' '))
        elif not current_user.is_authenticated:
            return current_app.login_manager.unauthorized()
        return func(*args, **kwargs)
    return decorated_view
