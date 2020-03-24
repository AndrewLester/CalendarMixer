redis-server ~/.local/etc/redis.conf &
gunicorn calendarmixer:app -b 0.0.0.0:5000
kill $!
