#!/bin/bash
# One-time root setup: creates staging directory and points services to it.
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
USER="humphrey_picidae"

echo "=== Setting up crop-propagation directory ==="
echo ""

# 1. Rename old 'staging' folder if it exists, then create dirs
echo "1. Creating directories..."
OLD_STAGING="/home/humphrey_picidae/staging"
if [ -d "$OLD_STAGING" ] && [ ! -d "$STAGING" ]; then
    mv "$OLD_STAGING" "$STAGING"
    echo "   ✓ Renamed $OLD_STAGING → $STAGING"
fi
mkdir -p "$STAGING/backend" "$STAGING/frontend"
chown -R "$USER:$USER" "$STAGING"
echo "   ✓ $STAGING/backend"
echo "   ✓ $STAGING/frontend"

# 2. Copy backend (venv + .env + code) to staging
echo ""
echo "2. Copying backend to staging..."
rsync -a \
  --exclude='*.pyc' --exclude='__pycache__' --exclude='*.db' \
  "$OLD_APP/backend/" "$STAGING/backend/"
chown -R "$USER:$USER" "$STAGING/backend"
echo "   ✓ Done"

# 3. Update systemd service to point to crop-propagation/backend
echo ""
echo "3. Updating systemd service..."
# Handle both old /var/www path and old ~/staging path
sed -i "s|WorkingDirectory=$OLD_APP/backend|WorkingDirectory=$STAGING/backend|g" "$SERVICE_FILE"
sed -i "s|WorkingDirectory=/home/humphrey_picidae/staging/backend|WorkingDirectory=$STAGING/backend|g" "$SERVICE_FILE"
sed -i "s|EnvironmentFile=$OLD_APP/backend/.env|EnvironmentFile=$STAGING/backend/.env|g" "$SERVICE_FILE"
sed -i "s|EnvironmentFile=/home/humphrey_picidae/staging/backend/.env|EnvironmentFile=$STAGING/backend/.env|g" "$SERVICE_FILE"
sed -i "s|ExecStart=$OLD_APP/backend/venv/bin/uvicorn|ExecStart=$STAGING/backend/venv/bin/uvicorn|g" "$SERVICE_FILE"
sed -i "s|ExecStart=/home/humphrey_picidae/staging/backend/venv/bin/uvicorn|ExecStart=$STAGING/backend/venv/bin/uvicorn|g" "$SERVICE_FILE"
systemctl daemon-reload
echo "   ✓ Service updated and daemon reloaded"

# 4. Update Nginx to serve from crop-propagation/frontend
echo ""
echo "4. Updating Nginx config..."
# Handle both old /var/www path and old ~/staging path
sed -i "s|root $OLD_APP/frontend;|root $STAGING/frontend;|g" "$NGINX_CONF"
sed -i "s|root /home/humphrey_picidae/staging/frontend;|root $STAGING/frontend;|g" "$NGINX_CONF"
echo "   ✓ Nginx root → $STAGING/frontend"

# 5. Add daemon-reload to sudoers so deploy script can call it if needed
echo ""
echo "5. Updating sudoers..."
cat > /etc/sudoers.d/crop-deploy << 'EOF'
humphrey_picidae ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart crop-propagation-api
humphrey_picidae ALL=(ALL) NOPASSWD: /usr/bin/systemctl reload nginx
humphrey_picidae ALL=(ALL) NOPASSWD: /usr/bin/systemctl status crop-propagation-api
humphrey_picidae ALL=(ALL) NOPASSWD: /usr/bin/systemctl daemon-reload
EOF
chmod 440 /etc/sudoers.d/crop-deploy
echo "   ✓ Sudoers updated"

# 6. Restart services
echo ""
echo "6. Restarting services..."
systemctl restart crop-propagation-api
systemctl reload nginx
echo "   ✓ Backend restarted"
echo "   ✓ Nginx reloaded"

# 7. Health check
echo ""
echo "7. Health check..."
sleep 2
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:9000/health 2>/dev/null || echo "000")
if [ "$HTTP_STATUS" = "200" ]; then
    echo "   ✓ Backend healthy"
else
    echo "   ! Backend returned HTTP $HTTP_STATUS"
    echo "     Check: journalctl -u crop-propagation-api -n 30"
fi

echo ""
echo "=== Setup complete ==="
echo "  Backend  → $STAGING/backend"
echo "  Frontend → $STAGING/frontend"
echo ""
echo "You can now push to main and the deployment will work."
