from app import app
from datetime import datetime


@app.context_processor
def date():
    return {'date': datetime.now()}
