import functools
from datetime import timedelta, datetime
import inspect
from typing import Any, Callable, Dict, List, Literal, Optional, Protocol, Set, Tuple, Type, Union

from flask import (
    abort,
    Response,
    request,
    make_response,
    request,
    current_app,
    render_template,
)
from flask.blueprints import Blueprint
from flask.json import jsonify
from flask_login import current_user

from wtforms import Form

from app.exts import cache, db


HTTPMethod = Union[Literal['POST'], Literal['GET'], Literal['PUT'], Literal['DELETE']]


class LocalizedTz(Protocol):
    def localize(self, dt, is_dst=False) -> datetime:
        ...


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
        if request.user_agent.bowser in current_app.config['WEB_CRAWLER_USERAGENTS']:
            desc = func.__doc__ or 'Calendar Mixer'
            return render_template(
                'web_crawler.html',
                title=func.__name__.title(),
                desc=inspect.cleandoc(desc).replace('\n', ' '),
            )
        return func(*args, **kwargs)

    return decorated_view


def login_required(func):
    @functools.wraps(func)
    def decorated_view(*args, **kwargs):
        if current_app.config.get('LOGIN_DISABLED'):
            return func(*args, **kwargs)
        elif request.user_agent.browser in current_app.config['WEB_CRAWLER_USERAGENTS']:
            desc = func.__doc__ or 'Calendar Mixer'
            return render_template(
                'web_crawler.html',
                title=func.__name__.title(),
                desc=inspect.cleandoc(desc).replace('\n', ' '),
            )
        elif not current_user.is_authenticated:
            return current_app.login_manager.unauthorized()
        return func(*args, **kwargs)

    return decorated_view


def formdata_to_dict(form: Form) -> Dict[Any, Any]:
    data_dict = {}

    for k, v in form.__dict__.items():
        data_dict[k] = v.data

    return data_dict


def rest_endpoint(
    name: str,
    blueprint: Blueprint,
    route: str,
    model: db.Model,
    form_type: Type[Form],
    methods: Set[HTTPMethod],
) -> Callable:
    def decorator(func: Callable[[Optional[int]], None]) -> Callable[[int], Any]:
        # Route for non-identifying REST requests
        @blueprint.route(route, methods=[
            method for method in methods if method in ('GET', 'POST')
        ])
        # Route for Identifying REST requests
        @blueprint.route(route + '/<int:id>', methods=[
            method for method in methods if method in ('PUT', 'DELETE')
        ])
        @login_required
        @functools.wraps(func)
        def wrapper(id: Optional[int] = None):
            if request.method == 'GET' and 'GET' in methods:
                return jsonify(
                    [
                        instance.to_json()
                        for instance in model.query.filter_by(
                            user_id=current_user.id
                        ).all()
                    ]
                )

            if request.method == 'DELETE' and 'DELETE' in methods:
                model_instance = model.query.get_or_abort(id)
                db.session.delete(model_instance)
                db.session.commit()
                return jsonify(), 204

            form = form_type.from_json(request.get_json())
            if not form.validate_on_submit():
                abort(400)

            if request.method == 'POST' and 'POST' in methods:
                model_instance = model(**formdata_to_dict(form))
                db.session.add(model_instance)
                db.session.commit()
                return model_instance.to_json()

            if request.method == 'PUT' and 'PUT' in methods:
                model_instance = model.get_or_abort(id)
                db.session.delete(model_instance)
                model_instance = model(**formdata_to_dict(form))
                db.session.add(model_instance)
                db.session.commit()
                return jsonify(), 200

        return wrapper

    return decorator
