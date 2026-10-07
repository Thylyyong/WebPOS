FROM dunglas/frankenphp:1-php8.4-alpine

# Install Laravel's database/runtime extensions and OPcache.
RUN install-php-extensions \
    pdo_mysql \
    pdo_pgsql \
    pdo_sqlite \
    mbstring \
    xml \
    bcmath \
    zip \
    pcntl \
    opcache

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# Copy laravel-backend into /var/www
COPY laravel-backend/ .

# Install PHP dependencies without dev packages
RUN composer install --no-dev --optimize-autoloader --no-interaction
# Create necessary directories and set permissions
RUN mkdir -p storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache \
    public/uploads \
    && chmod -R 777 storage bootstrap/cache public/uploads

# Render provides the port in $PORT environment variable (default: 10000)
ENV PORT=10000
EXPOSE 10000

# Optimize with runtime environment values, then start FrankenPHP.
COPY Caddyfile /etc/caddy/Caddyfile
CMD ["sh", "-c", "php artisan migrate --force && php artisan optimize && exec frankenphp run --config /etc/caddy/Caddyfile"]
