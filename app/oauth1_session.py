from functools import partial

from authlib.client.errors import MissingTokenError
from authlib.client.errors import OAuthError
from authlib.client.oauth1_session import OAuth1Client, OAuth1Auth
from authlib.client.oauth2_session import OAuth2Session
from authlib.common.urls import urlparse
from authlib.deprecate import deprecate
from authlib.oauth1 import (
    SIGNATURE_HMAC_SHA1,
    SIGNATURE_TYPE_HEADER
)
from flask import current_app
from flask_login import current_user
from requests_cache import CachedSession


class OAuth1CachedSession(OAuth1Client, CachedSession):
    auth_class = OAuth1Auth

    def __init__(self, client_id, client_secret=None,
                 token=None, token_secret=None,
                 redirect_uri=None, rsa_key=None, verifier=None,
                 signature_method=SIGNATURE_HMAC_SHA1,
                 signature_type=SIGNATURE_TYPE_HEADER,
                 force_include_body=False, cache_name='cache',
                 backend='redis', expire_after=300, **kwargs):
        CachedSession.__init__(self, cache_name, backend, expire_after)
        OAuth1Client.__init__(
            self, session=self,
            client_id=client_id, client_secret=client_secret,
            token=token, token_secret=token_secret,
            redirect_uri=redirect_uri, rsa_key=rsa_key, verifier=verifier,
            signature_method=signature_method, signature_type=signature_type,
            force_include_body=force_include_body, **kwargs)

    def authorization_url(self, url, request_token=None, **kwargs):  # pragma: no cover
        deprecate('Use "create_authorization_url" instead', '0.12')
        return self.create_authorization_url(url, request_token, **kwargs)

    def rebuild_auth(self, prepared_request, response):
        """When being redirected we should always strip Authorization
        header, since nonce may not be reused as per OAuth spec.
        """
        if 'Authorization' in prepared_request.headers:
            # If we get redirected to a new host, we should strip out
            # any authentication headers.
            prepared_request.headers.pop('Authorization', True)
            prepared_request.prepare_auth(self.auth)

    @staticmethod
    def handle_error(error_type, error_description):
        raise OAuthError(error_type, error_description)


def get_cached_session(self, cache_name, backend, expire_after):
    if self.request_token_url:
        session = OAuth1CachedSession(
            self.client_id, self.client_secret,
            **self.client_kwargs, cache_name=cache_name,
            backend=backend, expire_after=expire_after
        )
    else:
        session = OAuth2Session(
            client_id=self.client_id,
            client_secret=self.client_secret,
            refresh_token_url=self.refresh_token_url,
            refresh_token_params=self.refresh_token_params,
            **self.client_kwargs
        )
        # only OAuth2 has compliance_fix currently
        if self.compliance_fix:
            self.compliance_fix(session)

    session.headers['User-Agent'] = self.DEFAULT_USER_AGENT
    return session


def request(self, method, url, token=None, **kwargs):
    if self.api_base_url and not url.startswith(('https://', 'http://')):
        url = urlparse.urljoin(self.api_base_url, url)

    if 'cache' not in kwargs or not current_user.is_authenticated:
        if 'cache' in kwargs:
            current_app.logger.warn(f'Attempted to utilize user cache for url: {url}')
        function = self._get_session
    else:
        del kwargs['cache']
        cache_name = str(current_user.id)
        function = partial(self.get_cached_session, self, cache_name)

    with function() as session:
        if kwargs.get('withhold_token'):
            return session.request(method, url, **kwargs)

        request = kwargs.pop('request', None)
        if token is None and self._fetch_token and request:
            token = self._fetch_token(request)
        if token is None:
            raise MissingTokenError()

        session.token = token
        return session.request(method, url, **kwargs)
