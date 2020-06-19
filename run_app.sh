. .flaskenv
npm run build
redis-server ~/.local/etc/redis.conf &
gunicorn calendarmixer:app --worker-class gevent -b 0.0.0.0:5000 --workers 3
kill $!
