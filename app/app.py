from flask import Flask, render_template, url_for
from config import Config
from datetime import datetime
from app import login, db, migrate, main, oauth, cache
from app.exts import oauth as oauth_client
from flask_login import current_user
import logging
from logging.handlers import SMTPHandler, RotatingFileHandler
import os


def create_app(config_name=Config):
    app = Flask(__name__.split('.')[0])
    app.config.from_object(config_name)
    register_extensions(app)
    register_blueprints(app)
    register_errorhandlers(app)
    register_email_logging(app)
    app.shell_context_processor(lambda: {'db': db, 'User': db.User, 'Post': db.Post})
    app.context_processor(lambda: {'date': datetime.now()})
    # register_commands(app)
    return app


def register_extensions(app):
    login.init_app(app)
    login.login_view = 'oauth.login'
    db.init_app(app)
    migrate.init_app(app)
    cache.init_app(app, config=app.config)

    def fetch_token(name):
        item = oauth.models.OAuth1Token.query.filter_by(
            name=name, user_id=current_user.id
        ).first()

        if item:
            return item.to_token()

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


def register_errorhandlers(app):
    app.register_error_handler(404, lambda error: (render_template('404.html'), 404))

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
        file_handler = RotatingFileHandler('logs/microblog.log', maxBytes=10240,
                                           backupCount=10)
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'))
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)

        app.logger.setLevel(logging.INFO)
        app.logger.info('Microblog startup')
