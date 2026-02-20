#!/bin/bash
# One-time root setup: migrate everything to ~/crop-propagation and stop old processes.
#
# Run on the server as root:
#   ssh humphrey_picidae@102.210.148.91
#   su -
#   bash /var/www/crop-propagation-app/repo/server_setup_staging.sh

set -e

STAGING="/home/humphrey_picidae/crop-propagation"
OLD_APP="/var/www/crop-propagation-app"
NGINX_CONF="/etc/nginx/sites-available/crop-propagation"
SERVICE_FILE="/etc/systemd/system/crop-propagation-api.service"
DEPLOY_USER="humphrey_picidae"

echo "=== Migrating to /home/humphrey_picidae/crop-propagation ==="
echo ""

# 1. Stop the running backend service before migrating
echo "1. Stopping backend service..."
systemctl stop crop-propagation-api || true
echo "   ✓ Stopped"

# 2. Kill any stray uvicorn processes still using the old path
echo ""
echo "2. Killing any stray uvicorn processes..."
pkill -f "$OLD_APP/backend/venv/bin/uvicorn" 2>/dev/null || true
pkill -f "/home/humphrey_picidae/staging/backend/venv/bin/uvicorn" 2>/dev/null || true
echo "   ✓ Done"

# 3. Create the new directory (rename old ~/staging if it exists)
echo ""
echo "3. Creating ~/crop-propagation directories..."
OLD_STAGING="/home/humphrey_picidae/staging"
if [ -d "$OLD_STAGING" ] && [ ! -d "$STAGING" ]; then
    mv "$OLD_STAGING" "$STAGING"
    echo "   ✓ Renamed ~/staging → ~/crop-propagation"
fi
mkdir -p "$STAGING/backend" "$STAGING/frontend"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$STAGING"
echo "   ✓ $STAGING/backend"
echo "   ✓ $STAGING/frontend"

# 4. Copy backend (code + venv + .env) from old location to staging
echo ""
echo "4. Copying backend to ~/crop-propagation/backend..."
rsync -a \
  --exclude='*.pyc' --exclude='__pycache__' --exclude='*.db' \
  "$OLD_APP/backend/" "$STAGING/backend/"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$STAGING/backend"
echo "   ✓ Done"

# 5. Copy current frontend build so the site isn't blank
echo ""
echo "5. Copying frontend to ~/crop-propagation/frontend..."
if [ -d "$OLD_APP/frontend" ] && [ "$(ls -A $OLD_APP/frontend 2>/dev/null)" ]; then
    rsync -a "$OLD_APP/frontend/" "$STAGING/frontend/"
    chown -R "$DEPLOY_USER:$DEPLOY_USER" "$STAGING/frontend"
    echo "   ✓ Done"
else
    echo "   ! Old frontend empty — will be populated on next deploy"
fi

# 6. Rewrite the systemd service to point to the new paths
echo ""
echo "6. Updating systemd service file..."
cat > "$SERVICE_FILE" << UNIT
[Unit]
Description=Crop Propagation FastAPI Backend
After=network.target docker.service
Wants=docker.service

[Service]
Type=simple
User=$DEPLOY_USER
Group=$DEPLOY_USER
WorkingDirectory=$STAGING/backend
EnvironmentFile=$STAGING/backend/.env
ExecStart=$STAGING/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 9000
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
echo "   ✓ Service now runs from $STAGING/backend"

# 7. Rewrite Nginx config root to new frontend path
echo ""
echo "7. Updating Nginx to serve from ~/crop-propagation/frontend..."
# Replace any existing root directive (old /var/www or old ~/staging)
sed -i "s|root .*/frontend;|root $STAGING/frontend;|g" "$NGINX_CONF"
# Verify
NGINX_ROOT=$(grep "root " "$NGINX_CONF" | head -1 | xargs)
echo "   ✓ $NGINX_ROOT"

# 8. Update sudoers
echo ""
echo "8. Updating sudoers..."
cat > /etc/sudoers.d/crop-deploy << 'EOF'
humphrey_picidae ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart crop-propagation-api
humphrey_picidae ALL=(ALL) NOPASSWD: /usr/bin/systemctl reload nginx
humphrey_picidae ALL=(ALL) NOPASSWD: /usr/bin/systemctl status crop-propagation-api
humphrey_picidae ALL=(ALL) NOPASSWD: /usr/bin/systemctl daemon-reload
EOF
chmod 440 /etc/sudoers.d/crop-deploy
echo "   ✓ Done"

# 9. Start services from the new locations
echo ""
echo "9. Starting services from new location..."
systemctl start crop-propagation-api
systemctl reload nginx
echo "   ✓ Backend started from $STAGING/backend"
echo "   ✓ Nginx reloaded, serving from $STAGING/frontend"

# 10. Verify the running process is using the new path
echo ""
echo "10. Verifying processes..."
sleep 2
RUNNING_PATH=$(systemctl show crop-propagation-api --property=ExecStart | grep -o "$STAGING[^ ]*" | head -1 || true)
if [ -n "$RUNNING_PATH" ]; then
    echo "   ✓ Backend running from: $RUNNING_PATH"
else
    echo "   ✓ Backend service active: $(systemctl is-active crop-propagation-api)"
fi

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:9000/health 2>/dev/null || echo "000")
if [ "$HTTP_STATUS" = "200" ]; then
    echo "   ✓ Backend health check passed (HTTP 200)"
else
    echo "   ! Backend returned HTTP $HTTP_STATUS"
    echo "     Check logs: journalctl -u crop-propagation-api -n 30"
fi

echo ""
echo "=== Migration complete ==="
echo ""
echo "  Backend  → $STAGING/backend  (port 9000)"
echo "  Frontend → $STAGING/frontend (served by Nginx on port 8080)"
echo ""
echo "Old /var/www paths are no longer used."
echo "Push to main to trigger the first deployment to the new location."
