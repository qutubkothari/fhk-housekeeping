# 🚀 DEPLOY TO SERVER - QUICK GUIDE

## Current Build Status
✅ Production build completed successfully
✅ Location: `apps/staff-pwa/dist/`
✅ Bundle size: 496.47 KB (123.22 KB gzipped)
✅ PWA enabled with service worker

---

## Option 1: Deploy via SCP (Recommended)

### Step 1: Compress the build
```powershell
cd "c:\Users\musta\OneDrive\Documents\GitHub\FHK HK\fhk-housekeeping\apps\staff-pwa"
Compress-Archive -Path "dist\*" -DestinationPath "staff-pwa-production.zip" -Force
```

### Step 2: Upload to server
```powershell
# Using SCP (requires SSH access)
scp staff-pwa-production.zip root@13.234.30.197:/var/www/html/

# Then SSH into server and extract
ssh root@13.234.30.197
cd /var/www/html/
unzip staff-pwa-production.zip -d staff-pwa
```

---

## Option 2: Manual Upload via FTP/SFTP

1. Open FileZilla or WinSCP
2. Connect to: `13.234.30.197`
3. Upload entire `apps/staff-pwa/dist/` folder
4. Rename to `staff-pwa` on server

---

## Option 3: Deploy via GitHub Actions (Automated)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd apps/staff-pwa
          npm install
      
      - name: Build
        run: |
          cd apps/staff-pwa
          npm run build
      
      - name: Deploy to server
        uses: appleboy/scp-action@master
        with:
          host: 13.234.30.197
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          source: "apps/staff-pwa/dist/*"
          target: "/var/www/html/staff-pwa/"
```

---

## Server Configuration

### Nginx Configuration
Create/edit `/etc/nginx/sites-available/staff-pwa`:

```nginx
server {
    listen 3002;
    server_name 13.234.30.197;
    
    root /var/www/html/staff-pwa;
    index index.html;
    
    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Enable site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/staff-pwa /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Apache Configuration (Alternative)
Create `.htaccess` in the root folder:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Enable compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Browser caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>
```

---

## Environment Variables (Production)

If you need to configure Supabase for production, create `.env.production`:

```env
VITE_SUPABASE_URL=https://oglmyyyhfwuhyghcbnmi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nbG15eXloZnd1aHlnaGNibm1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MzIwNTYsImV4cCI6MjA4MDUwODA1Nn0.dFZqm7_CiT3Dmx_Lbbm8Iyk2arsfLmnDd3GCfyGkIxE
```

Then rebuild:
```powershell
cd "c:\Users\musta\OneDrive\Documents\GitHub\FHK HK\fhk-housekeeping\apps\staff-pwa"
npm run build
```

---

## Post-Deployment Checklist

### 1. Test the deployment:
```
http://13.234.30.197:3002
```

### 2. Verify all features:
- [ ] Login page loads
- [ ] Test all 10 user accounts
- [ ] Desktop dashboard (super_admin)
- [ ] Inventory manager access
- [ ] Laundry manager access
- [ ] Mobile supervisor interface
- [ ] Mobile staff interface
- [ ] Mobile maintenance interface

### 3. Check browser console:
- [ ] No JavaScript errors
- [ ] API calls to Supabase working
- [ ] PWA service worker registered
- [ ] Can install as app on mobile

### 4. Performance test:
- [ ] Page loads in < 3 seconds
- [ ] Images/assets loading properly
- [ ] Auto-refresh working on Dashboard
- [ ] Search/filter functions working

### 5. Mobile testing:
- [ ] Open on mobile device
- [ ] Tap "Add to Home Screen"
- [ ] Open installed app
- [ ] Test offline mode

---

## Quick Deploy Commands (Copy & Paste)

### Windows PowerShell:
```powershell
# Navigate to project
cd "c:\Users\musta\OneDrive\Documents\GitHub\FHK HK\fhk-housekeeping\apps\staff-pwa"

# Create deployment package
Compress-Archive -Path "dist\*" -DestinationPath "..\..\staff-pwa-production.zip" -Force

# Show success message
Write-Host "✅ Deployment package created: staff-pwa-production.zip" -ForegroundColor Green
Write-Host "📦 Upload this file to your server at: /var/www/html/" -ForegroundColor Cyan
Write-Host "🌐 Access URL: http://13.234.30.197:3002" -ForegroundColor Yellow
```

---

## Troubleshooting

### Issue: Blank page after deployment
**Solution:** Check browser console for errors. Usually a path issue.
```nginx
# Make sure root path is correct in nginx config
root /var/www/html/staff-pwa;
```

### Issue: API calls failing
**Solution:** Check CORS and Supabase configuration
```javascript
// Verify in browser console:
localStorage.getItem('fhk_user')
```

### Issue: PWA not installing
**Solution:** Requires HTTPS in production
```bash
# Install SSL certificate (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### Issue: 404 on refresh
**Solution:** Configure catch-all route
```nginx
# Add to nginx config:
try_files $uri $uri/ /index.html;
```

---

## 🎉 DEPLOYMENT COMPLETE!

Once deployed, share these credentials with your client:

**Access URL:** `http://13.234.30.197:3002`

**Test Users:**
- admin@demohotel.com (Super Admin)
- inventory@demohotel.com (Inventory Manager)
- laundry@demohotel.com (Laundry Manager)
- supervisor@demohotel.com (Supervisor)
- fatima@demohotel.com (Staff)
- maintenance@demohotel.com (Maintenance)

**Password:** Any password (demo mode)

---

## Next Steps After Deployment

1. **Enable Real Authentication:**
   - Replace hardcoded users with Supabase Auth
   - Implement password validation
   - Add user registration flow

2. **Security Enhancements:**
   - Enable SSL/HTTPS
   - Setup RLS policies in Supabase
   - Add rate limiting
   - Implement session timeout

3. **Production Features:**
   - Setup email notifications
   - Add push notifications
   - Implement real-time updates
   - Add audit logging

4. **Monitoring:**
   - Setup error tracking (Sentry)
   - Add analytics (Google Analytics)
   - Monitor server performance
   - Setup uptime monitoring
