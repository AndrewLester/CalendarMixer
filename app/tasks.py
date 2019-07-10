import time
import app.main

def example(seconds):
    print('Starting task')
    for i in range(seconds):
        print(i)
        time.sleep(1)
    print('Task completed')

def generate_calendars():
    for user in main.User.query.all():
        print(user)