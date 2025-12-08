# FHK Hotel Management System - User Role Testing Guide

## Test Date: December 7, 2025

## 🎯 Testing Overview

This guide helps you test all 6 user roles with their specific access permissions.

---

## 🖥️ Desktop Dashboard Users

### 1. Super Admin (Full Access)
**Login:** `admin@demohotel.com`

**Expected Access:**
- ✅ Dashboard (default landing page)
- ✅ Rooms Management
- ✅ Staff Management
- ✅ Housekeeping Tasks
- ✅ Maintenance/Service Requests
- ✅ Inventory
- ✅ Linen & Laundry
- ✅ All future modules (Reports, Settings, etc.)

**Test Steps:**
1. Login with admin@demohotel.com
2. Verify sidebar shows ALL menu items
3. Navigate to Dashboard - should see statistics
4. Navigate to Rooms - should see room grid/list
5. Navigate to Staff - should see staff cards
6. Navigate to Housekeeping - should see tasks
7. Navigate to Maintenance - should see service requests
8. Navigate to Inventory - should see stock items
9. Navigate to Linen - should see linen inventory
10. Try to add/edit/delete in any module - should work
11. Sign out successfully

---

### 2. Inventory Manager (Inventory Only)
**Login:** `inventory@demohotel.com`

**Expected Access:**
- ✅ Inventory (default and ONLY page)
- ❌ Dashboard (access denied)
- ❌ Rooms (access denied)
- ❌ Staff (access denied)
- ❌ Housekeeping (access denied)
- ❌ Maintenance (access denied)
- ❌ Linen (access denied)

**Test Steps:**
1. Login with inventory@demohotel.com
2. Verify sidebar shows ONLY "Inventory" menu item
3. Should automatically land on Inventory page
4. See inventory items with stock levels
5. View low stock, out of stock alerts
6. Search for items
7. Stats cards should show correctly
8. Try to manually navigate to other pages - should be blocked
9. Sign out successfully

**Expected Sidebar Menu:**
```
┌─ Inventory (only item)
```

---

### 3. Laundry Manager (Linen Only)
**Login:** `laundry@demohotel.com`

**Expected Access:**
- ✅ Linen & Laundry (default and ONLY page)
- ❌ All other pages (access denied)

**Test Steps:**
1. Login with laundry@demohotel.com
2. Verify sidebar shows ONLY "Linen & Laundry" menu item
3. Should automatically land on Linen page
4. See clean/soiled/in laundry quantities
5. Stats cards showing totals
6. Color-coded status bars (green/yellow/blue)
7. Search functionality works
8. Auto-refresh every 30 seconds
9. Try to manually navigate to other pages - should be blocked
10. Sign out successfully

**Expected Sidebar Menu:**
```
┌─ Linen & Laundry (only item)
```

---

## 📱 Mobile Field Staff Users

### 4. Supervisor (Mobile Manager)
**Login:** `supervisor@demohotel.com`

**Expected Interface:**
- Simple mobile card interface (not desktop dashboard)
- Staff performance overview
- Room assignment capabilities
- Task monitoring

**Test Steps:**
1. Login with supervisor@demohotel.com
2. Should see mobile interface (NOT desktop sidebar)
3. Cards showing supervisor functions
4. Can view staff performance
5. Mobile-optimized layout
6. Sign out successfully

---

### 5. Housekeeping Staff (Mobile Tasks)
**Login:** `fatima@demohotel.com`, `ahmed@demohotel.com`, `sara@demohotel.com`, or `mohammed@demohotel.com`

**Expected Interface:**
- Simple mobile task list
- START/STOP workflow
- Blue theme
- Bottom navigation

**Test Steps:**
1. Login with any staff email
2. Should see mobile interface (NOT desktop)
3. Simple room task cards
4. START button to begin cleaning
5. STOP button to complete
6. Blue color scheme
7. Bottom navigation bar
8. Sign out successfully

---

### 6. Maintenance Staff (Mobile Repairs)
**Login:** `maintenance@demohotel.com` or `technician@demohotel.com`

**Expected Interface:**
- Simple mobile repair task list
- Orange theme
- START/STOP workflow for repairs
- Issue reporting

**Test Steps:**
1. Login with maintenance or technician email
2. Should see mobile interface (NOT desktop)
3. Orange-themed repair cards
4. Service request tasks
5. START/STOP workflow
6. Report issues functionality
7. Sign out successfully

---

## 🔒 Security Testing

### Access Control Tests

**Test 1: URL Manipulation**
1. Login as `inventory@demohotel.com`
2. Try to manually change URL or navigate to restricted pages
3. Expected: Should see "Access Denied" page or redirect to Inventory

**Test 2: Role Restriction Bypass**
1. Login as `laundry@demohotel.com`
2. Check sidebar - should ONLY show Linen & Laundry
3. Open browser console and try to call restricted functions
4. Expected: Should not be able to access other modules

**Test 3: Page Access Validation**
1. Login with each role
2. Verify page content matches allowed access
3. Expected: Each role sees only their permitted pages

---

## ✅ Expected Results Summary

| User Type | Login Email | Default Page | Sidebar Items | Access Level |
|-----------|-------------|--------------|---------------|--------------|
| Super Admin | admin@demohotel.com | Dashboard | ALL (12 items) | Full access to everything |
| Inventory | inventory@demohotel.com | Inventory | 1 item (Inventory only) | Inventory module only |
| Laundry | laundry@demohotel.com | Linen | 1 item (Linen only) | Linen module only |
| Supervisor | supervisor@demohotel.com | N/A (Mobile) | Mobile interface | Mobile manager view |
| Staff | fatima@/ahmed@/sara@/mohammed@ | N/A (Mobile) | Mobile interface | Simple task list |
| Maintenance | maintenance@/technician@ | N/A (Mobile) | Mobile interface | Repair task list |

---

## 🐛 Common Issues to Check

### Issue 1: Sidebar shows wrong items
**Check:** User role in database matches expected role
**Fix:** Verify `users.role` column has correct value

### Issue 2: Page shows "Access Denied" incorrectly
**Check:** Access rules in AppProfessional.jsx match DesktopLayout.jsx
**Fix:** Ensure both files have same role mappings

### Issue 3: Desktop user sees mobile interface
**Check:** Role is included in desktop roles array
**Fix:** Verify role is in ['super_admin', 'inventory', 'laundry']

### Issue 4: Mobile user sees desktop interface
**Check:** Role is NOT in desktop roles array
**Fix:** Ensure mobile roles (supervisor, staff, maintenance) don't appear in desktop check

---

## 📊 Test Result Template

```
Date: ___________
Tester: ___________

Desktop Users:
[ ] Super Admin - All pages accessible
[ ] Inventory - Only Inventory page visible
[ ] Laundry - Only Linen page visible

Mobile Users:
[ ] Supervisor - Mobile interface working
[ ] Staff - Simple task interface working
[ ] Maintenance - Orange repair interface working

Security:
[ ] URL manipulation blocked
[ ] Role restrictions enforced
[ ] Access denied pages show correctly

Issues Found:
____________________________________
____________________________________
____________________________________
```

---

## 🚀 Quick Test Commands

### Test in Browser:
```
1. Open: http://localhost:3002
2. Login with different test accounts
3. Verify sidebar matches expected items
4. Try accessing restricted pages
5. Verify mobile interfaces render correctly
```

### Check Database Roles:
```sql
SELECT email, full_name, role, is_active 
FROM users 
WHERE org_id = '00000000-0000-0000-0000-000000000001'
ORDER BY role;
```

---

## ✨ Success Criteria

All tests pass when:
- ✅ Each user sees only their allowed pages
- ✅ Sidebar menu items match role permissions
- ✅ Access denied pages show for unauthorized access
- ✅ Default landing page is correct for each role
- ✅ Mobile users see mobile interface (not desktop)
- ✅ Desktop users see desktop sidebar (not mobile)
- ✅ Sign out works for all users
- ✅ No console errors
- ✅ No access bypasses possible

---

**Last Updated:** December 7, 2025
**Status:** Ready for comprehensive testing
**Next Step:** Execute full user role testing
