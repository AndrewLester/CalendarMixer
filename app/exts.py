import wtforms_json
from authlib.client.client import OAuthClient
from authlib.flask.client import OAuth
from authlib.oauth1.client import OAuth1Client
from flask_bootstrap import Bootstrap
from flask_caching import Cache
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from flask_wtf.csrf import CSRFProtect
from flask_sitemap import Sitemap

from .oauth1_session import request

login = LoginManager()
db = SQLAlchemy()
migrate = Migrate(db=db)
cache = Cache()
oauth = OAuth()
bootstrap = Bootstrap()
csrf = CSRFProtect()
sitemap = Sitemap()
wtforms_json.init()


# # Janky compliance fix because schoology only accepts GET requests when fetching request tokens.
def fetch_request_token(self, url, **kwargs):
    resp = self.session.get(url, auth=self.auth, **kwargs)
    token = self.parse_response_token(resp.status_code, resp.text)
    self.token = token
    return token


def fetch_access_token(self, url, verifier=None, **kwargs):
    if verifier:
        self._client.verifier = verifier
    token = self._fetch_token(url, **kwargs)
    self._client.verifier = None
    return token


OAuthClient.request = request
OAuth1Client._fetch_token = fetch_request_token
OAuth1Client.fetch_access_token = fetch_access_token
