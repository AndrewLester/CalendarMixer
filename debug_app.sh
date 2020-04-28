npm run dev &
redis-server ~/.local/etc/redis.conf &
flask run
kill $!
kill %-1
