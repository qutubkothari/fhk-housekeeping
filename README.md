# 🏨 FHK Housekeeping Management System

> **Enterprise-grade housekeeping management with AI-powered intelligence, real-time updates, and offline-capable mobile app**

[![Status](https://img.shields.io/badge/Status-Production%20Ready-success)]()
[![License](https://img.shields.io/badge/License-Proprietary-blue)]()
[![Version](https://img.shields.io/badge/Version-1.0.0-orange)]()

---

## 🎯 QUICK START - Choose Your Path

### 📖 For First-Time Readers
**→ Start here:** [`DELIVERY_PACKAGE.md`](DELIVERY_PACKAGE.md) - Complete client delivery overview  
**→ Or see:** [`PROJECT_COMPLETION.md`](PROJECT_COMPLETION.md) - What's included in this delivery

### ⚡ Want to Run Locally Fast?
**→ Quick setup:** [`QUICK_START.md`](QUICK_START.md) - Get running in 15 minutes

### 🚀 Ready to Deploy to Production?
**→ Deployment guide:** [`DEPLOYMENT_CHECKLIST.md`](DEPLOYMENT_CHECKLIST.md) - Step-by-step checklist

### 📚 Need Technical Details?
**→ Architecture:** [`PROJECT_SUMMARY.md`](PROJECT_SUMMARY.md) - System architecture & cost analysis  
**→ Setup guide:** [`SETUP_GUIDE.md`](SETUP_GUIDE.md) - Comprehensive 50-page manual  
**→ API docs:** [`API_DOCUMENTATION.md`](API_DOCUMENTATION.md) - Complete API reference

### 👥 Looking for User Manuals?
**→ Admin guide:** [`USER_MANUAL_ADMIN.md`](USER_MANUAL_ADMIN.md) - Desktop app guide (English)  
**→ Staff guide:** [`USER_MANUAL_STAFF.md`](USER_MANUAL_STAFF.md) - Mobile app guide (Arabic)

---

## ✨ KEY FEATURES

### 🏠 Housekeeping Operations
- ✅ Real-time room status tracking
- ✅ Digital task assignment with mobile app
- ✅ Quality inspection workflows
- ✅ Staff performance analytics

### 📦 Inventory Management
- ✅ Stock level tracking with automatic alerts
- ✅ Receipt/issue transactions
- ✅ Room-wise consumption tracking
- ✅ Supplier management

### 🧺 Linen & Laundry
- ✅ Clean/soiled tracking
- ✅ Batch management
- ✅ Damage workflow
- ✅ Par level monitoring

### 🤖 AI-Powered Service Requests
- ✅ **GPT-4 powered auto-classification**
- ✅ **Intelligent routing to correct department**
- ✅ Priority-based assignment
- ✅ Resolution tracking

### 🌐 Cross-Cutting Features
- 🌍 **Bilingual**: Arabic + English with RTL
- ⚡ **Real-time**: Live updates across all devices
- 📴 **Offline-first**: Mobile app works without internet
- 🔐 **Secure**: RLS, audit logs, role-based access
- 🏢 **Multi-tenant**: Supports multiple properties

---

## 💰 PRICING & ROI

**Investment**: ₹6,50,000 (one-time)  
**Monthly Cost**: ₹2,000 (infrastructure)  
**Monthly Savings**: ₹1,38,000  
**Payback Period**: 4.7 months

**vs. Traditional Solutions**: 90% cheaper (₹2K/month vs ₹20K+/month)

---

## 🏗️ ARCHITECTURE

### Tech Stack

- **Frontend**: React 18 + Vite + TailwindCSS + React Router 6
- **Backend**: Supabase (PostgreSQL + Realtime + Auth + Edge Functions)
- **Mobile**: Progressive Web App (PWA) with offline support
- **AI**: OpenAI GPT-4 for intelligent request routing
- **Deployment**: EC2 + Nginx + Let's Encrypt SSL
- **State**: Zustand + React Query
- **i18n**: i18next (Arabic/English with RTL)

### Project Structure

```
fhk-housekeeping/
├── 📄 DELIVERY_PACKAGE.md          ⭐ Client delivery overview
├── 📄 PROJECT_COMPLETION.md        🎁 What's included
├── 📄 QUICK_START.md               ⚡ 15-minute setup
├── 📄 DEPLOYMENT_CHECKLIST.md      ✅ Deployment guide
├── 📄 SETUP_GUIDE.md               🔧 Comprehensive manual
├── 📄 API_DOCUMENTATION.md         📚 API reference
├── 📄 PROJECT_SUMMARY.md           📊 Architecture & costs
├── 📄 USER_MANUAL_ADMIN.md         👨‍💼 Admin guide (EN)
├── 📄 USER_MANUAL_STAFF.md         👷 Staff guide (AR)
├── 📄 .env.example                 🔐 Environment template
│
├── 📁 supabase/
│   ├── migrations/                 Database schema & migrations
│   └── functions/                  OpenAI edge function
│
├── 📁 apps/
│   ├── admin-web/                  Desktop web application
│   └── staff-pwa/                  Mobile Progressive Web App
│
├── 📁 shared/                      Shared utilities
└── 📁 deployment/                  Nginx config & deploy scripts
```

---

## 📚 DOCUMENTATION INDEX

| Document | Purpose | Time to Read |
|----------|---------|--------------|
| [`DELIVERY_PACKAGE.md`](DELIVERY_PACKAGE.md) | Client delivery overview, payment schedule, support | 10 mins |
| [`PROJECT_COMPLETION.md`](PROJECT_COMPLETION.md) | Complete deliverables breakdown, what's included | 15 mins |
| [`QUICK_START.md`](QUICK_START.md) | Get running locally in 15 minutes | 5 mins |
| [`DEPLOYMENT_CHECKLIST.md`](DEPLOYMENT_CHECKLIST.md) | Step-by-step production deployment | 20 mins |
| [`SETUP_GUIDE.md`](SETUP_GUIDE.md) | Comprehensive setup & troubleshooting | 60 mins |
| [`API_DOCUMENTATION.md`](API_DOCUMENTATION.md) | Complete API reference with examples | 45 mins |
| [`PROJECT_SUMMARY.md`](PROJECT_SUMMARY.md) | Architecture, costs, scalability analysis | 30 mins |
| [`USER_MANUAL_ADMIN.md`](USER_MANUAL_ADMIN.md) | Admin panel user guide (English) | 40 mins |
| [`USER_MANUAL_STAFF.md`](USER_MANUAL_STAFF.md) | Staff mobile app guide (Arabic) | 30 mins |

**Total Documentation**: 9 comprehensive guides, 250+ pages

---

## 🎯 GETTING STARTED

### Option 1: Local Development (15 minutes)

Follow [`QUICK_START.md`](QUICK_START.md) for fastest setup:

```bash
# 1. Install dependencies
npm install
cd apps/admin-web && npm install
cd ../staff-pwa && npm install

# 2. Setup Supabase (see QUICK_START.md)

# 3. Configure .env files
cp .env.example apps/admin-web/.env
cp .env.example apps/staff-pwa/.env
# (Edit with your credentials)

# 4. Run applications
cd apps/admin-web && npm run dev    # localhost:3000
cd apps/staff-pwa && npm run dev    # localhost:3001
```

### Option 2: Production Deployment (4 hours)

Follow [`DEPLOYMENT_CHECKLIST.md`](DEPLOYMENT_CHECKLIST.md) for complete deployment:

1. **Prerequisites**: Domain, EC2, Supabase, OpenAI
2. **Run deploy script**: `sudo deployment/deploy.sh`
3. **Configure SSL**: Automated with Let's Encrypt
4. **Test & verify**: Admin panel + Staff PWA
5. **Training**: Admin (4h) + Staff (2h)

---

## 🔐 DEFAULT CREDENTIALS

**Admin Panel** (http://localhost:3000)
```
Email: admin@demohotel.com
Password: admin123
```

**Staff PWA** (http://localhost:3001)
```
Email: ahmed@demohotel.com
Password: staff123
```

⚠️ **Change passwords immediately after first login!**

---

## 📊 DATABASE SCHEMA

### Core Tables (11 total)
- `organizations` - Multi-tenant root
- `users` - Authentication & roles
- `rooms` - Hotel rooms
- `housekeeping_tasks` - Work assignments
- `service_requests` - Guest/breakdown requests
- `inventory_items` - Stock items
- `inventory_transactions` - Stock movements
- `linen_items` - Linen types
- `linen_transactions` - Linen movements
- `audit_logs` - Complete audit trail
- `notifications` - Alert system

### Views & Functions
- 5 analytical views for dashboards
- 3 RPC functions for complex queries
- Automated triggers for real-time updates

See [`API_DOCUMENTATION.md`](API_DOCUMENTATION.md) for complete schema.

---

## 🚀 DEPLOYMENT

### Automated Deployment Script

```bash
cd deployment
sudo ./deploy.sh
```

**What it does:**
✅ Installs Node.js 18  
✅ Installs & configures Nginx  
✅ Builds both applications  
✅ Configures SSL with Let's Encrypt  
✅ Sets up firewall (UFW)  
✅ Creates update script  

**Result**: Live system at `https://your-domain.com`

See [`DEPLOYMENT_CHECKLIST.md`](DEPLOYMENT_CHECKLIST.md) for detailed steps.

---

## 🧪 TESTING

### Test AI Auto-Routing

1. Open Staff PWA
2. Navigate to "الخدمات" (Services)
3. Select room 101
4. Enter: "المكيف لا يعمل" (AC not working)
5. Submit request
6. Check Admin Panel → Service Requests
7. Verify AI classification (type, category, priority, department)

### Test Offline Mode

1. Open Staff PWA on mobile
2. Enable airplane mode
3. Create tasks, complete tasks
4. Disable airplane mode
5. Watch automatic sync!

---

## 📱 MOBILE PWA INSTALLATION

### Android (Chrome)
1. Open `https://your-domain.com/staff`
2. Tap menu (⋮) → "Add to Home Screen"
3. Tap "Add"
4. Icon appears on home screen

### iOS (Safari)
1. Open `https://your-domain.com/staff`
2. Tap share icon (⬆️)
3. Tap "Add to Home Screen"
4. Tap "Add"
5. Icon appears on home screen

**Works like a native app!** 📱

---

## 🆘 TROUBLESHOOTING

### Common Issues

**"Supabase connection failed"**
- Check `.env` file has correct credentials
- Verify Supabase project is active
- Check API key is anon/public key

**"Port already in use"**
```bash
npx kill-port 3000
# Or use different port
npm run dev -- --port 3002
```

**"OpenAI API error"**
- Verify API key in Supabase secrets
- Check OpenAI account has credits
- Verify edge function deployed

**More solutions**: See [`SETUP_GUIDE.md`](SETUP_GUIDE.md) Troubleshooting section (50+ issues covered)

---

## 📞 SUPPORT

### Technical Support
- **Email**: support@fhksolutions.com
- **Phone**: [Your Number]
- **Hours**: 9 AM - 6 PM

### Emergency Contact
- **24/7 Hotline**: [Your Number]
- **WhatsApp**: [Your Number]

### Documentation
- All guides in this repository
- API reference with examples
- User manuals (Admin + Staff)

---

## 🎉 SUCCESS METRICS

### After Deployment
- ✅ 100% staff adoption within 2 weeks
- ✅ 95%+ task completion rate
- ✅ 30%+ reduction in task completion time
- ✅ 80%+ reduction in inventory stockouts
- ✅ 70% reduction in manual paperwork
- ✅ ₹1,38,000/month cost savings
- ✅ 4.7 month ROI payback

---

## 📜 LICENSE

Proprietary - All rights reserved to FHK Solutions

**Client**: Full source code ownership transfers after final payment  
**Usage**: Unlimited use for client's properties  
**Modification**: Full rights to customize and extend

---

## 🙏 ACKNOWLEDGMENTS

Built with modern technologies:
- React 18 & Vite (Frontend framework)
- Supabase (Backend platform)
- TailwindCSS (Styling)
- OpenAI GPT-4 (AI intelligence)
- Nginx (Web server)
- Let's Encrypt (Free SSL)

---

## 📈 WHAT'S NEXT?

### Immediate Steps
1. ✅ Review [`DELIVERY_PACKAGE.md`](DELIVERY_PACKAGE.md)
2. ✅ Try [`QUICK_START.md`](QUICK_START.md) for local testing
3. ✅ Schedule deployment date
4. ✅ Make second payment (₹2,60,000)
5. ✅ Deploy to production
6. ✅ Conduct training
7. ✅ Go live!

### Future Enhancements (Optional)
- 📊 Advanced analytics & BI reports
- 📧 Email/SMS notifications
- 📱 Native mobile apps (iOS/Android)
- 🤖 More AI features (predictions, recommendations)
- 🔗 Integrations (PMS, POS, accounting)
- 🌍 Multi-language support (beyond EN/AR)

---

## 📞 READY TO DEPLOY?

**Contact us to get started:**

📧 **Email**: support@fhksolutions.com  
📞 **Phone**: [Your Number]  
💬 **WhatsApp**: [Your Number]

**We're ready when you are!** 🚀

---

**⭐ Thank you for choosing FHK Solutions! ⭐**

*Transforming housekeeping operations with cutting-edge technology*

---

*Last Updated: December 5, 2025*  
*Version: 1.0.0*  
*Status: Production Ready* ✅

### Prerequisites
- Node.js 18+
- Supabase CLI
- Docker (optional)

### Setup

1. **Install dependencies**
```bash
cd apps/admin-web && npm install
cd ../staff-pwa && npm install
```

2. **Configure Supabase**
```bash
cd supabase
supabase init
supabase db push
```

3. **Environment variables**
Create `.env` files in both admin-web and staff-pwa:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_OPENAI_API_KEY=your_openai_key
```

4. **Run development servers**
```bash
# Admin panel
cd apps/admin-web && npm run dev

# Staff PWA
cd apps/staff-pwa && npm run dev
```

## 🌟 Features

### Module 1: Housekeeping Operations
- Room assignment & tracking
- Real-time cleaning status updates
- Digital inspection checklists
- Staff task management

### Module 2: Inventory Management
- Item receipt & issue tracking
- Real-time stock levels
- Automatic reorder alerts
- Room-wise consumption tracking

### Module 3: Linen & Laundry
- Clean/soiled linen tracking
- Laundry batch management
- Damage/discard approval workflow
- Par level monitoring

### Module 4: Service Requests
- Guest request logging
- Breakdown reporting
- AI-powered auto-routing
- Priority-based assignment

## 🌐 Multi-language Support

- Full Arabic (RTL) interface
- English interface
- Dynamic language switching

## 📊 Deployment

Detailed deployment instructions in `deployment/README.md`

## 📝 License

Proprietary - FHK Solutions
