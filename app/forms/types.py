from datetime import timedelta
from typing import Callable

import isodate
from flask_wtf import FlaskForm
from wtforms import Field
from wtforms.widgets import TextInput

Validator = Callable[[FlaskForm, Field], None]


class IntervalField(Field):
    widget = TextInput()

    def process_formdata(self, valuelist):
        if valuelist:
            self.data = isodate.parse_duration(valuelist[0])
        else:
            self.data = timedelta()
