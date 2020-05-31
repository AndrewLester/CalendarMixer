import os
basedir = os.path.abspath(os.path.dirname(__file__))


class Config:
    APP_NAME = 'Calendar Mixer'
    SECRET_KEY = os.environ.get('SECRET_KEY')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
                              'sqlite:///' + os.path.join(basedir, 'app.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_RECONNECT = 1000
    # ClearDB's idle limit is 90 seconds, so set the recycle to be under 90
    if os.environ.get('DATABASE_URL'):
        SQLALCHEMY_POOL_SIZE = 4
        SQLALCHEMY_POOL_RECYCLE = 55
        SQLALCHEMY_POOL_TIMEOUT = 5
    MAIL_SERVER = os.environ.get('MAIL_SERVER')
    MAIL_PORT = int(os.environ.get('MAIL_PORT') or 25)
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS') is not None
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    ADMINS = ['alester220@gmail.com']
    SCHOOLOGY_CLIENT_ID = os.environ.get('CONSUMER_KEY')
    SCHOOLOGY_CLIENT_SECRET = os.environ.get('CONSUMER_SECRET')
    SCHOOLOGY_CLIENT_KWARGS = {}
    REDIS_URL = os.environ.get('REDIS_URL') or 'redis://localhost:6379'
    CACHE_REDIS_URL = REDIS_URL
    CACHE_TYPE = 'redis'
    CACHE_DEFAULT_TIMEOUT = 1000
    CACHE_KEY_PREFIX = 'redis_flask_cache'
    CACHE_REDIS_HOST = REDIS_URL.rsplit(':', 1)[0]
    CACHE_REDIS_PORT = REDIS_URL.rsplit(':', 1)[1]
    SITEMAP_MAX_URL_COUNT = 30
    SITEMAP_URL_SCHEME = 'https'
    SITEMAP_INCLUDE_RULES_WITHOUT_PARAMS = True
    SITEMAP_IGNORE_ENDPOINTS = [
        'calendar.filter_modify', 'calendar.events', 'calendar.courses', 'calendar.alerts',
        'calendar.ical_file', 'main.google_site_verif', 'oauth.authorize', 'flask_sitemap.sitemap'
    ]
    # https://tedboy.github.io/flask/generated/generated/werkzeug.UserAgent.html#werkzeug.UserAgent
    WEB_CRAWLER_USERAGENTS = {'google', 'yahoo', 'aol', 'ask'}
    WEB_CRAWLER_DESCRIPTION = ('Calendar Mixer lets you filter, '
                              'export feeds, and add alarms to your Schoology Calendar. '
                              'Works with Google Calendar and other Calendar applications.'
                              )
