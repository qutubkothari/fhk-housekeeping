# 🎓 FHK HOUSEKEEPING SYSTEM - ADMIN USER MANUAL

**Version**: 1.0  
**Date**: December 5, 2025  
**Target Audience**: Hotel Managers, Supervisors, Administrators

---

## 📖 TABLE OF CONTENTS

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Room Management](#room-management)
4. [Housekeeping Tasks](#housekeeping-tasks)
5. [Inventory Management](#inventory-management)
6. [Linen & Laundry](#linen--laundry)
7. [Service Requests](#service-requests)
8. [Staff Management](#staff-management)
9. [Reports & Analytics](#reports--analytics)
10. [Settings](#settings)

---

## 1. GETTING STARTED

### 1.1 Accessing the System

1. Open web browser (Chrome, Safari, Edge, or Firefox)
2. Navigate to: `https://your-hotel-domain.com`
3. Enter your email and password
4. Click "Login" / "تسجيل الدخول"

### 1.2 First Time Login

Default admin credentials:
- **Email**: admin@demohotel.com
- **Password**: (provided by IT team)

**⚠️ IMPORTANT**: Change password immediately after first login!

### 1.3 Interface Language

Toggle between English and Arabic:
- Click the 🌐 globe icon in the top right
- Interface will switch immediately
- Your preference is saved automatically

---

## 2. DASHBOARD OVERVIEW

The dashboard provides a real-time overview of hotel operations.

### 2.1 Key Metrics Cards

**Rooms Card**
- Total rooms in hotel
- Vacant rooms available
- Rooms being cleaned
- Rooms under maintenance

**Tasks Today Card**
- Total tasks assigned
- Completed tasks
- Pending tasks
- Tasks in progress

**Service Requests Card**
- Open requests
- Urgent requests requiring attention

**Inventory Card**
- Items below reorder level
- Requires immediate action

### 2.2 Room Status Chart

Visual breakdown:
- **Green**: Vacant & clean
- **Blue**: Occupied
- **Yellow**: Cleaning in progress
- **Red**: Maintenance/Out of order

### 2.3 Linen Status

Current inventory:
- Clean linen available
- Soiled linen collected
- Linen in laundry

### 2.4 Real-time Updates

Dashboard updates automatically every few seconds. No need to refresh page!

---

## 3. ROOM MANAGEMENT

### 3.1 Viewing Rooms

Click **"Rooms"** in sidebar to see all rooms.

**Information Displayed:**
- Room number
- Floor
- Room type (Standard, Deluxe, Suite)
- Current status
- Assigned staff (if any)
- Guest name (if occupied)

### 3.2 Adding New Room

1. Click **"Add New"** button
2. Fill in details:
   - Room Number (e.g., 101)
   - Floor (e.g., 1)
   - Building (if multiple)
   - Room Type
3. Click **"Save"**

### 3.3 Editing Room

1. Click room row or edit icon
2. Modify details
3. Click **"Save"**

### 3.4 Room Status

**Status Types:**
- **Vacant**: Clean and ready for guest
- **Occupied**: Guest currently staying
- **Cleaning**: Staff working on room
- **Maintenance**: Under repair
- **Out of Order**: Not available for use

**To Change Status:**
1. Click room
2. Select new status from dropdown
3. Changes automatically

---

## 4. HOUSEKEEPING TASKS

### 4.1 Creating Tasks

**Method 1: Single Room**
1. Go to Housekeeping page
2. Click **"Add Task"**
3. Select:
   - Room
   - Staff member
   - Task type (Regular/Checkout/Deep Clean)
   - Priority (Normal/High/Urgent)
   - Scheduled date
4. Click **"Assign"**

**Method 2: Bulk Assignment**
1. Select multiple rooms (checkboxes)
2. Click **"Bulk Assign"**
3. Choose staff members
4. Task type and date
5. Click **"Assign All"**

### 4.2 Task Types

**Regular Cleaning**: Daily routine cleaning
**Checkout Cleaning**: After guest checkout, thorough cleaning
**Deep Clean**: Detailed cleaning (weekly/monthly)
**Inspection**: Quality check by supervisor
**Turndown Service**: Evening service

### 4.3 Priority Levels

- **Low**: Can wait, non-urgent
- **Normal**: Standard priority
- **High**: Complete today
- **Urgent**: Immediate attention (VIP, complaint)

### 4.4 Monitoring Tasks

**Real-time Tracking:**
- See when staff starts task
- Track progress
- Know completion time
- View inspection results

**Task Status:**
- ⏳ **Pending**: Not started
- ▶️ **In Progress**: Staff working
- ✅ **Completed**: Finished
- 🔍 **Inspected**: Quality checked

### 4.5 Inspections

**For Supervisors:**
1. Click completed task
2. Review cleaning checklist
3. Pass ✅ or Fail ❌
4. Add notes if failed
5. Re-assign if necessary

---

## 5. INVENTORY MANAGEMENT

### 5.1 Viewing Inventory

Click **"Inventory"** in sidebar.

**Information Shown:**
- Item name (English & Arabic)
- Category
- Current stock
- Minimum level
- Unit (pieces, kg, liters)
- Location
- Supplier

### 5.2 Adding Items

1. Click **"Add Item"**
2. Fill details:
   - Item code (unique)
   - Name in English and Arabic
   - Category (Consumables, Cleaning Supplies, Amenities)
   - Unit type
   - Current stock
   - Minimum level
   - Reorder level
   - Unit cost
   - Supplier
3. Click **"Save"**

### 5.3 Receiving Stock

**When new stock arrives:**
1. Click item → **"Receipt"**
2. Enter:
   - Quantity received
   - Reference/Invoice number
   - Notes
3. Click **"Confirm Receipt"**

Stock automatically updates!

### 5.4 Issuing Items

**To issue items to rooms/staff:**
1. Click item → **"Issue"**
2. Enter:
   - Quantity
   - Room number (if room-specific)
   - Staff member
   - Notes
3. Click **"Confirm Issue"**

### 5.5 Low Stock Alerts

**Automatic Alerts:**
- 🔴 Red badge when stock below reorder level
- Notification sent to admin/supervisor
- Shows in dashboard

**Action Required:**
1. Review low stock items
2. Place order with supplier
3. Update notes with order status

### 5.6 Stock Adjustments

**For corrections:**
1. Click item → **"Adjustment"**
2. Enter:
   - New stock quantity
   - Reason for adjustment
3. Click **"Confirm"**

**Use Cases:**
- Stock count mismatch
- Damaged items
- Expired products
- Discarding old stock

---

## 6. LINEN & LAUNDRY

### 6.1 Linen Types

- Bed sheets (Single, Double, King, Queen)
- Pillow cases
- Towels (Hand, Bath, Pool)
- Bathrobes
- Blankets
- Duvet covers
- Mattress protectors

### 6.2 Linen Status

**Four Categories:**
- **Clean**: Ready to use
- **Soiled**: Used, needs washing
- **In Laundry**: At laundry vendor
- **Damaged**: Torn/stained, marked for discard

### 6.3 Issuing Clean Linen

**To rooms:**
1. Click linen item → **"Issue Clean"**
2. Select room
3. Enter quantity
4. Click **"Issue"**

Clean stock decreases automatically.

### 6.4 Receiving Soiled Linen

**From rooms:**
1. Click linen item → **"Return Soiled"**
2. Select room
3. Enter quantity
4. Click **"Return"**

Soiled stock increases.

### 6.5 Sending to Laundry

**Batch Processing:**
1. Click **"Send to Laundry"**
2. Select items and quantities
3. System generates batch ID (e.g., BATCH-20251205-0001)
4. Print batch slip
5. Send with laundry

Soiled decreases, In Laundry increases.

### 6.6 Receiving from Laundry

**When laundry returns:**
1. Click **"Receive from Laundry"**
2. Enter batch ID
3. Confirm quantities
4. Click **"Receive"**

In Laundry decreases, Clean increases.

### 6.7 Marking Damaged Linen

**For torn/stained items:**
1. Click linen → **"Mark Damaged"**
2. Enter quantity
3. Reason (torn, stained, worn out)
4. Click **"Confirm"**

**Requires Approval:**
- Supervisor must approve discard
- Go to Approvals section
- Review and approve/reject

### 6.8 Par Levels

**Target stock to maintain:**
- Set par level for each item
- System shows percentage (e.g., 85% of par)
- Order more if consistently low

---

## 7. SERVICE REQUESTS

### 7.1 Types of Requests

**Guest Requests:**
- Extra towels
- Room amenities
- Housekeeping visit
- Special services

**Breakdowns:**
- AC not working
- Plumbing issues
- Electrical problems
- Furniture damage

**Maintenance:**
- Repairs needed
- Preventive maintenance
- Equipment servicing

### 7.2 AI-Powered Auto-Routing

**How it works:**
1. Staff enters description in mobile app
2. AI analyzes request
3. Automatically classifies:
   - Request type
   - Category
   - Priority level
   - Appropriate department
4. Assigns to right staff member
5. Estimates time to complete

**No manual routing needed!**

### 7.3 Viewing Requests

Click **"Service Requests"** in sidebar.

**Filters:**
- Status (Open, Assigned, In Progress, Resolved)
- Priority (Urgent, High, Normal, Low)
- Type (Guest Request, Breakdown, Maintenance)
- Date range

### 7.4 Manually Creating Request

1. Click **"Add Request"**
2. Fill:
   - Room number
   - Request type
   - Category
   - Description
   - Priority
3. System suggests department and staff
4. Click **"Create"**

### 7.5 Monitoring Progress

**Real-time Status:**
- 🟡 **Open**: Just created
- 🔵 **Assigned**: Staff member assigned
- 🟠 **In Progress**: Being worked on
- 🟢 **Resolved**: Issue fixed
- ⚫ **Closed**: Verified and closed

**Time Tracking:**
- Created time
- Assigned time
- Resolved time
- Total duration

### 7.6 Urgent Requests

**🚨 Flagged as Urgent automatically if:**
- Safety issues
- No water/electricity
- Guest emergency
- VIP guest requests

**Priority Notifications:**
- Alert to supervisor
- SMS notification (optional)
- Highlighted in red

---

## 8. STAFF MANAGEMENT

### 8.1 Adding Staff

1. Click **"Staff"** in sidebar
2. Click **"Add Staff"**
3. Fill details:
   - Full name (English)
   - Full name (Arabic)
   - Email
   - Phone
   - Role (Staff, Supervisor, Laundry, Maintenance)
   - Preferred language
4. Click **"Create"**

**Email sent with login credentials!**

### 8.2 Staff Roles

**Admin:**
- Full system access
- Manage all modules
- View all reports
- Add/remove users

**Supervisor:**
- Assign tasks
- Inspect work
- View team performance
- Approve requests

**Staff:**
- View own tasks
- Complete tasks
- Submit service requests
- Update status

**Maintenance:**
- View maintenance requests
- Update repair status
- Mark resolved

**Laundry:**
- Manage linen batches
- Track laundry status
- Update inventory

### 8.3 Staff Performance

**View Metrics:**
- Tasks completed today
- Average completion time
- Inspection pass rate
- Tasks pending

**Filter by:**
- Date range
- Staff member
- Task type

---

## 9. REPORTS & ANALYTICS

### 9.1 Available Reports

**Housekeeping Reports:**
- Daily task completion
- Staff performance
- Room turnover time
- Inspection results

**Inventory Reports:**
- Stock levels
- Consumption by room type
- Reorder history
- Cost analysis

**Linen Reports:**
- Linen usage
- Laundry cycle time
- Damage rate
- Par level compliance

**Service Reports:**
- Response time
- Resolution time
- Request categories
- Guest satisfaction (future)

### 9.2 Generating Reports

1. Click **"Reports"** in sidebar
2. Select report type
3. Choose filters:
   - Date range
   - Staff/Room/Item
4. Click **"Generate"**

**Export Options:**
- PDF (printable)
- Excel (editable)
- CSV (data analysis)

### 9.3 Dashboard Analytics

**Visual Charts:**
- Task completion trends
- Inventory consumption
- Service request categories
- Staff productivity

**Real-time Data:**
- Updates automatically
- No manual refresh

---

## 10. SETTINGS

### 10.1 Organization Settings

**Update Hotel Details:**
- Name
- Address
- Contact info
- Logo (future)

**Preferences:**
- Currency (SAR, USD, etc.)
- Timezone
- Default language
- Business hours

### 10.2 User Profile

**Update Your Info:**
1. Click user icon in header
2. Edit:
   - Name
   - Email
   - Phone
   - Password
   - Language preference
3. Click **"Save"**

### 10.3 Notifications

**Configure Alerts:**
- Low stock notifications
- Task assignments
- Service requests
- Inspection failures

**Delivery Method:**
- In-app notifications
- Email (future)
- SMS (future)

---

## 📱 TIPS & BEST PRACTICES

### Daily Routine

**Morning (8:00 AM):**
1. Check dashboard for overview
2. Review pending tasks
3. Assign tasks to staff
4. Check urgent service requests

**Midday (12:00 PM):**
1. Monitor task progress
2. Respond to new requests
3. Check inventory alerts

**Evening (5:00 PM):**
1. Review completed tasks
2. Conduct inspections
3. Plan next day assignments

### Efficiency Tips

✅ **Use bulk operations** when assigning multiple rooms
✅ **Set reorder levels** 20% above minimum to avoid stockouts
✅ **Inspect random samples** (10-20%) daily for quality control
✅ **Review reports weekly** to identify patterns

### Common Issues

**Q: Task not showing on staff mobile app?**
A: Check if task is assigned to correct staff member and scheduled for today.

**Q: Inventory not updating?**
A: Ensure transaction is confirmed. Check audit log for errors.

**Q: Can't edit room status?**
A: May be locked by active task. Complete or cancel task first.

---

## 🆘 SUPPORT

**Technical Issues:**
- Email: support@fhksolutions.com
- Phone: [Support Number]
- Hours: 9 AM - 6 PM

**Training & Questions:**
- Email: training@fhksolutions.com
- Request on-site training
- Video tutorials (coming soon)

---

**End of Admin User Manual**

*For Staff Mobile App instructions, see USER_MANUAL_STAFF.md*
