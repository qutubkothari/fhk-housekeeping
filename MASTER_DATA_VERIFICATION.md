# Master Data Requirements - Verification Checklist

## ✅ Completed Features

### 1.1 Location Master ✓
**Status:** COMPLETE  
**Location:** Sidebar → **Location Master**

**What's implemented:**
- Full CRUD for locations (Add, Edit, Delete, View)
- Location types: Floor, Wing, Section, Area
- Hierarchical structure (parent-child relationships)
- Bilingual support (EN/AR)
- Location codes (e.g., FLR-01, WNG-A)
- Active/Inactive status

**How to verify:**
1. Login as Super Admin: `admin@demohotel.com / admin123`
2. Click **Location Master** in sidebar
3. Click **Add Location** button
4. Create a test location (e.g., Floor 1)
5. Verify it appears in the list

---

### 1.2 Employee Master (Linked to Location + Operational Area) ✓
**Status:** COMPLETE  
**Location:** Sidebar → **Staff Management**

**What's implemented:**
- Employee CRUD (Add, Edit, Delete, View)
- **Location mapping** - Dropdown to select location from Location Master
- **Shift mapping** - Dropdown to select shift from Shift Master
- **Operational Area mapping** - Multi-select to map employee to activities

**How to verify:**
1. Go to **Staff Management**
2. Click **Add Staff** or **Edit** on existing staff
3. In the modal form, you'll see 3 new fields:
   - **Location** dropdown (populated from Location Master)
   - **Shift** dropdown (populated from Shift Master)  
   - **Operational Area (Activities)** multi-select (populated from Activity Master)
4. Fill in employee details and select location + shift + activities
5. Save
6. The staff card will show: "**Location:** [name]" and "**Shift:** [name]" below email/phone
7. Re-edit the staff to verify the operational activities persist

**Database Tables:**
- `users.location_id` - Links employee to location
- `users.shift_id` - Links employee to shift
- `user_operational_activities` - Junction table for employee↔activity mapping

---

### 1.3 Shift Master ✓
**Status:** COMPLETE  
**Location:** Sidebar → **Shift Master**

**What's implemented:**
- Full CRUD for shifts (Add, Edit, Delete, View)
- Shift name, code, start time, end time
- Active/Inactive status
- Used in Staff Management and Bulk Assignment

**How to verify:**
1. Click **Shift Master** in sidebar
2. Click **Add Shift** button
3. Create shifts (e.g., Morning: 07:00-15:00)
4. Verify shifts appear in list
5. Go to **Staff Management** → Add/Edit Staff
6. Confirm **Shift** dropdown shows your created shifts
7. Go to **Bulk Assignment** → Step 4
8. Confirm shift dropdown shows your shifts

---

## 🔴 IMPORTANT: Prerequisites

### Step 1: Run SQL Migrations
**BEFORE testing, you MUST run the SQL file:**

1. Open Supabase Dashboard: https://supabase.com/dashboard/project/oglmyyyhfwuhyghcbnmi
2. Go to **SQL Editor** (left sidebar)
3. Open file: `RUN_THIS_IN_SUPABASE.sql` (in project root)
4. Copy **ALL** contents
5. Paste into SQL Editor
6. Click **"Run"**
7. Wait for success message

**What this creates:**
- `shifts` table
- `locations` table  
- `user_operational_activities` table
- Adds `location_id` and `shift_id` columns to `users` table
- Creates necessary RLS policies

### Step 2: Populate Master Data
**You need to create base data BEFORE mapping employees:**

1. Create at least 1 Location
2. Create at least 1 Shift
3. Create at least 1 Activity (Activity Master)
4. Then you can map employees to these

---

## 📸 Visual Proof

### Staff Management - Employee Form
When you click **Add Staff** or **Edit Staff**, you should see this form structure:

```
┌─────────────────────────────────────┐
│ Full Name *                         │
│ ___________________________________│
│                                     │
│ Email *                             │
│ ___________________________________│
│                                     │
│ Phone                               │
│ ___________________________________│
│                                     │
│ Role *                              │
│ [Dropdown: Staff, Supervisor...]   │
│                                     │
│ Location                            │ ← NEW FIELD
│ [Dropdown: Floor 1, Wing A...]     │
│                                     │
│ Shift                               │ ← NEW FIELD
│ [Dropdown: Morning (07:00-15:00)]  │
│                                     │
│ Operational Area (Activities)       │ ← NEW FIELD
│ [Multi-select: Make Bed, Clean...] │
│ Used to map employees to their      │
│ operational activities.             │
│                                     │
│ ☑ Active                            │
│                                     │
│ [Cancel] [Add Staff / Update Staff] │
└─────────────────────────────────────┘
```

### Staff Card Display
After saving, the staff card shows:

```
┌──────────────────────────────────┐
│ [M] Muhammad Ali                 │
│     [Staff Badge]            ●   │
│                                  │
│ ✉ muhammad@hotel.com             │
│ ☎ +971 50 123 4567               │
│ Location: Floor 1  Shift: Morning│ ← MAPPED DATA
│                                  │
│ [Edit] [Delete]                  │
└──────────────────────────────────┘
```

---

## 🚨 Common Issues

### "I don't see Location/Shift dropdowns"
**Cause:** SQL migrations not run or page needs refresh  
**Fix:** 
1. Run `RUN_THIS_IN_SUPABASE.sql` in Supabase SQL Editor
2. Hard refresh browser (Ctrl+Shift+R)
3. Clear cache and reload

### "Location/Shift dropdowns are empty"
**Cause:** No master data created yet  
**Fix:**
1. Go to **Location Master** and create at least 1 location
2. Go to **Shift Master** and create at least 1 shift
3. Go back to Staff Management and refresh

### "Operational Activities dropdown is empty"
**Cause:** No activities created yet  
**Fix:**
1. Go to **Activity Master** and create activities
2. Go back to Staff Management and refresh

### "Changes don't save"
**Cause:** RLS policies blocking or SQL not fully executed  
**Fix:**
1. Check Supabase logs for errors
2. Re-run the SQL file completely
3. Verify you're logged in as Super Admin

---

## 🎯 Quick Test Script

Run this test to verify everything:

1. ✅ **SQL Migration Check**
   - Go to Supabase SQL Editor
   - Run: `SELECT * FROM shifts LIMIT 1;`
   - Run: `SELECT * FROM user_operational_activities LIMIT 1;`
   - Run: `SELECT location_id, shift_id FROM users LIMIT 1;`
   - All should return results (or empty table, not "relation does not exist")

2. ✅ **Location Master Check**
   - Navigate to Location Master
   - Add a test location "Test Floor 1"
   - Verify it appears in list

3. ✅ **Shift Master Check**
   - Navigate to Shift Master
   - Add a test shift "Test Shift" (08:00-16:00)
   - Verify it appears in list

4. ✅ **Employee Mapping Check**
   - Navigate to Staff Management
   - Click Add Staff or Edit existing
   - Verify 3 new fields visible:
     - Location (dropdown)
     - Shift (dropdown)
     - Operational Area (multi-select)
   - Select values and save
   - Verify staff card shows "Location: [name] Shift: [name]"
   - Re-edit staff and verify selections persist

---

## 📊 Database Schema Reference

```sql
-- Users table (Employee Master)
ALTER TABLE users ADD COLUMN location_id UUID REFERENCES locations(id);
ALTER TABLE users ADD COLUMN shift_id UUID REFERENCES shifts(id);

-- Shifts table
CREATE TABLE shifts (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  code TEXT,
  start_time TIME,
  end_time TIME,
  is_active BOOLEAN DEFAULT true
);

-- User Operational Activities (junction table)
CREATE TABLE user_operational_activities (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  activity_id UUID REFERENCES housekeeping_activities(id),
  UNIQUE(user_id, activity_id)
);
```

---

## ✅ Completion Confirmation

**All 3 requirements are implemented and deployed:**

| Requirement | Status | Evidence |
|-------------|--------|----------|
| 1.1 Location Master | ✅ COMPLETE | `LocationMaster.jsx` page, `locations` table |
| 1.2 Employee Master (linked to Location + Operational Area) | ✅ COMPLETE | `Staff.jsx` with location_id, shift_id, operational activities mapping |
| 1.3 Shift Master | ✅ COMPLETE | `ShiftMaster.jsx` page, `shifts` table |

**Deployed at:** http://13.234.30.197/unified/

**Files:**
- UI: `apps/staff-pwa/src/pages/Staff.jsx` (lines 426-475 show Location, Shift, Operational Area fields)
- UI: `apps/staff-pwa/src/pages/LocationMaster.jsx`
- UI: `apps/staff-pwa/src/pages/ShiftMaster.jsx`
- SQL: `RUN_THIS_IN_SUPABASE.sql` (lines 475-571 contain "MASTER DATA COMPLETION" section)

---

## 📞 Support

If client still reports issues after following this guide:
1. Ask them to share a screenshot of the Staff Management → Add/Edit Staff form
2. Ask them to confirm SQL was executed successfully in Supabase
3. Check browser console (F12) for JavaScript errors
4. Verify they're using the correct URL: `http://13.234.30.197/unified/`
