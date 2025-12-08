#!/bin/bash

# FHK Housekeeping - EC2 Deployment Script
# Run this script on your EC2 instance

set -e

echo "🚀 Starting FHK Housekeeping Deployment..."

# Update system
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Nginx
echo "📦 Installing Nginx..."
sudo apt-get install -y nginx

# Install Certbot for SSL
echo "🔒 Installing Certbot for SSL..."
sudo apt-get install -y certbot python3-certbot-nginx

# Create directory structure
echo "📁 Creating directory structure..."
sudo mkdir -p /var/www/fhk/admin-web
sudo mkdir -p /var/www/fhk/staff-pwa
sudo chown -R $USER:$USER /var/www/fhk

# Build Admin Web
echo "🏗️  Building Admin Web Application..."
cd ~/fhk-housekeeping/apps/admin-web
npm install
npm run build
sudo cp -r dist/* /var/www/fhk/admin-web/

# Build Staff PWA
echo "🏗️  Building Staff PWA..."
cd ~/fhk-housekeeping/apps/staff-pwa
npm install
npm run build
sudo cp -r dist/* /var/www/fhk/staff-pwa/

# Configure Nginx
echo "⚙️  Configuring Nginx..."
sudo cp ~/fhk-housekeeping/deployment/nginx.conf /etc/nginx/sites-available/fhk-housekeeping
sudo ln -sf /etc/nginx/sites-available/fhk-housekeeping /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
sudo nginx -t

# Restart Nginx
echo "🔄 Restarting Nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx

# Setup SSL (requires domain to be pointed to server)
echo "🔒 Setting up SSL certificate..."
echo "⚠️  Make sure your domain is pointed to this server before continuing!"
read -p "Enter your domain name (e.g., housekeeping.yourdomain.com): " DOMAIN

if [ ! -z "$DOMAIN" ]; then
    sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
    echo "✅ SSL certificate installed successfully!"
else
    echo "⚠️  Skipping SSL setup. You can run it manually later with:"
    echo "    sudo certbot --nginx -d your-domain.com"
fi

# Setup firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw --force enable

# Create deployment script
echo "📝 Creating update script..."
cat > ~/update-fhk.sh << 'EOF'
#!/bin/bash
set -e
echo "🔄 Updating FHK Housekeeping..."

cd ~/fhk-housekeeping
git pull origin main

# Build Admin
cd apps/admin-web
npm install
npm run build
sudo cp -r dist/* /var/www/fhk/admin-web/

# Build PWA
cd ../staff-pwa
npm install
npm run build
sudo cp -r dist/* /var/www/fhk/staff-pwa/

sudo systemctl reload nginx
echo "✅ Update complete!"
EOF

chmod +x ~/update-fhk.sh

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your application is now accessible at:"
echo "   Admin Panel: https://$DOMAIN"
echo "   Staff PWA:   https://$DOMAIN/staff"
echo ""
echo "📝 To update the application in the future, run:"
echo "   ~/update-fhk.sh"
echo ""
echo "🔧 Useful commands:"
echo "   sudo systemctl status nginx    # Check Nginx status"
echo "   sudo systemctl restart nginx   # Restart Nginx"
echo "   sudo tail -f /var/log/nginx/fhk-housekeeping-error.log  # View logs"
echo ""
