redis-server ~/.local/etc/redis.conf &
gunicorn patched:app -b 0.0.0.0:5000 --worker-class gevent
kill $!
