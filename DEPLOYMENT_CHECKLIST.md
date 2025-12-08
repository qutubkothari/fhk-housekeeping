# 🚀 DEPLOYMENT CHECKLIST

**Project**: FHK Housekeeping Management System  
**Client**: FHK Hotel Management  
**Date**: December 5, 2025

---

## PRE-DEPLOYMENT CHECKLIST

### ✅ Client Confirmation
- [x] Client approved project scope
- [x] Budget confirmed (₹6,50,000)
- [ ] 40% payment received (₹2,60,000) - **DUE NOW**
- [ ] Domain name provided: __________________
- [ ] Deployment date scheduled: __________________
- [ ] Training dates scheduled: __________________

### ✅ Infrastructure Access
- [ ] AWS EC2 instance created
  - [ ] Ubuntu 22.04 LTS
  - [ ] Minimum: t3.small (2 vCPU, 2 GB RAM)
  - [ ] Security groups configured (ports 80, 443, 22)
  - [ ] Elastic IP assigned
- [ ] SSH access tested
- [ ] Domain DNS configured
  - [ ] A record: `@` → EC2 IP
  - [ ] A record: `www` → EC2 IP

### ✅ Supabase Setup
- [ ] Supabase account created
- [ ] New project created: __________________
- [ ] Database credentials saved securely
- [ ] Migrations executed:
  - [ ] `001_initial_schema.sql`
  - [ ] `002_views_and_functions.sql`
- [ ] RLS policies verified
- [ ] Edge function deployed:
  - [ ] `auto-route-requests`
  - [ ] OpenAI API key set in secrets
- [ ] Test connection from local

### ✅ OpenAI Setup
- [ ] OpenAI account created
- [ ] API key generated
- [ ] Billing configured
- [ ] Usage limits set
- [ ] API key added to Supabase secrets

### ✅ Environment Configuration
- [ ] `.env` created for admin-web
- [ ] `.env` created for staff-pwa
- [ ] All required variables filled:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
  - [ ] `OPENAI_API_KEY` (in Supabase)
- [ ] Test builds locally

---

## DEPLOYMENT DAY CHECKLIST

### Phase 1: Server Setup (30 mins)

- [ ] SSH into EC2 instance
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

- [ ] Update system
```bash
sudo apt update && sudo apt upgrade -y
```

- [ ] Clone repository
```bash
cd ~
git clone https://github.com/your-org/fhk-housekeeping.git
cd fhk-housekeeping
```

- [ ] Make deploy script executable
```bash
chmod +x deployment/deploy.sh
```

### Phase 2: Automated Deployment (2-3 hours)

- [ ] Run deployment script
```bash
sudo deployment/deploy.sh
```

**Script will:**
- Install Node.js 18
- Install Nginx
- Build both applications
- Configure Nginx
- Setup SSL with Let's Encrypt
- Configure firewall
- Create update script

- [ ] Wait for script completion
- [ ] Review output for errors
- [ ] Verify services running:
```bash
sudo systemctl status nginx
node --version
npm --version
```

### Phase 3: SSL Certificate (15 mins)

- [ ] Run Certbot
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

- [ ] Enter email for notifications
- [ ] Agree to terms
- [ ] Choose redirect option (2)
- [ ] Verify certificate installed

### Phase 4: Application Testing (30 mins)

#### Admin Panel Testing
- [ ] Open `https://your-domain.com`
- [ ] Verify HTTPS working (green padlock)
- [ ] Test login with default credentials
- [ ] Change admin password immediately
- [ ] Test dashboard loads
- [ ] Verify real-time data updates
- [ ] Test language toggle (EN/AR)
- [ ] Create test room
- [ ] Assign test task
- [ ] Check all pages accessible

#### Staff PWA Testing
- [ ] Open `https://your-domain.com/staff`
- [ ] Test on mobile device
- [ ] Install PWA ("Add to Home Screen")
- [ ] Test login with staff credentials
- [ ] Verify Arabic interface
- [ ] Test task list loading
- [ ] Test offline mode:
  - [ ] Enable airplane mode
  - [ ] Verify app still works
  - [ ] Create test task
  - [ ] Disable airplane mode
  - [ ] Verify sync completes

#### AI Service Request Testing
- [ ] Submit test service request
- [ ] Verify AI classification response
- [ ] Check request appears in admin panel
- [ ] Verify auto-routing worked

### Phase 5: Data Migration (1 hour)

- [ ] Import existing data (if any):
  - [ ] Organizations
  - [ ] Users
  - [ ] Rooms
  - [ ] Inventory items
  - [ ] Linen items
- [ ] Verify data integrity
- [ ] Test data access across users

### Phase 6: User Account Creation (30 mins)

- [ ] Create admin accounts
- [ ] Create supervisor accounts
- [ ] Create staff accounts
- [ ] Send credentials via email
- [ ] Verify each user can login

---

## POST-DEPLOYMENT CHECKLIST

### Day 1: Monitoring

- [ ] Monitor server resources
```bash
htop
df -h
free -h
```

- [ ] Check application logs
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

- [ ] Monitor Supabase dashboard
  - [ ] Active connections
  - [ ] Query performance
  - [ ] Storage usage
  - [ ] API usage

- [ ] Monitor OpenAI usage
  - [ ] API calls count
  - [ ] Costs incurred
  - [ ] Error rate

### Week 1: Training

#### Admin Training Session (4 hours)
- [ ] Date: __________________
- [ ] Time: __________________
- [ ] Participants: __________________
- [ ] Topics covered:
  - [ ] System overview
  - [ ] Room management
  - [ ] Task assignment
  - [ ] Inventory operations
  - [ ] Linen management
  - [ ] Service requests
  - [ ] Staff management
  - [ ] Reports
  - [ ] Settings
- [ ] Q&A session completed
- [ ] Feedback collected

#### Staff Training Session (2 hours)
- [ ] Date: __________________
- [ ] Time: __________________
- [ ] Participants: __________________
- [ ] Topics covered:
  - [ ] Mobile app installation
  - [ ] Login process
  - [ ] Task list navigation
  - [ ] Starting tasks
  - [ ] Completing tasks
  - [ ] Service request submission
  - [ ] Offline mode usage
- [ ] Hands-on practice
- [ ] Q&A session completed

### Week 2: Live Support

- [ ] On-site presence (if agreed)
- [ ] Monitor system usage
- [ ] Address user questions
- [ ] Fix any issues discovered
- [ ] Optimize workflows based on feedback
- [ ] Document common issues

---

## ONGOING MAINTENANCE CHECKLIST

### Daily
- [ ] Monitor server uptime
- [ ] Check error logs
- [ ] Review user feedback

### Weekly
- [ ] Review system performance
- [ ] Check database size/usage
- [ ] Review OpenAI costs
- [ ] Backup verification

### Monthly
- [ ] Security updates
- [ ] Performance optimization
- [ ] Feature enhancements (if contracted)
- [ ] Generate usage reports
- [ ] Invoice for monthly infrastructure

---

## TROUBLESHOOTING GUIDE

### Issue: Site not loading

**Check:**
1. Server running: `sudo systemctl status nginx`
2. DNS propagation: `nslookup your-domain.com`
3. Firewall: `sudo ufw status`
4. SSL certificate: `sudo certbot certificates`

**Fix:**
```bash
sudo systemctl restart nginx
```

### Issue: Database connection failed

**Check:**
1. Supabase project status
2. Environment variables
3. API keys validity

**Fix:**
- Verify `.env` files
- Test Supabase connection
- Regenerate keys if expired

### Issue: PWA not installing

**Check:**
1. HTTPS enabled
2. Service worker registered
3. Manifest file accessible

**Fix:**
- Clear browser cache
- Check service worker in DevTools
- Verify manifest.json loads

### Issue: AI auto-routing not working

**Check:**
1. OpenAI API key in Supabase secrets
2. Edge function deployed
3. API quota/limits

**Fix:**
```bash
supabase functions deploy auto-route-requests
```

---

## SUCCESS METRICS

### Technical Metrics
- [ ] Server uptime: > 99.5%
- [ ] Page load time: < 2 seconds
- [ ] API response time: < 200ms
- [ ] Database query time: < 100ms
- [ ] Zero data loss incidents

### Business Metrics
- [ ] User adoption: 100% staff using app within 2 weeks
- [ ] Task completion rate: > 95%
- [ ] Average task time reduction: > 30%
- [ ] Inventory stockout reduction: > 80%
- [ ] Guest complaint resolution time: < 2 hours

### User Satisfaction
- [ ] Admin satisfaction: > 4/5 stars
- [ ] Staff satisfaction: > 4/5 stars
- [ ] Zero critical bugs reported
- [ ] Positive feedback collected

---

## FINAL PAYMENT TRIGGER

### Conditions for Final Payment (₹1,95,000)

All must be checked:
- [ ] System deployed and accessible
- [ ] All modules functional
- [ ] Training completed
- [ ] 1 week of live usage without critical issues
- [ ] User acceptance documented
- [ ] Documentation delivered
- [ ] Support contact established
- [ ] Client satisfaction confirmed

**Final Payment Due Date**: __________________

---

## SUPPORT CONTACT INFORMATION

**Technical Support:**
- Email: support@fhksolutions.com
- Phone: [Your Number]
- Hours: 9 AM - 6 PM

**Emergency Contact:**
- 24/7 Hotline: [Your Number]
- WhatsApp: [Your Number]

**Project Manager:**
- Name: [Your Name]
- Email: [Your Email]
- Phone: [Your Number]

---

## SIGN-OFF

### Client Acceptance

**I confirm that the FHK Housekeeping Management System has been deployed successfully and meets the agreed specifications.**

**Client Name**: __________________  
**Signature**: __________________  
**Date**: __________________

### Deployment Team

**I confirm that the deployment has been completed according to the checklist and the system is ready for production use.**

**Developer Name**: __________________  
**Signature**: __________________  
**Date**: __________________

---

**🎉 Congratulations on successful deployment! 🎉**

*Keep this checklist for reference and future deployments.*
