#!/bin/bash
# Run once on the VPS to get the initial Let's Encrypt certificate.
# After this, certbot in docker-compose auto-renews every 12h.

DOMAIN="scalefybd.com"
EMAIL="hello@scalefybd.com"   # change to your email

mkdir -p certbot/conf certbot/www

# Temporarily bring up nginx with HTTP only (cert doesn't exist yet).
# nginx.conf references the cert, so use a bootstrap config first.
docker compose run --rm --entrypoint "\
  certbot certonly --webroot \
  -w /var/www/certbot \
  --email $EMAIL \
  -d $DOMAIN -d www.$DOMAIN \
  --agree-tos --no-eff-email --force-renewal" certbot
