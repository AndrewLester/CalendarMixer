from flask import Flask, render_template, url_for, request, jsonify, g
from config import Config
from datetime import datetime
from app import login, db, migrate, calendar, main, oauth, cache, bootstrap, cache, csrf
from app.exts import oauth as oauth_client
from app.oauth1_session import get_cached_session
from app import tasks
from authlib.client.client import OAuthClient
from flask_login import current_user
from flask_wtf.csrf import CSRFError
import logging
from logging.handlers import SMTPHandler, RotatingFileHandler
import os
import pytz
import functools
from requests_cache.backends import RedisCache
import redis
import rq
from rq_scheduler import Scheduler


def create_app(config_name=Config):
    app = Flask(__name__.split('.')[0])
    app.config.from_object(config_name)
    app.redis = redis.from_url(app.config['REDIS_URL'])
    app.task_queue = rq.Queue('calendarmixer-tasks', connection=app.redis)
    app.scheduler = Scheduler(queue=app.task_queue, connection=app.redis)
    # Register before requests mixins prior to those that are inside extensions
    register_request_mixins(app)
    register_jobs(app)
    register_extensions(app)
    register_blueprints(app)
    register_errorhandlers(app)
    register_email_logging(app)
    app.shell_context_processor(lambda: {'db': db, 'User': main.models.User,
                                         'Post': main.models.Post,
                                         'CourseFilter': calendar.models.CourseFilter,
                                         'CourseIdentifier': calendar.models.CourseIdentifier,
                                         'Task': main.models.Task})

    # If the user is authenticated get the imageicon from their timezone
    def date_fetch():
        if current_user.is_authenticated:
            return {'date': pytz.timezone(current_user.timezone).localize(datetime.utcnow())}
        return {'date': datetime.now()}
    app.context_processor(date_fetch)
    # register_commands(app)
    return app


def register_jobs(app):
    #app.scheduler.cron('0-59 * * * *', func=tasks.generate_calendars)
    pass

def register_extensions(app):
    login.init_app(app)
    login.login_view = 'oauth.login'
    bootstrap.init_app(app)
    db.init_app(app)
    migrate.init_app(app)
    csrf.init_app(app)
    cache.init_app(app, config=app.config)
    app.request_cache = {}

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


def register_email_logging(app):
    if not app.debug:
        if app.config['MAIL_SERVER']:
            auth = None
            if app.config['MAIL_USERNAME'] or app.config['MAIL_PASSWORD']:
                auth = (app.config['MAIL_USERNAME'], app.config['MAIL_PASSWORD'])
            secure = None
            if app.config['MAIL_USE_TLS']:
                secure = ()
            mail_handler = SMTPHandler(
                mailhost=(app.config['MAIL_SERVER'], app.config['MAIL_PORT']),
                fromaddr='no-reply@' + app.config['MAIL_SERVER'],
                toaddrs=app.config['ADMINS'], subject='CalendarMixer Failure',
                credentials=auth, secure=secure)
            mail_handler.setLevel(logging.ERROR)
            app.logger.addHandler(mail_handler)

        if not os.path.exists('logs'):
            os.mkdir('logs')
        file_handler = RotatingFileHandler('logs/calendarmixer.log', maxBytes=10240,
                                           backupCount=10)
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'))
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)

        app.logger.setLevel(logging.INFO)
        app.logger.info('CalendarMixer startup')


def register_request_mixins(app):
    def before_request():
        if current_user.is_authenticated:
            current_user.last_seen = datetime.utcnow()
            cache = app.request_cache.get(current_user.id)
            if cache is None:
                cache = app.request_cache[current_user.id] = {'cache_name': str(current_user.id)}
            request.cache = cache
            request.content = request.get_data()
            db.session.commit()
        else:
            request.cache = {'cache_name': 'global'}

    app.before_request(before_request)
