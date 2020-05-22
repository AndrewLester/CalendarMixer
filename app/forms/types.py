import re
from datetime import timedelta
from typing import Callable, Protocol, Optional

import isodate
from flask_wtf import FlaskForm
from wtforms import Field
from wtforms.validators import StopValidation
from wtforms.widgets import TextInput

Validator = Callable[[FlaskForm, Field], None]


class IntervalField(Field):
    widget = TextInput()

    def process_formdata(self, valuelist):
        if valuelist:
            self.data = isodate.parse_duration(valuelist[0])
        else:
            self.data = timedelta()


class Regex:
    def __init__(self, regex: str, message: Optional[str] = None) -> None:
        self.regex = regex
        self.message = message

    def __call__(self, form, field) -> None:
        if re.fullmatch(self.regex, field.data) is None:
            if self.message is None:
                message = field.gettext('This field doesn\'t match the specified regex.')
            else:
                message = self.message

            field.errors[:] = []
            raise StopValidation(message)
