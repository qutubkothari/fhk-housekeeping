# FHK Housekeeping Management System - Complete Setup Guide

## 📋 Prerequisites

Before starting, ensure you have:

- **Node.js** 18+ installed
- **Supabase** account (free tier works)
- **EC2** instance (Ubuntu 22.04 recommended) or any Linux server
- **Domain name** pointed to your server (for SSL)
- **OpenAI API key** (for auto-routing feature)

---

## 🚀 Quick Start (Development)

### 1. Clone & Install

```bash
cd fhk-housekeeping
npm install
```

### 2. Setup Supabase

#### A. Create Supabase Project
1. Go to https://supabase.com and create new project
2. Wait for project to be ready (~2 minutes)
3. Note your project URL and anon key

#### B. Run Database Migrations

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
cd supabase
supabase db push
```

Or manually:
1. Go to Supabase Dashboard → SQL Editor
2. Copy content of `supabase/migrations/001_initial_schema.sql`
3. Run the SQL
4. Copy content of `supabase/migrations/002_views_and_functions.sql`
5. Run the SQL

#### C. Deploy Edge Function

```bash
cd supabase/functions
supabase functions deploy auto-route-requests

# Set environment variables
supabase secrets set OPENAI_API_KEY=your-openai-key
```

### 3. Configure Environment Variables

#### Admin Web (`apps/admin-web/.env`)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_OPENAI_API_KEY=your-openai-key
```

#### Staff PWA (`apps/staff-pwa/.env`)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run Development Servers

```bash
# Terminal 1 - Admin Web
cd apps/admin-web
npm install
npm run dev
# Runs on http://localhost:3000

# Terminal 2 - Staff PWA
cd apps/staff-pwa
npm install
npm run dev
# Runs on http://localhost:3001
```

### 5. Create Test User

In Supabase Dashboard → Authentication → Users:
1. Click "Add user"
2. Email: `admin@demohotel.com`
3. Password: `admin123`
4. Auto-confirm: Yes

The database seed already has this user configured as admin.

---

## 🌐 Production Deployment (EC2)

### Prerequisites
- EC2 instance (t2.small minimum, 2GB RAM)
- Ubuntu 22.04 LTS
- Domain pointed to server IP
- SSH access

### Step-by-Step Deployment

#### 1. SSH into EC2
```bash
ssh ubuntu@your-server-ip
```

#### 2. Clone Repository
```bash
cd ~
git clone https://github.com/your-username/fhk-housekeeping.git
cd fhk-housekeeping
```

#### 3. Configure Environment Files

**Admin Web:**
```bash
cd apps/admin-web
cp .env.example .env
nano .env
# Add your actual Supabase credentials
```

**Staff PWA:**
```bash
cd apps/staff-pwa
cp .env.example .env
nano .env
# Add your actual Supabase credentials
```

#### 4. Run Deployment Script

```bash
cd ~/fhk-housekeeping/deployment
chmod +x deploy.sh
./deploy.sh
```

The script will:
- ✅ Install Node.js, Nginx, Certbot
- ✅ Build both applications
- ✅ Configure Nginx
- ✅ Setup SSL certificate
- ✅ Configure firewall

#### 5. Update Nginx Configuration

Edit domain in nginx.conf:
```bash
sudo nano /etc/nginx/sites-available/fhk-housekeeping
```

Replace `housekeeping.yourdomain.com` with your actual domain.

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔐 Security Setup

### 1. Supabase Row Level Security (RLS)

RLS is already enabled in migrations. To verify:

```sql
-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### 2. Configure Supabase Auth

In Supabase Dashboard → Authentication → URL Configuration:

- **Site URL**: `https://housekeeping.yourdomain.com`
- **Redirect URLs**: 
  - `https://housekeeping.yourdomain.com`
  - `https://housekeeping.yourdomain.com/staff`

### 3. Setup Email Templates

In Supabase Dashboard → Authentication → Email Templates:

Customize:
- Confirmation email
- Password reset email
- Magic link email

Add Arabic translations for staff.

---

## 📱 Mobile App Installation (PWA)

### For Staff (Android/iOS):

1. Open `https://yourdomain.com/staff` in Chrome/Safari
2. Tap browser menu (⋮)
3. Select "Add to Home Screen"
4. Icon will appear on home screen like native app

**Offline Support:**
- Works without internet
- Queues actions when offline
- Auto-syncs when back online

---

## 🔧 Configuration & Customization

### 1. Add Rooms

Use Supabase dashboard or create a seeding script:

```sql
INSERT INTO rooms (org_id, room_number, floor, room_type) VALUES
('00000000-0000-0000-0000-000000000001', '101', 1, 'standard'),
('00000000-0000-0000-0000-000000000001', '102', 1, 'standard'),
('00000000-0000-0000-0000-000000000001', '201', 2, 'deluxe');
```

### 2. Add Staff Users

```sql
-- First create user in Supabase Auth, then:
INSERT INTO users (id, org_id, email, full_name, full_name_ar, role) VALUES
('user-uuid-from-auth', '00000000-0000-0000-0000-000000000001', 
 'staff@hotel.com', 'John Doe', 'جون دو', 'staff');
```

### 3. Add Inventory Items

```sql
INSERT INTO inventory_items (org_id, item_code, item_name_en, item_name_ar, category, unit, current_stock, min_level, reorder_level) VALUES
('00000000-0000-0000-0000-000000000001', 'SOAP-001', 'Hand Soap', 'صابون اليدين', 'toiletries', 'pcs', 100, 20, 30);
```

### 4. Add Linen Items

```sql
INSERT INTO linen_items (org_id, linen_type, size, item_name_en, item_name_ar, total_stock, clean_stock, par_level) VALUES
('00000000-0000-0000-0000-000000000001', 'bed_sheet', 'king', 'King Bed Sheet', 'ملاءة سرير كينج', 50, 50, 40);
```

---

## 🔄 Updates & Maintenance

### Update Application

```bash
# On EC2 server
~/update-fhk.sh
```

### View Logs

```bash
# Nginx access logs
sudo tail -f /var/log/nginx/fhk-housekeeping-access.log

# Nginx error logs
sudo tail -f /var/log/nginx/fhk-housekeeping-error.log

# System logs
sudo journalctl -u nginx -f
```

### Database Backup

```bash
# From local machine
supabase db dump -f backup.sql

# Restore
supabase db reset
psql -h db.your-project.supabase.co -U postgres -d postgres -f backup.sql
```

---

## 📊 Features Checklist

### Admin Panel
- ✅ Dashboard with real-time stats
- ✅ Room management
- ✅ Task assignment
- ✅ Inventory tracking
- ✅ Linen management
- ✅ Service requests
- ✅ Staff management
- ✅ Reports & analytics
- ✅ Arabic/English interface

### Staff PWA
- ✅ Task list with real-time updates
- ✅ Start/complete tasks
- ✅ Service request submission
- ✅ AI-powered auto-routing
- ✅ Offline support
- ✅ Arabic interface
- ✅ PWA installable

### Backend
- ✅ PostgreSQL database
- ✅ Row-level security
- ✅ Real-time subscriptions
- ✅ Audit logging
- ✅ Automated notifications
- ✅ OpenAI integration

---

## 🐛 Troubleshooting

### Build Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Supabase Connection Issues

1. Check if Supabase project is active
2. Verify URL and keys in .env
3. Check RLS policies allow access

### Nginx Not Starting

```bash
# Check configuration
sudo nginx -t

# View detailed errors
sudo journalctl -xe
```

### PWA Not Installing

1. Ensure HTTPS is working
2. Check manifest.json is accessible
3. Verify service worker registration in browser console

---

## 💰 Cost Estimation

### Infrastructure Costs (Monthly)

| Service | Tier | Cost |
|---------|------|------|
| Supabase | Free | $0 |
| EC2 t2.small | On-demand | ~$17 |
| Domain | - | ~$12/year |
| SSL Certificate | Let's Encrypt | $0 |
| **Total** | | **~$18/month** |

### Scaling Costs

- **500 users**: Same infrastructure
- **1000+ users**: Upgrade EC2 to t2.medium (~$34/month)
- **5000+ users**: Supabase Pro ($25/month) + t2.large (~$70/month)

---

## 📞 Support & Contact

For issues or customizations:
- Create GitHub issue
- Email: support@fhksolutions.com
- Documentation: [Link to full docs]

---

## 📝 License

Proprietary - FHK Solutions © 2025
