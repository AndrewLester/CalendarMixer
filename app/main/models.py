from datetime import datetime
from app.exts import db, login
from flask import current_app
from flask_login import UserMixin
from hashlib import md5
import redis
import rq


@login.user_loader
def load_user(id):
    user = User.query.get(int(id))
    if user is None or user.oauth_token is None:
        user = None
    return user


class User(UserMixin, db.Model):
    id = db.Column(db.String(36), primary_key=True)
    username = db.Column(db.String(64), index=True, unique=True)
    email = db.Column(db.String(120), index=True, unique=True)
    posts = db.relationship('Post', backref='author', lazy='dynamic')
    ical_secret = db.Column(db.String(64), index=True, unique=True)
    oauth_token = db.relationship('OAuth1Token', uselist=False, back_populates='user')
    filters = db.relationship('CourseFilter', backref='user', lazy='dynamic')
    colors = db.relationship('CourseIdentifier', backref='colorUser', lazy='dynamic')
    tasks = db.relationship('Task', backref='user', lazy='dynamic')
    last_seen = db.Column(db.DateTime, default=datetime.utcnow)

    def avatar(self, size):
        digest = md5(self.email.lower().encode('utf-8')).hexdigest()
        return 'https://www.gravatar.com/avatar/{}?d=identicon&s={}'.format(
            digest, size)

    def apply_filters(self, iterable):
        for filter in self.filters:
            iterable = filter.apply(iterable)

    def launch_task(self, name, description, *args, **kwargs):
        rq_job = current_app.task_queue.enqueue('app.tasks.' + name, self.id,
                                                *args, **kwargs)
        task = Task(id=rq_job.get_id(), name=name,
                    user=self)
        db.session.add(task)
        return task

    def get_tasks_in_progress(self):
        return Task.query.filter_by(user=self, complete=False).all()

    def get_task_in_progress(self, name):
        return Task.query.filter_by(name=name, user=self,
                                    complete=False).first()

    def __repr__(self):
        return '<User {}>'.format(self.username)


class Task(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(128), index=True)
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'))
    complete = db.Column(db.Boolean, default=False)

    def get_rq_job(self):
        try:
            rq_job = rq.job.Job.fetch(self.id, connection=current_app.redis)
        except (redis.exceptions.RedisError, rq.exceptions.NoSuchJobError):
            return None
        return rq_job

    def get_progress(self):
        job = self.get_rq_job()
        return job.meta.get('progress', 0) if job is not None else 100


class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    body = db.Column(db.String(140))
    timestamp = db.Column(db.DateTime, index=True, default=datetime.utcnow)
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'))

    def __repr__(self):
        return '<Post {}>'.format(self.body)
