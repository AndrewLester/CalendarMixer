import functools
from datetime import timedelta, datetime
import inspect
from typing import (
    Any,
    Callable,
    Dict,
    List,
    Literal,
    Optional,
    Protocol,
    Set,
    Tuple,
    Type,
    TypeVar,
    Union,
)

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
from flask_login.utils import expand_login_view

from wtforms import Form
from wtforms.fields.core import Field

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


def formdata_to_dict(form: Form, exclude: Set[str] = set()) -> Dict[str, Any]:
    data_dict = {}

    print(list(form._fields.items()))
    for k, v in form._fields.items():
        if k in exclude:
            continue

        data_dict[k] = v.data

    return data_dict


FormType = TypeVar('FormType', bound=Form)
ModelType = TypeVar('ModelType', bound=db.Model)


def rest_endpoint(
    blueprint: Blueprint,
    route: str,
    model: ModelType,
    form: Type[FormType],
    methods: Set[HTTPMethod],
) -> Callable:
    def decorator(func: Callable[[FormType], ModelType]) -> Callable[[int], Any]:
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

            if request.method == 'DELETE' and 'DELETE' in methods and id is not None:
                model_instance = model.query.get_or_404(id)
                db.session.delete(model_instance)
                db.session.commit()
                return jsonify(), 204

            form_data = form.from_json(request.get_json())
            if not form_data.validate_on_submit():
                abort(400)

            if request.method == 'POST' and 'POST' in methods:
                model_instance = func(form_data)
                db.session.add(model_instance)
                db.session.commit()
                return model_instance.to_json()  # type: ignore

            if request.method == 'PUT' and 'PUT' in methods and id is not None:
                model_instance = func(form_data)
                db.session.add(model_instance)
                db.session.commit()
                return jsonify(), 200

            # Every possible correct option was exhausted
            return abort(400)

        # Route for non-identifying REST requests
        blueprint.add_url_rule(
            route,
            view_func=wrapper,
            methods=[method for method in methods if method in ('GET', 'POST')],
        )
        # Route for Identifying REST requests
        blueprint.add_url_rule(
            route + '/<int:id>',
            view_func=wrapper,
            methods=[method for method in methods if method in ('PUT', 'DELETE')],
        )

        return wrapper

    return decorator
