#!/bin/bash
# One-time server setup: creates user-owned staging folder for both backend and frontend,
# updates Nginx and systemd service to point to staging paths.
#
# Run as humphrey_picidae on the production server:
#   ssh humphrey_picidae@102.210.148.91
#   bash ~/server_setup_staging.sh

set -e

STAGING="/home/humphrey_picidae/staging"
OLD_APP="/var/www/crop-propagation-app"
NGINX_CONF="/etc/nginx/sites-available/crop-propagation"
SERVICE_FILE="/etc/systemd/system/crop-propagation-api.service"

echo "=== Setting up unified staging directory ==="
echo "Staging root: $STAGING"
echo ""

# 1. Create staging directories (user-owned, no root needed)
echo "1. Creating staging directories..."
mkdir -p "$STAGING/backend"
mkdir -p "$STAGING/frontend"
echo "   ✓ $STAGING/backend"
echo "   ✓ $STAGING/frontend"

# 2. Copy backend code + venv + .env to staging
echo ""
echo "2. Migrating backend to staging..."
if [ -d "$OLD_APP/backend/app" ]; then
    rsync -a \
      --exclude='*.pyc' \
      --exclude='__pycache__' \
      --exclude='*.db' \
      "$OLD_APP/backend/" "$STAGING/backend/"
    echo "   ✓ Backend code copied (including venv and .env)"
else
    echo "   ! Old backend not found at $OLD_APP/backend — will be populated on first deploy"
fi

# 3. Copy current frontend to staging so site isn't blank
echo ""
echo "3. Migrating frontend to staging..."
if [ -d "$OLD_APP/frontend" ] && [ "$(ls -A $OLD_APP/frontend 2>/dev/null)" ]; then
    rsync -a "$OLD_APP/frontend/" "$STAGING/frontend/"
    echo "   ✓ Frontend files copied"
else
    echo "   ! Old frontend empty or missing — will be populated on first deploy"
fi

# 4. Update Nginx to serve from staging/frontend
echo ""
echo "4. Updating Nginx config..."
sudo sed -i "s|root $OLD_APP/frontend;|root $STAGING/frontend;|g" "$NGINX_CONF"
# Verify
NGINX_ROOT=$(grep "root " "$NGINX_CONF" | head -1 | xargs)
echo "   Nginx root is now: $NGINX_ROOT"

# 5. Update systemd service to run from staging/backend
echo ""
echo "5. Updating systemd service..."
sudo sed -i "s|WorkingDirectory=$OLD_APP/backend|WorkingDirectory=$STAGING/backend|g" "$SERVICE_FILE"
sudo sed -i "s|EnvironmentFile=$OLD_APP/backend/.env|EnvironmentFile=$STAGING/backend/.env|g" "$SERVICE_FILE"
sudo sed -i "s|ExecStart=$OLD_APP/backend/venv/bin/uvicorn|ExecStart=$STAGING/backend/venv/bin/uvicorn|g" "$SERVICE_FILE"
echo "   ✓ Service paths updated"

# 6. Reload systemd, restart backend, reload Nginx
echo ""
echo "6. Applying changes..."
sudo systemctl daemon-reload
sudo nginx -t
sudo systemctl restart crop-propagation-api
sudo systemctl reload nginx
echo "   ✓ systemd reloaded"
echo "   ✓ Backend restarted"
echo "   ✓ Nginx reloaded"

# 7. Health check
echo ""
echo "7. Health check..."
sleep 2
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:9000/health 2>/dev/null || echo "000")
if [ "$HTTP_STATUS" = "200" ]; then
    echo "   ✓ Backend healthy (HTTP $HTTP_STATUS)"
else
    echo "   ! Backend returned HTTP $HTTP_STATUS — check logs:"
    echo "     sudo journalctl -u crop-propagation-api -n 20"
fi

echo ""
echo "=== Setup complete! ==="
echo ""
echo "Staging layout:"
echo "  Backend  → $STAGING/backend"
echo "  Frontend → $STAGING/frontend"
echo ""
echo "All future deployments will write to $STAGING without needing root."
