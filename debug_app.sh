npm run dev &
redis-server ~/.local/etc/redis.conf &
flask run
kill %2
kill %1
