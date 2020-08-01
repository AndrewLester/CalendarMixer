from app.exts import db

from enum import IntEnum

from sqlalchemy.ext.declarative import declared_attr, declarative_base

import isodate


class SchoologyFilter(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    @declared_attr
    def __tablename__(cls):
        return cls.__name__.lower()

    @declared_attr
    def user_id(cls):
        return db.Column(db.String(36), db.ForeignKey('user.id'))

    def predicate(self, item):
        raise NotImplementedError('Predicate must be implemented.')

    def apply(self, iterable):
        for item in iterable:
            if self.predicate(item):
                yield item

    def __repr__(self):
        return self.__name__


SchoologyFilter = declarative_base(cls=SchoologyFilter, name='SchoologyFilter')


# class CourseFilter(SchoologyFilter):
#     __tablename__ = 'course_filter'
#
#     positive = db.Column(db.Boolean)
#     course_ids = db.relationship('CourseIdentifier', backref='filter', lazy='dynamic')
#
#     def predicate(self, item):
#         return item in self.course_ids
#
#     def __repr__(self):
#         return f'CourseFilter<{", ".join(str(course_id) for course_id in self.course_ids)}>'
class CourseFilter(db.Model):
    __tablename__ = 'course_filter'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    positive = db.Column(db.Boolean)
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'))
    course_ids = db.relationship('CourseIdentifier', backref='filter', lazy='dynamic')

    def predicate(self, item):
        # Check if the item matches the String course_id values, not the model objects
        return (item in [course_id.id for course_id in self.course_ids]) ^ self.positive

    def apply(self, realm_ids):
        for realm_id in realm_ids[:]:
            if self.predicate(realm_id):
                realm_ids.remove(realm_id)

    def to_json(self):
        return {'id': self.id, 'positive': self.positive,
                'course_ids': [id.to_json() for id in self.course_ids]}

    def __repr__(self):
        return f'CourseFilter<{", ".join(str(course_id) for course_id in self.course_ids)}>'


class CourseIdentifier(db.Model):
    __tablename__ = 'course_identifier'

    # Schoology "IDS" are now 36 digits long
    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(120))
    realm = db.Column(db.String(120))
    course_filter_id = db.Column(db.Integer, db.ForeignKey('course_filter.id'))
    colors_user_id = db.Column(db.String(36), db.ForeignKey('user.id'))
    course_color = db.Column(db.Integer)

    def to_json(self):
        return {'id': self.id, 'name': self.name, 'realm': self.realm}

    def __repr__(self):
        return f'CourseIdentifier<{self.id}, {self.name}, {self.realm}>'


class EventAlertType(IntEnum):
    DISPLAY = 0
    EMAIL = 1


class EventAlert(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'))
    event_id = db.Column(db.String(36))
    timedelta = db.Column(db.Interval)
    type = db.Column(db.Integer)
    
    def to_json(self):
        return {'id': self.id, 'event_id': self.event_id, 
                'timedelta': isodate.duration_isoformat(self.timedelta),
                'type': self.type}

    @classmethod
    def from_json(cls, json):
        return cls(id=json['id'])
    
    def __repr__(self):
        return f'EventAlert<{self.id=}, {self.user_id=}, {self.event_id=}, {self.timedelta=}, {self.type=}>'
