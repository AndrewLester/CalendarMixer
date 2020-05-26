import os

if os.environ.get('FLASK_ENV') != 'development':
    from gevent import monkey
    monkey.patch_all()

from app.app import create_app

app = create_app()
