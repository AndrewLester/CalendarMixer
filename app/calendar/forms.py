from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, TextAreaField
from wtforms.validators import DataRequired, Email, EqualTo, ValidationError, Length
from app.main.models import User
from app.calendar.models import CourseIdentifier
import re
import unicodedata


class CustomForm():
    def __init__(self, form):
        self.valid = True
        for k, v in form:
            attribute = getattr(self, k, None)
            if attribute is not None:
                t = type(attribute)
                if not v:
                    v = attribute
                else:
                    v = v['data']
                value = t(v)
                process = getattr(self, f'process_{k}', lambda d: d)
                value = process(value)
                if value is None:
                    raise TypeError(f'Process function for {k} can\'t return None.')
                setattr(self, k, value)

    @staticmethod
    def match_lengths(*strings):
        for string, max_len, min_len in strings:
            if len(string) > max_len or len(string) < min_len:
                return False
        return True

    @staticmethod
    def match_regex(*strings):
        for string, regex in strings:
            string = unicodedata.normalize('NFD', string).encode('ascii', 'ignore').decode('ascii')
            if string != re.match(regex, string).group(0):
                return False
        return True


class CourseFilterForm(CustomForm):
    filter_id = 0
    positive = False
    course_ids = []

    def process_filter_id(self, data):
        self.valid = CustomForm.match_lengths((str(data), 120, 0))
        return data

    def process_course_ids(self, data):
        updated = []
        for obj in data:
            self.valid = CustomForm.match_lengths((obj['course_id'], 36, 0), (obj['course_name'], 120, 0),
                                                  (obj['course_realm'], 120, 0))
            self.valid = CustomForm.match_regex((obj['course_id'], r'\d+'), (obj['course_name'], r'[\w -]+'),
                                                (obj['course_realm'], r'(user|group|section|school|district)'))
            identifier = CourseIdentifier(course_id=obj['course_id'], course_name=obj['course_name'],
                                          course_realm=obj['course_realm'])
            updated.append(identifier)
        return updated


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
