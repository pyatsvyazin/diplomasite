#!/bin/sh
set -e

cd /var/www/html

if [ "$1" = "php-fpm" ]; then
  php artisan storage:link --force 2>/dev/null || true

  echo "Waiting for database..."
  until php artisan migrate:status --no-interaction >/dev/null 2>&1; do
    sleep 2
  done

  php artisan migrate --force --no-interaction
  php artisan config:cache --no-interaction
  php artisan route:cache --no-interaction
  php artisan view:cache --no-interaction

  exec docker-php-entrypoint php-fpm
fi

exec "$@"
