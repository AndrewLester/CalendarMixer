import functools
from collections import defaultdict
from datetime import datetime

import pytz
import redis
from authlib.client.client import OAuthClient
from flask import Flask, render_template, request, jsonify, g, send_from_directory
from flask_login import current_user
from flask_wtf.csrf import CSRFError
from flask_sitemap import sitemap_page_needed
from requests_cache.backends import RedisCache

from app import login, db, migrate, bootstrap, cache, csrf, sitemap
from app.blueprints import calendar, main, oauth
from app.exts import oauth as oauth_client
from app.oauth1_session import get_cached_session
from config import Config


def create_app(config_name=Config):
    app = Flask(__name__.split('.')[0])
    app.config.from_object(config_name)
    app.redis = redis.from_url(app.config['REDIS_URL'])
    app.config['SITEMAP_VIEW_DECORATORS'] = [load_page]
    # Register before requests mixins prior to those that are inside extensions
    register_extensions(app)
    register_blueprints(app)
    register_errorhandlers(app)
    app.shell_context_processor(lambda: {
        'db': db, 'User': main.models.User,
        'CourseFilter': calendar.models.CourseFilter,
        'CourseIdentifier': calendar.models.CourseIdentifier
    })

    app.context_processor(inject_date)
    return app


def inject_date():
    # If the user is authenticated get the imageicon from their timezone
    if current_user.is_authenticated:
        tz = pytz.timezone(current_user.timezone)
        return {'date': pytz.utc.localize(datetime.utcnow()).astimezone(tz)}
    # The only thing that matters here is the day, which should be 31 if the user isn't logged in
    return {'date': datetime(2020, 1, 31)}


def register_extensions(app):
    login.init_app(app)
    login.login_view = 'oauth.login'
    bootstrap.init_app(app)
    db.init_app(app)
    with app.app_context():
        if db.engine.url.drivername == 'sqlite':
            migrate.init_app(app, db, render_as_batch=True)
        else:
            migrate.init_app(app, db)
    csrf.init_app(app)
    sitemap.init_app(app)
    def static_from_route():
        return send_from_directory(app.static_folder, request.path[1:])
    app.add_url_rule('/robots.txt', 'static_from_root', static_from_route)
    cache.init_app(app, config=app.config)

    def fetch_token(name):
        item = oauth.models.OAuth1Token.query.filter_by(
            name=name, user_id=(getattr(current_user, 'id', False) or g.current_id)
        ).first()
        if item:
            return item.to_token()

    # Define default args for the get_cached_session function. Uses app's redis connection
    OAuthClient.get_cached_session = functools.partial(
        get_cached_session, 
        backend=RedisCache(connection=app.redis), 
        expire_after=300
    )

    oauth_client.init_app(app, fetch_token=fetch_token, cache=cache)
    oauth_client.register(
        name='schoology',
        api_base_url='https://api.schoology.com/v1/',
        request_token_url='https://api.schoology.com/v1/oauth/request_token',
        access_token_url='https://api.schoology.com/v1/oauth/access_token',
        authorize_url='https://fccps.schoology.com/oauth/authorize',
        client_id=app.config['SCHOOLOGY_CLIENT_ID'],
        client_key=app.config['SCHOOLOGY_CLIENT_SECRET']
    )


def register_blueprints(app):
    app.register_blueprint(main.views.blueprint)
    app.register_blueprint(oauth.views.blueprint)
    app.register_blueprint(calendar.views.blueprint)


def register_errorhandlers(app):
    app.register_error_handler(404, lambda error: (render_template('404.html'), 404))
    app.register_error_handler(CSRFError, lambda error: (jsonify({'reason': error.description}), 400))

    def internal_error(error):
        db.session.rollback()
        return render_template('500.html'), 500

    app.register_error_handler(500, internal_error)

@sitemap_page_needed.connect
def create_page(app, page, urlset):
    cache.set(str(page), sitemap.render_page(urlset=urlset))

def load_page(fn):
    @functools.wraps(fn)
    def loader(*args, **kwargs):
        page = kwargs.get('page')
        data = cache.get(str(page))
        return data if data else fn(*args, **kwargs)
    return loader
