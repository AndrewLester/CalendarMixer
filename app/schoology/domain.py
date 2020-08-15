from typing import Optional
from wtforms.validators import url
import re
from urllib.parse import urlparse

# https://fccps.schoology.com/oauth/authorize
# www.schoology.com, schoolname.schoology.com, lms.schoolname.org


BASE_DOMAIN = 'https://{domain}/oauth/authorize'

domain_regex = r'[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)'
def is_domain(string: str) -> bool:
    return re.match(domain_regex, string) is not None


def authorization_domain(prefix: Optional[str]) -> str:
    """
    Takes a custom Schoology domain or subdomain and returns the authorization url
    to use for oauth authorization
    """
    if not prefix:
        # If they put in blank or invalid, use the schoology domain
        domain = 'www.schoology.com'
    elif is_domain(prefix):
        # If they gave a custom domain/subdomain for their school, use its entirety
        # But parse out any excess url stuff (https://, /, #)
        parsed = urlparse(prefix)
        domain = parsed.netloc or parsed.path
    else:
        # If the domain prefix is really a prefix, stick it in front of the schoology url
        domain = f'{prefix}.schoology.com'

    return BASE_DOMAIN.format(domain=domain)
