# ⚡ QUICK START GUIDE - 15 Minutes to Running System

Get the FHK Housekeeping System running locally in 15 minutes!

---

## 🎯 Prerequisites (5 minutes)

### Required Software
- **Node.js 18+**: [Download](https://nodejs.org/)
- **Git**: [Download](https://git-scm.com/)
- **Supabase Account**: [Sign up free](https://supabase.com/)
- **OpenAI Account**: [Sign up](https://platform.openai.com/)

### Check Installations
```bash
node --version  # Should be v18.x or higher
npm --version   # Should be 9.x or higher
git --version   # Any recent version
```

---

## 📦 Step 1: Clone & Install (3 minutes)

```bash
# Clone repository
cd "c:\Users\musta\OneDrive\Documents\GitHub\FHK HK"
cd fhk-housekeeping

# Install dependencies
npm install

# Install in both apps
cd apps/admin-web
npm install
cd ../staff-pwa
npm install
cd ../..
```

---

## 🗄️ Step 2: Setup Supabase (5 minutes)

### Create Project
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Click "New Project"
3. Fill in:
   - **Name**: `fhk-housekeeping`
   - **Database Password**: (save this securely!)
   - **Region**: Choose closest to you
4. Wait 2 minutes for project creation

### Run Migrations
1. In Supabase Dashboard → SQL Editor
2. Create new query
3. Copy content from `supabase/migrations/001_initial_schema.sql`
4. Click "Run"
5. Repeat for `002_views_and_functions.sql`

### Deploy Edge Function
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy edge function
supabase functions deploy auto-route-requests
```

### Set OpenAI Secret
1. Get OpenAI API key from [OpenAI Dashboard](https://platform.openai.com/api-keys)
2. In Supabase Dashboard → Project Settings → Edge Functions
3. Add secret:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key

### Get API Credentials
1. In Supabase Dashboard → Project Settings → API
2. Copy:
   - **Project URL**: `https://xxx.supabase.co`
   - **Anon/Public Key**: `eyJxxx...`

---

## ⚙️ Step 3: Configure Environment (2 minutes)

### Admin Web App
```bash
cd apps/admin-web
```

Create `.env` file:
```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Staff PWA
```bash
cd ../staff-pwa
```

Create `.env` file:
```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 🚀 Step 4: Run Applications (1 minute)

### Terminal 1: Admin Web
```bash
cd apps/admin-web
npm run dev
```
Opens at: http://localhost:3000

### Terminal 2: Staff PWA
```bash
cd apps/staff-pwa
npm run dev
```
Opens at: http://localhost:3001

---

## 🎉 Step 5: Login & Test (4 minutes)

### Default Credentials
```
Email: admin@demohotel.com
Password: admin123
```

### Admin Panel Test
1. Open http://localhost:3000
2. Login with default credentials
3. See dashboard with real-time stats
4. Navigate to "Rooms" → Should see demo rooms
5. Go to "Housekeeping" → See demo tasks
6. Check "Inventory" → See demo items

### Staff PWA Test
1. Open http://localhost:3001
2. Login with staff credentials:
   ```
   Email: ahmed@demohotel.com
   Password: staff123
   ```
3. See task list in Arabic
4. Click a task → View details
5. Test service request form

### Test AI Auto-Routing
1. In Staff PWA → "الخدمات" tab
2. Select room: 101
3. Type: "المكيف لا يعمل" (AC not working)
4. Click "إرسال الطلب"
5. Check Admin Panel → Service Requests
6. Should see auto-classified request!

---

## ✅ Verification Checklist

Everything working? Check these:

- [ ] Admin panel loads at localhost:3000
- [ ] Staff PWA loads at localhost:3001
- [ ] Dashboard shows stats (rooms, tasks, etc.)
- [ ] Can create/edit rooms
- [ ] Can assign tasks
- [ ] Can view inventory
- [ ] Staff app shows tasks in Arabic
- [ ] Service request AI classification works
- [ ] Real-time updates work (open admin + staff simultaneously)
- [ ] No console errors in browser DevTools

---

## 🐛 Common Issues & Fixes

### "Cannot find module" errors
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### "Supabase connection failed"
- Check `.env` file exists and has correct values
- Verify Supabase project is active
- Check API key is anon/public key, not service role

### "OpenAI API error"
- Verify API key is set in Supabase secrets
- Check OpenAI account has credits
- Verify edge function is deployed

### Port already in use
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
npm run dev -- --port 3002
```

### Migrations fail
- Check database password is correct
- Verify you have owner permissions
- Run migrations one at a time
- Check SQL syntax in error message

---

## 📚 Next Steps

Once everything is running:

1. **Read Documentation**
   - `USER_MANUAL_ADMIN.md` - Admin panel guide
   - `USER_MANUAL_STAFF.md` - Staff app guide (Arabic)
   - `API_DOCUMENTATION.md` - Technical reference

2. **Customize Data**
   - Add your hotel rooms
   - Create staff accounts
   - Add inventory items
   - Configure linen types

3. **Test Workflows**
   - Create and assign tasks
   - Complete tasks from mobile
   - Submit service requests
   - Generate reports

4. **Deploy to Production**
   - Follow `SETUP_GUIDE.md` for detailed instructions
   - Use `DEPLOYMENT_CHECKLIST.md` for step-by-step

---

## 💬 Need Help?

**Having issues?** Check these resources:

1. **Setup Guide**: `SETUP_GUIDE.md` - Comprehensive setup instructions
2. **Troubleshooting**: See section in SETUP_GUIDE.md
3. **API Docs**: `API_DOCUMENTATION.md` - All endpoints and examples
4. **Support**: Email support@fhksolutions.com

---

## 🎯 Development Tips

### Hot Reload
Both apps have hot reload enabled. Edit files and see changes instantly!

### Database Changes
After modifying database schema:
1. Update migration file
2. Run in Supabase SQL Editor
3. Restart dev servers

### Testing Real-time
Open admin panel and staff PWA side-by-side:
- Complete task in PWA
- Watch status update in admin instantly!

### Debugging
- **Browser DevTools**: F12 → Console tab
- **Network Tab**: See API calls
- **Supabase Logs**: Dashboard → Logs

---

**🚀 You're now running the FHK Housekeeping System locally!**

**Total Time**: ~15 minutes  
**Status**: ✅ Ready for development and testing

---

*For production deployment, see `DEPLOYMENT_CHECKLIST.md` and `SETUP_GUIDE.md`*
