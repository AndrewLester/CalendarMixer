from app.exts import db
from sqlalchemy.ext.declarative import declared_attr, declarative_base


class SchoologyFilter(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    @declared_attr
    def __tablename__(cls):
        return cls.__name__.lower()

    @declared_attr
    def user_id(cls):
        return db.Column(db.Integer, db.ForeignKey('user.id'))

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
    course_ids = db.relationship('CourseIdentifier', backref='filter', lazy='dynamic')
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))

    def predicate(self, item):
        return item in self.course_ids

    def apply(self, iterable):
        for item in iterable:
            if self.predicate(item):
                yield item

    def to_json(self):
        return {'id': self.id, 'positive': self.positive,
                'course_ids': [id.to_json() for id in self.course_ids]}

    def __repr__(self):
        return f'CourseFilter<{", ".join(str(course_id) for course_id in self.course_ids)}>'


class CourseIdentifier(db.Model):
    __tablename__ = 'course_identifier'

    # Schoology "IDS" are now 36 digits long
    course_id = db.Column(db.String(36), primary_key=True)
    course_name = db.Column(db.String(120))
    course_filter_id = db.Column(db.Integer, db.ForeignKey('course_filter.id'))
    user_colors_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    course_color = db.Column(db.Integer)

    def to_json(self):
        return {'id': self.course_id, 'name': self.course_name}

    def __repr__(self):
        return f'CourseIdentifier<{self.course_id}, {self.course_name}>'



