#!/bin/bash
set -e

DOMAIN="scalefybd.com"
EMAIL="tasindevx.scalefy@gmail.com"
CERT_PATH="./certbot/conf/live/$DOMAIN/fullchain.pem"

echo "=============================="
echo "  TzsPixelsSite Deploy Script"
echo "=============================="

# ── Preflight ──────────────────────────────────────────────────────────────────

if [ ! -f "backend/.env" ]; then
  echo "ERROR: backend/.env not found. Create it before deploying."
  exit 1
fi

if ! command -v docker &>/dev/null; then
  echo "ERROR: docker not installed."
  exit 1
fi

# ── Pull latest code ───────────────────────────────────────────────────────────

echo ""
echo "[1/5] Pulling latest code..."
git pull

# ── Create required directories ────────────────────────────────────────────────

mkdir -p certbot/conf certbot/www nginx

# ── SSL Certificate ────────────────────────────────────────────────────────────

echo ""
if [ -f "$CERT_PATH" ]; then
  echo "[2/5] SSL cert already exists — skipping certbot."
else
  echo "[2/5] No SSL cert found — obtaining from Let's Encrypt..."

  # Swap to HTTP-only bootstrap config so nginx can start without a cert
  cp nginx/nginx.conf nginx/nginx-full.conf.bak
  cp nginx/nginx-bootstrap.conf nginx/nginx.conf

  # Start everything except certbot, using bootstrap nginx
  docker compose up -d db backend frontend nginx certbot

  echo "      Waiting for nginx to be ready..."
  sleep 5

  # Get the cert via webroot challenge
  docker compose run --rm --entrypoint "" certbot \
    certbot certonly --webroot \
    -w /var/www/certbot \
    --email "$EMAIL" \
    -d "$DOMAIN" -d "www.$DOMAIN" \
    --agree-tos --no-eff-email --force-renewal

  # Restore full SSL config
  cp nginx/nginx-full.conf.bak nginx/nginx.conf
  rm -f nginx/nginx-full.conf.bak

  echo "      Certificate obtained successfully."
fi

# ── Build & start all services ─────────────────────────────────────────────────

echo ""
echo "[3/5] Building and starting all services..."
docker compose up -d --build

# ── Wait for backend health ────────────────────────────────────────────────────

echo ""
echo "[4/5] Waiting for backend to be healthy..."
RETRIES=20
until docker compose exec -T backend wget -qO- http://localhost:5000/health &>/dev/null; do
  RETRIES=$((RETRIES - 1))
  if [ $RETRIES -eq 0 ]; then
    echo "ERROR: Backend failed to become healthy. Check logs:"
    echo "  docker compose logs backend"
    exit 1
  fi
  echo "      Waiting... ($RETRIES retries left)"
  sleep 5
done
echo "      Backend is healthy."

# ── Verify nginx ───────────────────────────────────────────────────────────────

echo ""
echo "[5/5] Verifying nginx..."
sleep 3
if curl -sk https://$DOMAIN/health | grep -q "ok"; then
  echo "      https://$DOMAIN is UP and healthy."
else
  echo "      WARNING: Could not verify https://$DOMAIN — check nginx logs:"
  echo "  docker compose logs nginx"
fi

# ── Summary ────────────────────────────────────────────────────────────────────

echo ""
echo "=============================="
echo "  Deploy complete!"
echo ""
echo "  App:      https://$DOMAIN"
echo "  Webhooks: https://$DOMAIN/webhooks/facebook"
echo "  Health:   https://$DOMAIN/health"
echo ""
echo "  Logs:     docker compose logs -f"
echo "=============================="
