from flask_wtf import FlaskForm
from wtforms.widgets import TextInput
from wtforms import Field, StringField, PasswordField, BooleanField, SubmitField, TextAreaField, FieldList
from wtforms.validators import DataRequired, Email, EqualTo, ValidationError, Length
from app.main.models import User
import json


class CourseIdentifierField(Field):
    widget = TextInput

    def _value(self):
        if self.data:
            return u', '.join(self.data)
        else:
            return u''

    def process_formdata(self, data):
        data = json.loads(data)
        print(data)


class CustomForm():
    def __init__(self, form):
        for k, v in form:
            print(k, json.loads(v))

    def is_valid(self):
        return False

class CourseFilterForm(CustomForm):
    filter_id = 0
    positive = False
    course_ids = []

    # def process_course_ids(data):




class RegistrationForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired()])
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired()])
    password2 = PasswordField(
        'Repeat Password', validators=[DataRequired(), EqualTo('password')])
    submit = SubmitField('Register')

    def validate_username(self, username):
        user = User.query.filter_by(username=username.data).first()
        if user is not None:
            raise ValidationError('Please use a different username.')

    def validate_email(self, email):
        user = User.query.filter_by(email=email.data).first()
        if user is not None:
            raise ValidationError('Please use a different email address.')

class EditProfileForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired()])
    about_me = TextAreaField('About me', validators=[Length(min=0, max=140)])
    submit = SubmitField('Submit')

    def __init__(self, original_username, *args, **kwargs):
        super(EditProfileForm, self).__init__(*args, **kwargs)
        self.original_username = original_username

    def validate_username(self, username):
        if username.data != self.original_username:
            user = User.query.filter_by(username=self.username.data).first()
            if user is not None:
                raise ValidationError('Please use a different username.')
