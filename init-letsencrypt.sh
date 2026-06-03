#!/bin/bash
set -e

DOMAIN="scalefybd.com"
EMAIL="tasindevx.scalefy@gmail.com"

mkdir -p certbot/conf certbot/www

echo "==> Switching nginx to bootstrap (HTTP-only) config..."
cp nginx/nginx.conf nginx/nginx-full.conf.bak
cp nginx/nginx-bootstrap.conf nginx/nginx.conf

echo "==> Restarting nginx with HTTP-only config..."
docker compose restart nginx
sleep 3

echo "==> Requesting certificate from Let's Encrypt..."
docker compose run --rm --entrypoint "" certbot \
  certbot certonly --webroot \
  -w /var/www/certbot \
  --email "$EMAIL" \
  -d "$DOMAIN" -d "www.$DOMAIN" \
  --agree-tos --no-eff-email --force-renewal

echo "==> Restoring full SSL nginx config..."
cp nginx/nginx-full.conf.bak nginx/nginx.conf

echo "==> Restarting nginx with SSL config..."
docker compose restart nginx

echo "==> Done! https://$DOMAIN should be live."
