import time
from .app import create_app

app = create_app()
app.app_context().push()

def example(seconds):
    print('Starting task')
    for i in range(seconds):
        print(i)
        time.sleep(1)
    print('Task completed')