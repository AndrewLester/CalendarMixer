from app import app, db
from app.models import User, Post
from datetime import datetime


@app.context_processor
def date():
    return {'date': datetime.now()}


@app.shell_context_processor
def make_shell_context():
    return {'db': db, 'User': User, 'Post': Post}

