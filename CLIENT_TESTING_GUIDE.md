# FHK Housekeeping System - Complete Testing Guide

**Version:** 2.0 (Unified Interface)  
**Date:** December 14, 2025  
**Test Environment:** http://13.234.30.197/unified/

---

## 🔐 LOGIN CREDENTIALS

### Super Admin Account
- **Email:** admin@demohotel.com
- **Password:** admin123
- **Access:** Full system access (all modules)

### Test Staff Accounts
- **Housekeeping:** fatima@demohotel.com / staff123
- **Maintenance:** maintenance@demohotel.com / maint123
- **Laundry Manager:** laundry@demohotel.com / laundry123
- **Inventory Manager:** inventory@demohotel.com / inv123

---

## ⚙️ PRE-TESTING SETUP (IMPORTANT!)

### Step 1: Apply Database Migrations
Before testing new features, you MUST run the SQL migrations:

1. Open Supabase Dashboard: https://supabase.com/dashboard/project/oglmyyyhfwuhyghcbnmi
2. Navigate to **SQL Editor** (left sidebar)
3. Open the file `RUN_THIS_IN_SUPABASE.sql` from your project root
4. Copy **ALL** contents (472 lines)
5. Paste into SQL Editor
6. Click **"Run"**
7. Verify success message (no errors)

**What this adds:**
- Location Master tables
- Vendor Management tables
- Procurement tables (Purchase Invoices, GRNs)
- Substore tracking tables
- Auto-numbering triggers (GRN-001, TRF-001, etc.)

---

## 📋 SYSTEM MODULES OVERVIEW

Your system has **18 functional modules** organized in a desktop interface:

| Module | Purpose | User Access |
|--------|---------|-------------|
| Dashboard | Overview statistics | Super Admin |
| Rooms | Room status and management | Super Admin |
| Staff Management | Employee CRUD | Super Admin |
| Housekeeping | Task assignment and tracking | Super Admin |
| Maintenance | Service request workflow | Super Admin + Maintenance |
| Inventory | Stock management | Super Admin + Inventory Manager |
| Linen | Laundry tracking | Super Admin + Laundry Manager |
| Reports | Analytics and exports | Super Admin |
| Real-Time Monitor | Live room status | Super Admin |
| Staff Assignments | Cart assignments | Super Admin |
| Analytics | Performance metrics | Super Admin |
| Activity Master | Activity templates | Super Admin |
| Bulk Assignment | Mass room assignments | Super Admin |
| **Location Master** | Hierarchical locations | Super Admin |
| **Shift Master** | Shift definitions (unified) | Super Admin |
| **Vendor Management** | Supplier database | Super Admin |
| **Procurement** | Purchase Orders & GRNs | Super Admin |
| Settings | System configuration | Super Admin |

**Bold** = Newly added features

---

## ✅ MASTER DATA REQUIREMENTS (CLIENT CHECK)

### 1.1 Location Master
- Covered in: **Location Master** module

### 1.2 Employee Master (linked to Location + mapped to Operational Area)
- Covered in: **Staff Management** module
- Employee can be mapped to:
  - **Location** (from Location Master)
  - **Shift** (from Shift Master)
  - **Operational Area = Activities** (multi-select from Activity Master)

### 1.3 Shift Master (Unified)
- Covered in: **Shift Master** module

---

### 🔸 SHIFT MASTER MODULE ⭐ NEW
**Test as:** Super Admin

**What to verify:**
- [ ] Click **"Shift Master"** in sidebar
- [ ] Add 3 shifts:
  - Morning (07:00–15:00)
  - Evening (15:00–23:00)
  - Night (23:00–07:00)
- [ ] Edit a shift time and save
- [ ] Disable a shift (Inactive)
- [ ] Verify Bulk Assignment shift dropdown shows only active shifts

**Expected Result:** Shifts are created and reusable across housekeeping operations.

---

### 🔸 EMPLOYEE MASTER MAPPING (Staff Management)
**Test as:** Super Admin

**What to verify:**
- [ ] Open **Staff Management**
- [ ] Add/Edit a staff member and set:
  - Location (from Location Master)
  - Shift (from Shift Master)
  - Operational Area (Activities) (from Activity Master)
- [ ] Save and reopen the staff member to confirm mappings persist

**Expected Result:** Employee master is linked to master data (Location + Shift) and mapped to operational activities.

---

## 🧪 TESTING CHECKLIST

### 1️⃣ DASHBOARD MODULE
**Test as:** Super Admin

**What to verify:**
- [ ] Login with admin@demohotel.com
- [ ] Dashboard loads with statistics cards
- [ ] See total rooms count
- [ ] See occupied/vacant room stats
- [ ] See pending tasks count
- [ ] See maintenance requests count
- [ ] See inventory low stock alerts
- [ ] See linen items needing attention

**Expected Result:** Clean dashboard with 8 statistic cards showing real-time data

---

### 2️⃣ ROOMS MODULE
**Test as:** Super Admin

**What to verify:**
- [ ] Click **"Rooms"** in left sidebar
- [ ] See list of all hotel rooms (101, 102, 103, etc.)
- [ ] Each room shows status badge (Vacant, Occupied, Cleaning, Maintenance)
- [ ] Each room shows **completion percentage** with colored progress bar:
  - 🟢 Green = 100% (Ready for Occupation badge)
  - 🔵 Blue = 50-99%
  - 🟡 Yellow = 0-49%
- [ ] **RFO rule (Vacant gating):** Edit a room that has an active housekeeping assignment with completion < 100%
  - [ ] Verify **Vacant** status is disabled (or save is blocked) until the latest assignment is completed
- [ ] **Turn Down (Guest Request):** Open **View** on an **Occupied** room
  - [ ] Verify a **Turn Down Request** button is visible
  - [ ] Click it and confirm a new service request is created
  - [ ] Open **Maintenance** module and verify the request appears with category **Turn Down Service**
- [ ] Click **"Add Room"** button
- [ ] Fill in room details (number, floor, type, status)
- [ ] Save and verify new room appears
- [ ] Click **"Edit"** on any room
- [ ] Modify room details and save
- [ ] Click **"Delete"** on a test room and confirm

**Expected Result:** Full CRUD operations on rooms with visual completion tracking

---

### 3️⃣ STAFF MANAGEMENT MODULE
**Test as:** Super Admin

**What to verify:**
- [ ] Click **"Staff Management"** in sidebar
- [ ] See list of all staff members
- [ ] Statistics show total staff, active, inactive counts
- [ ] Click **"Add Staff"** button
- [ ] Fill form: Full Name, Email, Phone, Role, Status
- [ ] Available roles: super_admin, staff, supervisor, maintenance, inventory, laundry, front_desk
- [ ] Save and verify new staff appears
- [ ] Search for staff by name
- [ ] Filter by role dropdown
- [ ] Click **"Edit"** on a staff member
- [ ] Modify details and save
- [ ] Click **"View Details"** to see full profile
- [ ] Click **"Delete"** on a test staff member

**Expected Result:** Complete staff database management with role-based filtering

---

### 4️⃣ HOUSEKEEPING MODULE
**Test as:** Super Admin

**What to verify:**
- [ ] Click **"Housekeeping"** in sidebar
- [ ] See list of housekeeping tasks
- [ ] Each task shows: Room, Assigned Staff, Type, Priority, Status
- [ ] Tasks are activity-based (from Activity Master) and track completion per room
- [ ] Click **"Add Task"** button
- [ ] Select room from dropdown
- [ ] Select staff member to assign
- [ ] Choose task type
- [ ] Set priority (Low, Normal, High, Urgent)
- [ ] Set scheduled date
- [ ] Add optional notes
- [ ] Save and verify task appears
- [ ] Filter tasks by status (All, Pending, In Progress, Completed)
- [ ] Search tasks by room number
- [ ] Click **"Edit"** to modify task
- [ ] Click **"View"** to see task details
- [ ] Click **"Delete"** to remove task

**Expected Result:** Full task management workflow with assignment capabilities

---

### 5️⃣ MAINTENANCE (SERVICE REQUESTS) MODULE
**Test as:** Super Admin or maintenance@demohotel.com

**What to verify:**
- [ ] Click **"Maintenance"** in sidebar
- [ ] See list of service requests
- [ ] Each request shows: Room, Type, Priority, Status, Assigned To
- [ ] Request types: Plumbing, Electrical, HVAC, Furniture, General
- [ ] Click **"Add Request"** button
- [ ] Select room
- [ ] Choose request type
- [ ] Set priority
- [ ] Enter issue description
- [ ] Assign to maintenance staff
- [ ] Save and verify request appears
- [ ] Filter by status (Open, In Progress, Completed, Cancelled)
- [ ] Search by room number
- [ ] Click **"Edit"** to update request
- [ ] Change status to "In Progress"
- [ ] Add work notes
- [ ] Mark as "Completed"
- [ ] Click **"Delete"** on a test request

**Expected Result:** Complete maintenance workflow from request to completion

---

### 6️⃣ INVENTORY MODULE
**Test as:** Super Admin or inventory@demohotel.com

**What to verify:**
- [ ] Click **"Inventory"** in sidebar
- [ ] See list of inventory items
- [ ] Each item shows: Code, Name (EN/AR), Category, Current Stock, Min Level
- [ ] Categories: Consumables, Cleaning Supplies, Amenities, Equipment, Linens
- [ ] Low stock items highlighted in red
- [ ] Click **"Add Item"** button
- [ ] Fill form:
  - Item Code (e.g., SOAP-001)
  - Item Name (English & Arabic)
  - Category
  - Unit (pcs, boxes, liters, etc.)
  - Current Stock
  - Min Level, Reorder Level, Max Level
  - Unit Cost
  - Location, Supplier, Barcode
- [ ] Save and verify item appears
- [ ] Click **"Edit"** to modify item
- [ ] Click **"Add Transaction"** to record stock movement
- [ ] Transaction types: Receipt, Issue, Adjustment, Transfer
- [ ] Click **"Assign to Room"** button
- [ ] Select room and quantity to assign
- [ ] Add notes and save
- [ ] Verify stock quantity decreased
- [ ] Click **"Assign to Staff"** button
- [ ] Select staff and quantity
- [ ] Verify assignment recorded
- [ ] Search items by name or code
- [ ] Filter by category
- [ ] Click **"Delete"** on a test item

**Expected Result:** Full inventory tracking with room/staff assignments

---

### 7️⃣ LINEN MODULE
**Test as:** Super Admin or laundry@demohotel.com

**What to verify:**
- [ ] Click **"Linen"** in sidebar
- [ ] See statistics: Clean, In Laundry, Damaged, Lost
- [ ] See list of linen items
- [ ] Each item shows: Type, Size, Quantity in Stock, Status
- [ ] Linen types: Bed Sheet, Pillow Case, Towel, Bath Mat, Duvet Cover
- [ ] Click **"Add Linen Item"** button
- [ ] Fill form: Type, Size, Quantity, Status
- [ ] Status options: Clean, In Laundry, Damaged, Lost
- [ ] Save and verify item appears
- [ ] Click **"Edit"** to modify item
- [ ] Change status and quantity
- [ ] Click **"Record Transaction"** button
- [ ] Transaction types:
  - Received from Vendor
  - Issued to Room
  - Returned from Room
  - Sent to Laundry
  - Received from Laundry
  - Marked as Damaged
  - Marked as Lost
- [ ] Select transaction type and quantity
- [ ] Add optional notes
- [ ] Save and verify statistics updated
- [ ] Search linen by type
- [ ] Filter by status
- [ ] Click **"Delete"** on a test item

**Expected Result:** Complete linen lifecycle tracking from clean to laundry to damaged

---

### 8️⃣ REPORTS MODULE
**Test as:** Super Admin

**What to verify:**
- [ ] Click **"Reports"** in sidebar
- [ ] See report type selector
- [ ] Available reports:
  - Room Status Report
  - Housekeeping Tasks Summary
  - Maintenance Requests Report
  - Inventory Levels Report
  - Linen Inventory Report
  - Staff Performance Report
- [ ] Select date range (From - To)
- [ ] Click **"Generate Report"**
- [ ] Verify report data displays
- [ ] Click **"Export to CSV"** button
- [ ] Verify CSV file downloads
- [ ] Open CSV and verify data accuracy
- [ ] Test different report types
- [ ] Test different date ranges

**Expected Result:** All report types generate correctly and export to CSV

---

### 9️⃣ REAL-TIME MONITOR MODULE
**Test as:** Super Admin

**What to verify:**
- [ ] Click **"Real-Time Monitor"** in sidebar
- [ ] See live room grid/list view
- [ ] Each room shows current status with color coding:
  - 🟢 Green = Vacant/Clean
  - 🔴 Red = Occupied
  - 🟡 Yellow = Cleaning
  - 🟠 Orange = Maintenance
  - ⚪ Gray = Out of Service
- [ ] See assigned staff names on rooms being cleaned
- [ ] See task completion percentage
- [ ] Monitor refreshes automatically (live updates)
- [ ] Click any room to see quick details
- [ ] Filter by floor
- [ ] Filter by status
- [ ] Search by room number

**Expected Result:** Live dashboard showing all rooms with real-time status updates

---

### 🔟 STAFF ASSIGNMENTS (CART MANAGEMENT) MODULE
**Test as:** Super Admin

**What to verify:**
- [ ] Click **"Staff Assignments"** in sidebar
- [ ] See list of staff members
- [ ] Each staff shows current cart assignments
- [ ] Click **"Create Assignment"** button
- [ ] Select staff member
- [ ] Select multiple inventory items to assign to cart
- [ ] Set quantity for each item
- [ ] Add notes
- [ ] Save assignment
- [ ] Verify staff now has cart items listed
- [ ] Click **"View Cart"** on a staff member
- [ ] See all items in their cart
- [ ] Click **"Remove Item"** to take items off cart
- [ ] Search staff by name
- [ ] Filter by assigned/unassigned

**Expected Result:** Complete cart management system for tracking staff supplies

---

### 1️⃣1️⃣ ANALYTICS MODULE
**Test as:** Super Admin

**What to verify:**
- [ ] Click **"Analytics"** in sidebar
- [ ] See performance dashboard
- [ ] View metrics:
  - Average Room Cleaning Time
  - Staff Productivity (tasks per day)
  - Maintenance Response Time
  - Inventory Turnover Rate
  - Linen Utilization Rate
- [ ] See charts and graphs
- [ ] Select different time periods (Today, Week, Month, Custom)
- [ ] View top performing staff
- [ ] View rooms with most issues
- [ ] View most consumed inventory items
- [ ] Export analytics report

**Expected Result:** Comprehensive analytics dashboard with visual charts

---

### 1️⃣2️⃣ ACTIVITY MASTER MODULE ⭐ NEW
**Test as:** Super Admin

**What to verify:**
- [ ] Click **"Activity Master"** in sidebar
- [ ] See list of activity templates
- [ ] Each activity shows: Code, Name, Sequence, Duration, Type, Status
- [ ] Example activities: Make Bed, Clean Bathroom, Vacuum Floor, Dust Furniture
- [ ] Click **"Add Activity"** button
- [ ] Fill form:
  - Activity Name (EN/AR)
  - Activity Code (e.g., ACT-001)
  - Sequence Order (1, 2, 3...)
  - Estimated Time (minutes)
  - Type: Mandatory or Optional
  - Status: Active or Inactive
  - Description
- [ ] Save and verify activity appears
- [ ] Activities automatically sort by sequence order
- [ ] Click **"Edit"** to modify activity
- [ ] Change sequence order and verify re-sorting
- [ ] Click **"Delete"** on a test activity
- [ ] Search activities by name or code

**Expected Result:** Template library for standardized housekeeping activities

---

### 1️⃣3️⃣ BULK ASSIGNMENT MODULE ⭐ NEW
**Test as:** Super Admin

**What to verify:**
- [ ] Click **"Bulk Assignment"** in sidebar
- [ ] See 4-step wizard:

**STEP 1: Select Rooms**
- [ ] See list of all rooms
- [ ] Click **"Select All"** button
- [ ] Verify all rooms checked
- [ ] Click **"Deselect All"**
- [ ] Manually select 5-10 rooms
- [ ] See counter: "X rooms selected"
- [ ] Click **"Next"**

**STEP 2: Select Activities**
- [ ] See list of all activities from Activity Master
- [ ] Select multiple activities (e.g., Make Bed, Clean Bathroom, Vacuum)
- [ ] See counter: "X activities selected"
- [ ] Click **"Next"**

**STEP 3: Select Staff**
- [ ] See list of all staff members
- [ ] Select one or more staff to assign tasks to
- [ ] Click **"Next"**

**STEP 4: Configure Assignment**
- [ ] Choose assignment type:
  - Before Arrival
  - Occupied Room Cleaning
  - Preventive Maintenance
- [ ] **Note:** Turn Down is **guest-request only** (use **Rooms → View → Turn Down Request** or create it in **Maintenance**)
- [ ] Select shift (Morning, Afternoon, Night)
- [ ] Set target completion time
- [ ] Add optional notes
- [ ] Click **"Create Assignments"**
- [ ] Verify success message
- [ ] Navigate to Housekeeping module
- [ ] Verify all assignments created (Rooms × Activities × Staff)
- [ ] Example: 5 rooms × 3 activities × 1 staff = 15 tasks created

**Expected Result:** Mass assignment capability creating multiple tasks in one workflow

---

### 1️⃣4️⃣ LOCATION MASTER MODULE ⭐ NEW
**Test as:** Super Admin

**What to verify:**
- [ ] Click **"Location Master"** in sidebar
- [ ] See hierarchical location structure
- [ ] Location types: Floor, Wing, Section, Area
- [ ] Click **"Add Location"** button
- [ ] Fill form:
  - Location Name (EN/AR)
  - Location Code (e.g., FLR-01, WNG-A)
  - Type (Floor, Wing, Section, Area)
  - Parent Location (for hierarchy)
  - Floor Number
  - Description
  - Status: Active or Inactive
- [ ] Save location
- [ ] Verify location appears in list
- [ ] Create parent-child relationships:
  - Add Floor 1 (parent: none)
  - Add Wing A (parent: Floor 1)
  - Add Section 101 (parent: Wing A)
- [ ] Verify hierarchy displays correctly
- [ ] Click **"Edit"** to modify location
- [ ] Change parent location and verify hierarchy updates
- [ ] Toggle Active/Inactive status
- [ ] Click **"Delete"** on a test location
- [ ] Search locations by name or code
- [ ] Filter by type
- [ ] Filter by status

**Expected Result:** Hierarchical location management for organizing hotel structure

---

### 1️⃣5️⃣ VENDOR MANAGEMENT MODULE ⭐ NEW
**Test as:** Super Admin

**What to verify:**
- [ ] Click **"Vendor Management"** in sidebar
- [ ] See list of vendors/suppliers
- [ ] Each vendor shows: Name, Contact Person, Phone, Email, Status
- [ ] Click **"Add Vendor"** button
- [ ] Fill form:
  - Vendor Name (EN/AR)
  - Vendor Code (e.g., VND-001)
  - Contact Person
  - Phone Number
  - Email Address
  - Address
  - City, State, Country, ZIP Code
  - Tax ID / VAT Number
  - Payment Terms (e.g., "Net 30 Days")
  - Credit Limit
  - Status: Active or Inactive
  - Notes
- [ ] Save and verify vendor appears
- [ ] Click **"Edit"** to modify vendor
- [ ] Update contact details and save
- [ ] Click **"View Details"** to see full vendor profile
- [ ] Link vendor to inventory items:
  - Click **"Link Items"** button
  - Select multiple inventory items
  - Set unit cost per item for this vendor
  - Set preferred vendor flag
  - Save item associations
- [ ] Verify vendor now shows linked items count
- [ ] Search vendors by name or code
- [ ] Filter by status (Active/Inactive)
- [ ] Click **"Delete"** on a test vendor

**Expected Result:** Complete supplier database with item linking capability

---

### 1️⃣6️⃣ PROCUREMENT MODULE ⭐ NEW
**Test as:** Super Admin

**What to verify:**

**TAB 1: Purchase Invoices**
- [ ] Click **"Procurement"** in sidebar
- [ ] Default view: Purchase Invoices list
- [ ] Each invoice shows: PI Number, Vendor, Date, Total Amount, Status
- [ ] Status types: Draft, Submitted, Partial, Received, Cancelled
- [ ] Click **"Add Purchase Invoice"** button
- [ ] Fill form:
  - Select Vendor (from Vendor Management)
  - Invoice Number (e.g., INV-12345)
  - Invoice Date
  - Expected Delivery Date
  - Payment Terms
  - Notes
- [ ] Click **"Add Items"** section
- [ ] Select inventory item from dropdown
- [ ] Enter ordered quantity
- [ ] Enter unit cost
- [ ] Verify total automatically calculates (quantity × unit cost)
- [ ] Click **"Add Another Item"** to add multiple items
- [ ] Verify grand total sums all line items
- [ ] Save Purchase Invoice
- [ ] Verify PI number auto-generated (PI-001, PI-002, etc.)
- [ ] PI initially saves as "Submitted" status
- [ ] Click **"View"** to see PI details
- [ ] Click **"Edit"** to modify PI
- [ ] Can only edit Draft or Submitted status PIs
- [ ] Cannot edit Received PIs

**TAB 2: Goods Received Notes (GRN)**
- [ ] Click **"Goods Received Notes"** tab
- [ ] See list of all GRNs
- [ ] Each GRN shows: GRN Number, Related PI, Received By, Date, Status
- [ ] Click **"Add GRN"** button
- [ ] Select Purchase Invoice from dropdown
- [ ] GRN auto-fills with PI items
- [ ] For each item, verify:
  - Ordered Quantity (from PI)
  - Enter Accepted Quantity (can be less if partial delivery)
  - Enter Rejected Quantity (if any damaged/wrong items)
- [ ] Select Received By (staff member)
- [ ] Add inspection notes
- [ ] Select status: Accepted, Partial, Rejected
- [ ] Save GRN
- [ ] Verify GRN number auto-generated (GRN-001, GRN-002, etc.)
- [ ] **TEST AUTOMATIC STOCK UPDATE:**
  - Note current stock level of an item (e.g., Soap: 50 units)
  - Create GRN with accepted quantity 20
  - Navigate to Inventory module
  - Verify soap stock now shows 70 units (50 + 20)
- [ ] **TEST PI STATUS AUTO-UPDATE:**
  - Create PI with 3 items
  - Create GRN with partial quantities
  - Verify PI status changes to "Partial"
  - Create second GRN with remaining quantities
  - Verify PI status changes to "Received"
- [ ] Click **"View"** to see GRN details
- [ ] Print GRN report
- [ ] Filter GRNs by date range
- [ ] Search by GRN number or PI number

**INTEGRATION TEST:**
1. **Create Complete Procurement Flow:**
   - Add Vendor "ABC Supplies"
   - Link 5 inventory items to vendor
   - Create PI for 100 soaps, 50 towels, 30 shampoos
   - Submit PI
   - Record delivery with GRN (accept 100 soaps, 40 towels, reject 10 shampoos, accept 20 shampoos)
   - Verify inventory auto-updated:
     - Soaps: +100
     - Towels: +40
     - Shampoos: +20
   - Verify PI status = "Partial" (because rejected items)
   - Create second GRN for replacement shampoos
   - Verify PI status = "Received"

**Expected Result:** End-to-end procurement workflow with automatic inventory updates

---

### 1️⃣7️⃣ SETTINGS MODULE
**Test as:** Super Admin

**What to verify:**
- [ ] Click **"Settings"** in sidebar
- [ ] See system configuration options
- [ ] Hotel Information section:
  - Hotel Name (EN/AR)
  - Address, City, Country
  - Phone, Email, Website
  - Logo upload
- [ ] Save changes and verify
- [ ] Operational Settings:
  - Default shift timings
  - Task completion time limits
  - Notification preferences
- [ ] User Preferences:
  - Default language
  - Date/time format
  - Dashboard layout
- [ ] Security Settings:
  - Change password
  - Session timeout
  - Two-factor authentication toggle
- [ ] Save all settings
- [ ] Log out and log back in
- [ ] Verify settings persisted

**Expected Result:** System-wide configuration management

---

## 🔍 CROSS-MODULE INTEGRATION TESTS

### Test Flow 1: Complete Housekeeping Workflow
1. Add new room in **Rooms** module
2. Add new staff in **Staff Management**
3. Create activities in **Activity Master**
4. Use **Bulk Assignment** to assign activities to the room
5. Monitor progress in **Real-Time Monitor**
6. Check completion percentage on room card
7. Generate report in **Reports** module
8. View analytics in **Analytics**

### Test Flow 2: Procurement to Inventory
1. Add vendor in **Vendor Management**
2. Link inventory items to vendor
3. Create Purchase Invoice in **Procurement**
4. Add multiple items (soap, towels, shampoo)
5. Record GRN with accepted quantities
6. Navigate to **Inventory** module
7. Verify stock levels increased automatically
8. Assign items to rooms from **Inventory**
9. Generate inventory report

### Test Flow 3: Maintenance Request Lifecycle
1. Create service request in **Maintenance**
2. Assign to maintenance staff
3. Staff logs in with maintenance@demohotel.com
4. Updates request status to "In Progress"
5. If parts needed, checks **Inventory**
6. Assigns parts to own cart via **Staff Assignments**
7. Completes work and marks "Completed"
8. Admin generates **Reports** showing resolution time
9. View maintenance analytics in **Analytics**

### Test Flow 4: Linen Lifecycle
1. Add linen items in **Linen** module (200 towels)
2. Record transaction: Issue 50 towels to Room 101
3. Record transaction: Return 50 dirty towels from Room 101
4. Record transaction: Send 50 towels to laundry
5. Record transaction: Receive 45 clean towels (5 damaged)
6. Record transaction: Mark 5 as damaged
7. Check statistics updated correctly
8. Generate linen report showing lifecycle

---

## 🐛 KNOWN ISSUES & WORKAROUNDS

### Issue 1: Page Not Loading
**Symptom:** White screen or "Loading..." stuck  
**Cause:** Database migrations not applied  
**Solution:** Run `RUN_THIS_IN_SUPABASE.sql` in SQL Editor

### Issue 2: "Column does not exist" Error
**Symptom:** Error message in browser console  
**Cause:** Schema mismatch  
**Solution:** Already fixed in deployed version, hard refresh browser (Ctrl+Shift+R)

### Issue 3: Stock Not Updating After GRN
**Symptom:** Inventory quantity unchanged after GRN  
**Cause:** Database trigger not created  
**Solution:** Verify migrations applied correctly, check Supabase logs

### Issue 4: Auto-numbering Not Working
**Symptom:** Manual entry required for GRN/PI numbers  
**Cause:** Trigger functions not created  
**Solution:** Re-run `RUN_THIS_IN_SUPABASE.sql`

---

## 📱 MULTI-DEVICE TESTING

### Desktop Testing
- Recommended browsers: Chrome, Firefox, Edge (latest versions)
- Screen resolution: 1920x1080 or higher
- Test all sidebar navigation
- Test modal popups
- Test dropdown menus
- Test table scrolling with many rows

### Tablet Testing
- Test on iPad or Android tablet (landscape mode)
- Sidebar should collapse to hamburger menu
- All features should remain accessible
- Touch interactions work correctly

### Mobile Testing
- Test on iPhone or Android phone
- Interface should be fully responsive
- Tables convert to card-based layout
- Modals occupy full screen on mobile
- Touch targets large enough (minimum 44px)

---

## 📊 SUCCESS CRITERIA

Your system passes testing if:

✅ All 17 modules load without errors  
✅ CRUD operations work in all modules (Create, Read, Update, Delete)  
✅ Room completion percentages display correctly  
✅ Activity Master stores reusable templates  
✅ Bulk Assignment creates multiple tasks at once  
✅ Location Master maintains hierarchical structure  
✅ Vendor Management links suppliers to items  
✅ Procurement module auto-updates inventory on GRN  
✅ GRN and PI numbers auto-generate sequentially  
✅ All filters, searches, and sorts function correctly  
✅ Reports generate and export to CSV  
✅ Real-time monitor shows live updates  
✅ Analytics display accurate metrics  
✅ Settings persist after logout/login  
✅ Role-based access control works (super_admin sees all, others see limited)  
✅ Mobile/tablet responsive design works  
✅ No console errors in browser (F12 Developer Tools)

---

## 🎯 TESTING PRIORITY

**HIGH PRIORITY** (Must test first):
1. Login/Logout
2. Dashboard overview
3. Rooms module (with completion %)
4. Procurement module (NEW - critical)
5. Inventory stock auto-update (NEW - critical)
6. Vendor Management (NEW)
7. Activity Master (NEW)
8. Bulk Assignment (NEW)
9. Location Master (NEW)

**MEDIUM PRIORITY**:
10. Housekeeping
11. Maintenance
12. Staff Management
13. Linen
14. Reports

**LOW PRIORITY** (Nice to verify):
15. Real-Time Monitor
16. Analytics
17. Staff Assignments
18. Settings

---

## 📝 REPORTING ISSUES

If you find any bugs or issues during testing, please report with:

1. **Module Name:** (e.g., Procurement)
2. **Issue Description:** (e.g., GRN not saving)
3. **Steps to Reproduce:** (e.g., 1. Click Add GRN, 2. Select PI, 3. Click Save)
4. **Expected Result:** (e.g., GRN should save and appear in list)
5. **Actual Result:** (e.g., Error message "Failed to create GRN")
6. **Browser/Device:** (e.g., Chrome 120 on Windows 11)
7. **Screenshot:** (if applicable)
8. **Console Error:** (F12 Developer Tools → Console tab, copy error message)

---

## 🚀 DEPLOYMENT INFORMATION

- **Production URL:** http://13.234.30.197/unified/
- **Database:** Supabase (oglmyyyhfwuhyghcbnmi.supabase.co)
- **Server:** AWS EC2 Ubuntu (13.234.30.197)
- **Web Server:** Nginx 1.24.0
- **Build Tool:** Vite 5.4.21
- **Bundle Size:** 745.52 KB (gzipped: 183.51 KB)
- **Latest Deployment:** December 14, 2025
- **Version:** 2.0 (Unified Interface)

---

## 📞 SUPPORT

For technical support or questions during testing:
- Check browser console (F12) for error messages
- Verify database migrations applied
- Clear browser cache and hard refresh (Ctrl+Shift+R)
- Check Supabase logs for database errors
- Report issues with detailed reproduction steps

---

## ✨ NEW FEATURES SUMMARY

**What's New in Version 2.0:**

1. **Activity-Based Housekeeping** - Standardized activity templates instead of generic tasks
2. **Bulk Assignment Wizard** - Assign activities to multiple rooms at once
3. **Room Completion Tracking** - Visual progress bars showing activity completion %
4. **Location Master** - Hierarchical hotel structure (floors, wings, sections)
5. **Vendor Management** - Complete supplier database with item linking
6. **Procurement Module** - Purchase Invoices and Goods Received Notes
7. **Auto Stock Updates** - Inventory auto-increments on GRN acceptance
8. **Auto Numbering** - GRN-001, PI-001, TRF-001 auto-generated
9. **Substore Tracking** - Transfer tracking between main store, substores, and floors
10. **Code Cleanup** - Removed duplicate admin-web interfaces, unified everything

---

**END OF TESTING GUIDE**

*Please test thoroughly and report any issues. Thank you!*
