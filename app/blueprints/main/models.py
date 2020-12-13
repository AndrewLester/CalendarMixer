from flask_login import UserMixin

from app.exts import db, login


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
    timezone = db.Column(db.String(120))
    profile_picture_url = db.Column(db.String(250))
    ical_secret = db.Column(db.String(64), index=True, unique=True)
    oauth_token = db.relationship('OAuth1Token', uselist=False, back_populates='user')
    filters = db.relationship('CourseFilter', backref='user', lazy='dynamic')
    colors = db.relationship('CourseColor', backref='user', lazy='dynamic')
    alerts = db.relationship('EventAlert', backref='user', lazy='dynamic')

    def apply_filters(self, realm_ids):
        for filter in self.filters:
            filter.apply(realm_ids)

    def __repr__(self):
        return '<User {}>'.format(self.username)
