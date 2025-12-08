#!/bin/bash
# FHK Housekeeping - Quick Deployment Script (Linux/Mac)
# Uploads built files to production server

set -e

KEY_PATH="${1:-path/to/your/key.pem}"
SERVER_IP="13.234.30.197"
SERVER_USER="ubuntu"

echo "=== FHK Housekeeping Deployment ==="
echo ""

# Check if builds exist
if [ ! -d "apps/admin-web/dist" ]; then
    echo "Error: Admin web build not found. Run: npm run build in apps/admin-web"
    exit 1
fi

if [ ! -d "apps/staff-pwa/dist" ]; then
    echo "Error: Staff PWA build not found. Run: npm run build in apps/staff-pwa"
    exit 1
fi

echo "Build files found:"
echo "  ✓ Admin Web: apps/admin-web/dist/"
echo "  ✓ Staff PWA: apps/staff-pwa/dist/"
echo ""

# Confirm deployment
read -p "Deploy to $SERVER_IP? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Deployment cancelled."
    exit 0
fi

# Create backup on server
echo ""
echo "Step 1: Creating backup on server..."
ssh -i "$KEY_PATH" "$SERVER_USER@$SERVER_IP" << 'EOF'
    sudo mkdir -p /var/www/fhk/backups
    sudo cp -r /var/www/fhk/admin /var/www/fhk/backups/admin-$(date +%Y%m%d-%H%M%S) 2>/dev/null || echo 'No previous admin build'
    sudo cp -r /var/www/fhk/staff /var/www/fhk/backups/staff-$(date +%Y%m%d-%H%M%S) 2>/dev/null || echo 'No previous staff build'
EOF
echo "  ✓ Backup created"

# Create temp directories on server
echo ""
echo "Step 2: Preparing server..."
ssh -i "$KEY_PATH" "$SERVER_USER@$SERVER_IP" << 'EOF'
    rm -rf /tmp/admin-web /tmp/staff-pwa
    mkdir -p /tmp/admin-web /tmp/staff-pwa
EOF

# Upload Admin Web
echo ""
echo "Step 3: Uploading Admin Web..."
scp -i "$KEY_PATH" -r apps/admin-web/dist/* "$SERVER_USER@$SERVER_IP:/tmp/admin-web/"
echo "  ✓ Admin Web uploaded"

# Upload Staff PWA
echo ""
echo "Step 4: Uploading Staff PWA..."
scp -i "$KEY_PATH" -r apps/staff-pwa/dist/* "$SERVER_USER@$SERVER_IP:/tmp/staff-pwa/"
echo "  ✓ Staff PWA uploaded"

# Move files and restart nginx
echo ""
echo "Step 5: Moving files and restarting services..."
ssh -i "$KEY_PATH" "$SERVER_USER@$SERVER_IP" << 'EOF'
    sudo mkdir -p /var/www/fhk/admin
    sudo mkdir -p /var/www/fhk/staff
    sudo rm -rf /var/www/fhk/admin/*
    sudo rm -rf /var/www/fhk/staff/*
    sudo cp -r /tmp/admin-web/* /var/www/fhk/admin/
    sudo cp -r /tmp/staff-pwa/* /var/www/fhk/staff/
    sudo chown -R www-data:www-data /var/www/fhk
    sudo systemctl reload nginx
    echo '✓ Services restarted'
EOF

# Verify deployment
echo ""
echo "Step 6: Verifying deployment..."
ADMIN_STATUS=$(ssh -i "$KEY_PATH" "$SERVER_USER@$SERVER_IP" "curl -s -o /dev/null -w '%{http_code}' http://localhost/admin/")
PWA_STATUS=$(ssh -i "$KEY_PATH" "$SERVER_USER@$SERVER_IP" "curl -s -o /dev/null -w '%{http_code}' http://localhost/staff/")

if [ "$ADMIN_STATUS" = "200" ]; then
    echo "  ✓ Admin Web is responding (HTTP 200)"
else
    echo "  ⚠ Admin Web returned HTTP $ADMIN_STATUS"
fi

if [ "$PWA_STATUS" = "200" ]; then
    echo "  ✓ Staff PWA is responding (HTTP 200)"
else
    echo "  ⚠ Staff PWA returned HTTP $PWA_STATUS"
fi

# Success message
echo ""
echo "=== Deployment Complete ==="
echo ""
echo "Application URLs:"
echo "  Admin Web: http://$SERVER_IP/admin/"
echo "  Staff PWA: http://$SERVER_IP/staff/"
echo ""
echo "Next Steps:"
echo "  1. Test both applications in browser"
echo "  2. Verify new features (inspection, timer, breakdowns, live board)"
echo "  3. Check database migrations applied"
echo "  4. Run TESTING_CHECKLIST.md scenarios"
echo "  5. Get client sign-off"
echo ""
