from flask import Blueprint, render_template, flash, url_for, request
from flask_login import login_required, current_user
from app.exts import oauth

blueprint = Blueprint('main', __name__, template_folder='../../templates', static_folder='../../static')


@blueprint.route('/')
def index():
    return render_template('index.html', title='Home')


@blueprint.route('/profile')
@login_required
def profile():
    resp = oauth.schoology.get('users/me', cache=True)
    if resp.status_code >= 400:
        flash('Schoology API error...')
        return render_template('index.html')
    return render_template('user.html', profile=resp.json())
