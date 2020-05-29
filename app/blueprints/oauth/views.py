from flask import Blueprint, session, url_for, request, redirect, flash, render_template
from flask_login import current_user
from app import oauth, db, cache
from app.blueprints.main.models import User
from .models import OAuth1Token
from flask_login import current_user, login_user, logout_user, login_required
from authlib.client.errors import MissingTokenError
from authlib.common.errors import AuthlibBaseError
from secrets import token_urlsafe
from werkzeug.routing import BuildError


blueprint = Blueprint('oauth', __name__, url_prefix='/oauth',
                      template_folder='../..templates', static_folder='../../static')


@blueprint.route('/logout')
@login_required
def logout():
    if current_user.is_authenticated:
        logout_user()
    return redirect(url_for('main.index'))


@blueprint.route('/login')
def login():
    if current_user.is_authenticated:
        flash('You\'re already logged in.')
        return redirect(url_for('main.index'))

    original_endpoint = request.args.get('next') or ''
    redirect_uri = url_for('.authorize', _external=True) + f'?next={original_endpoint}'
    return oauth.schoology.authorize_redirect(redirect_uri, oauth_callback=redirect_uri)


@blueprint.route('/authorize')
def authorize():
    try:
        token = oauth.schoology.authorize_access_token()
    except (MissingTokenError, AuthlibBaseError):
        flash('Please restart the login procedure...')
        return render_template('500.html'), 500

    user_data = oauth.schoology.get('users/me').json()
    if 'username' not in user_data:
        flash('No user data found in this account.')
        return redirect(url_for('main.index'))

    user = User.query.filter_by(username=user_data['username']).first()
    if user is None:
        user = User(id=user_data['uid'], username=user_data['username'], email=user_data['primary_email'],
                    ical_secret=token_urlsafe(32), timezone=user_data['tz_name'])

    oauth_token = OAuth1Token(
        name='schoology',
        oauth_token=token['oauth_token'],
        oauth_token_secret=token['oauth_token_secret']
    )

    db.session.add(oauth_token)
    user.oauth_token = oauth_token
    db.session.add(user)
    db.session.commit()

    login_user(user, remember=True)
    next_endpoint = request.args.get('next')
    return redirect(next_endpoint)
