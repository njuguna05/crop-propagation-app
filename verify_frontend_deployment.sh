#!/bin/bash
# Script to verify frontend deployment on production server

echo "=== Verifying Frontend Deployment ==="
echo ""

# Check if admin files exist
echo "1. Checking for admin dashboard files..."
if [ -f "/var/www/crop-propagation-app/frontend/static/js/main.*.js" ]; then
    echo "✓ Frontend JavaScript bundle found"
    ls -lh /var/www/crop-propagation-app/frontend/static/js/main.*.js | tail -1
else
    echo "✗ Frontend JavaScript bundle NOT found"
fi

echo ""
echo "2. Checking build date..."
stat /var/www/crop-propagation-app/frontend/index.html 2>/dev/null | grep "Modify" || echo "✗ index.html not found"

echo ""
echo "3. Checking for admin routes in bundle..."
cd /var/www/crop-propagation-app/frontend/static/js/
if grep -q "AdminDashboard\|admin/login" main.*.js 2>/dev/null; then
    echo "✓ Admin routes found in JavaScript bundle"
else
    echo "✗ Admin routes NOT found in bundle"
fi

echo ""
echo "4. Last deployment repository state..."
cd /var/www/crop-propagation-app/repo
echo "Current commit: $(git rev-parse --short HEAD)"
echo "Current branch: $(git rev-parse --abbrev-ref HEAD)"
git log -1 --oneline

echo ""
echo "5. Checking Nginx cache..."
if [ -d "/var/cache/nginx" ]; then
    echo "Nginx cache directory exists"
    echo "You may need to clear it: sudo rm -rf /var/cache/nginx/*"
fi

echo ""
echo "=== Verification Complete ==="
