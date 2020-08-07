from flask_wtf import FlaskForm
from wtforms import (BooleanField, IntegerField,
                     StringField, FormField, FieldList)
from wtforms.validators import (DataRequired, Length,
                                NumberRange, ValidationError, Regexp)

from app.blueprints.calendar.models import EventAlertType
from app.forms.types import IntervalField


class CourseIDSubform(FlaskForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs, meta={'csrf': False})

    id = StringField(validators=[DataRequired(), Length(0, 36), Regexp(r'\d+')])
    name = StringField(validators=[Length(0, 120)])
    realm = StringField(validators=[DataRequired(), Length(0, 120), Regexp(r'(user|group|section|school|district)')])


class AlertForm(FlaskForm):
    id = IntegerField(validators=[DataRequired()])
    event_id = StringField(validators=[DataRequired(), Length(0, 120)])
    timedelta: timedelta = IntervalField()
    type = IntegerField(validators=[NumberRange(0, len(EventAlertType) - 1)])

    def validate_type(self, type):
        try:
            EventAlertType(type.data)
        except ValueError:
            raise ValidationError('Invalid alert type') from None


class CourseFilterForm(FlaskForm):
    id = IntegerField(validators=[DataRequired()])
    positive = BooleanField()
    course_ids = FieldList(FormField(CourseIDSubform))
