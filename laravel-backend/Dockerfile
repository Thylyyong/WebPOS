FROM php:8.4-cli

RUN apt-get update && apt-get install -y git unzip libpq-dev libzip-dev libpng-dev libicu-dev \
 && docker-php-ext-install pdo_pgsql pgsql zip gd intl bcmath \
 && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY . .

RUN composer install --no-dev --optimize-autoloader --no-interaction \
 && chmod -R 775 storage bootstrap/cache

EXPOSE 10000
CMD php artisan config:cache && php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=${PORT:-10000}
