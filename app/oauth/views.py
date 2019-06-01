from flask import Blueprint, session, url_for, request, redirect, flash, render_template
from flask_login import current_user
from app import oauth, db, cache
from app.main.models import User
from app.oauth.models import OAuth1Token
from flask_login import current_user, login_user, logout_user, login_required
import requests
import requests_cache


blueprint = Blueprint('oauth', __name__, url_prefix='/oauth', template_folder='templates', static_folder='../static')


@blueprint.route('/logout')
def logout():
    if current_user.is_authenticated:
        db.session.delete(current_user.oauth_token)
        db.session.commit()
        logout_user()
    return redirect(url_for('main.index'))


@blueprint.route('/login')
def login():
    redirect_uri = url_for('.authorize', _external=True)
    return oauth.schoology.authorize_redirect(redirect_uri, oauth_callback=redirect_uri)


@blueprint.route('/authorize')
def authorize():
    token = oauth.schoology.authorize_access_token()
    user_data = oauth.schoology.get('users/me').json()
    if 'username' not in user_data:
        flash('No user data found in this account.')
        return redirect(url_for('main.index'))

    user = User.query.filter_by(username=user_data['username']).first()
    if user is None:
        user = User(username=user_data['username'], email=user_data['primary_email'])

    oauth_token = OAuth1Token(name='schoology',
                              oauth_token=token['oauth_token'],
                              oauth_token_secret=token['oauth_token_secret'])
    db.session.add(oauth_token)
    user.oauth_token = oauth_token
    db.session.add(user)
    db.session.commit()

    login_user(user, remember=True)
    return redirect(url_for('main.index'))
