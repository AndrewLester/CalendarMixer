from flask import Blueprint, render_template, flash, url_for, request
from flask_login import login_required, current_user
from app.exts import oauth
from app.view_utils import cache_header

blueprint = Blueprint('main', __name__, template_folder='../../templates', static_folder='../../static')


@blueprint.route('/')
@cache_header(1800)
def index():
    return render_template('index.html', title='Home')


@blueprint.route('/about')
@cache_header(1800)
def about():
    return render_template('about.html', title='About')


@blueprint.route('/privacy')
@cache_header(1800)
def privacy():
    return render_template('privacy.html', title='Privacy Policy')


@blueprint.route('/profile')
@login_required
def profile():
    resp = oauth.schoology.get('users/me', cache=True)
    if resp.status_code >= 400:
        flash('Schoology API error...')
        return render_template('index.html')
    return render_template('user.html', profile=resp.json())

