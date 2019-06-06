from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from authlib.flask.client import OAuth
from authlib.client.client import OAuthClient
from authlib.oauth1.client import OAuth1Client
from flask_caching import Cache
from .oauth1_session import get_cached_session, request, cache_on
from flask_bootstrap import Bootstrap


login = LoginManager()
db = SQLAlchemy()
migrate = Migrate(db=db)
cache = Cache()
oauth = OAuth()
bootstrap = Bootstrap()


# Janky compliance fix because schoology only accepts GET requests when fetching request tokens.
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


OAuthClient.get_cached_session = get_cached_session
OAuthClient.request = request
OAuth1Client._fetch_token = fetch_request_token
OAuth1Client.fetch_access_token = fetch_access_token
