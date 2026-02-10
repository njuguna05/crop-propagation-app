#!/bin/bash
# Script to clear all caches on production server and force refresh

echo "=== Clearing Production Caches ==="
echo ""

# 1. Clear Nginx cache
echo "1. Clearing Nginx cache..."
if [ -d "/var/cache/nginx" ]; then
    sudo rm -rf /var/cache/nginx/*
    echo "✓ Nginx cache cleared"
else
    echo "✗ Nginx cache directory not found"
fi

# 2. Reload Nginx to clear any memory caches
echo ""
echo "2. Reloading Nginx..."
sudo systemctl reload nginx
echo "✓ Nginx reloaded"

# 3. Clear old service worker registrations by updating the service worker
echo ""
echo "3. Service Worker will be updated on next client visit"
echo "   (Clients need to hard refresh: Ctrl+Shift+R)"

# 4. Show current deployment info
echo ""
echo "4. Current deployment status:"
cd /var/www/crop-propagation-app/repo
echo "   Commit: $(git log -1 --oneline)"
echo "   Branch: $(git branch --show-current)"

# 5. Check frontend files
echo ""
echo "5. Frontend deployment:"
if [ -f "/var/www/crop-propagation-app/frontend/index.html" ]; then
    echo "   Last updated: $(stat -c %y /var/www/crop-propagation-app/frontend/index.html)"

    # Check if admin components are in the bundle
    if grep -q "AdminDashboard" /var/www/crop-propagation-app/frontend/static/js/main.*.js 2>/dev/null; then
        echo "   ✓ Admin dashboard code found in bundle"
    else
        echo "   ✗ Admin dashboard code NOT found in bundle"
        echo "   → May need to rebuild frontend"
    fi
else
    echo "   ✗ Frontend files not found"
fi

echo ""
echo "=== Cache Clearing Complete ==="
echo ""
echo "Next steps:"
echo "1. Hard refresh browser (Ctrl+Shift+R)"
echo "2. Clear browser Service Worker in DevTools"
echo "3. If still not working, trigger new deployment"
