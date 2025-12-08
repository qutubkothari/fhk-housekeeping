# Testing Checklist - SRS Compliance Implementation

**Date:** December 6, 2025  
**Implementation:** Inspection Workflow, Timer Tracking, Breakdown Categories, Live Status Board

---

## Pre-Deployment Testing

### ✅ Build Status
- [x] Admin Web: Built successfully (633KB / 157KB gzipped)
- [x] Staff PWA: Built successfully (369KB / 105KB gzipped)
- [x] No compilation errors
- [x] Database migrations: 017 & 018 applied

---

## Feature Testing

### 1. Inspection Workflow (FR-HK-03)

**Admin Web - Housekeeping Module:**
- [ ] Complete a housekeeping task
- [ ] Verify task status changes to `pending_inspection`
- [ ] Purple "Inspect" button appears for pending_inspection tasks
- [ ] Click inspect button → InspectionModal opens
- [ ] Checklist loads based on task_type (regular/checkout/deep_clean)
- [ ] Toggle checklist items (checked/unchecked)
- [ ] Mark required items - verify cannot submit if missing
- [ ] Select "Pass" → Verify task status changes to `inspected`
- [ ] Select "Fail" with notes → Verify task status changes to `pending` (re-clean)
- [ ] Check inspection_notes saved in database
- [ ] Verify inspected_by and inspected_at fields populated
- [ ] Test with all 3 task types (regular, checkout, deep_clean)

**Database Verification:**
```sql
SELECT id, status, inspection_status, requires_inspection, 
       inspected_by, inspection_checklist, inspection_notes
FROM housekeeping_tasks 
WHERE status IN ('pending_inspection', 'inspected', 'failed_inspection')
ORDER BY created_at DESC LIMIT 5;
```

**Expected Results:**
- ✅ Tasks requiring inspection go to `pending_inspection` after completion
- ✅ Inspection modal shows correct checklist (8-10 items)
- ✅ Pass → status becomes `inspected`
- ✅ Fail → status returns to `pending` for re-cleaning
- ✅ Inspection data stored in JSONB format

---

### 2. Timer Tracking (FR-HK-02)

**Staff PWA - TaskDetail Page:**
- [ ] Open a pending task in Staff PWA
- [ ] Click "Start Task" button
- [ ] Verify timer starts displaying (00:00:00 format)
- [ ] Timer counts up in real-time (HH:MM:SS)
- [ ] Wait 1-2 minutes, verify timer accuracy
- [ ] Complete the task
- [ ] Verify duration_minutes calculated correctly
- [ ] Check actual_start_time and actual_end_time in database

**Database Verification:**
```sql
SELECT id, room_id, status, 
       actual_start_time, actual_end_time, 
       duration_minutes,
       EXTRACT(EPOCH FROM (actual_end_time - actual_start_time))/60 as calculated_duration
FROM housekeeping_tasks 
WHERE actual_start_time IS NOT NULL
ORDER BY actual_start_time DESC LIMIT 5;
```

**Expected Results:**
- ✅ Timer displays in blue box with clock icon
- ✅ Timer updates every second
- ✅ actual_start_time recorded when task starts
- ✅ actual_end_time recorded on completion
- ✅ Duration matches elapsed time

---

### 3. Enhanced Breakdowns (FR-HK-04)

**Staff PWA - Service Request Page:**
- [ ] Navigate to Service Request page
- [ ] Select a room
- [ ] Dropdown shows "نوع المشكلة" (Problem Type)
- [ ] Verify 6 category groups appear:
  - [ ] تكييف (AC) - 5 options
  - [ ] سباكة (Plumbing) - 6 options
  - [ ] كهرباء (Electrical) - 5 options
  - [ ] أثاث (Furniture) - 5 options
  - [ ] أجهزة (Appliance) - 4 options
  - [ ] هيكلي (Structural) - 3 options
- [ ] Select severity level (منخفض/متوسط/عالي/حرج/طوارئ)
- [ ] Check "حالة طوارئ طبية" (Medical Emergency)
- [ ] Submit service request
- [ ] Verify auto-routing based on category

**Database Verification:**
```sql
SELECT id, description, breakdown_category, severity, 
       is_medical_emergency, assigned_role, status
FROM service_requests 
WHERE breakdown_category IS NOT NULL
ORDER BY created_at DESC LIMIT 10;
```

**Auto-Routing Tests:**
- [ ] AC issue → assigned_role = 'maintenance'
- [ ] Plumbing issue → assigned_role = 'maintenance'
- [ ] Electrical issue → assigned_role = 'maintenance'
- [ ] Furniture issue → assigned_role = 'housekeeping'
- [ ] Appliance issue → assigned_role = 'maintenance'
- [ ] Medical emergency → is_medical_emergency = true

**Expected Results:**
- ✅ Dropdown populated with 30+ breakdown types
- ✅ Categories organized by type
- ✅ Severity levels work correctly
- ✅ Medical emergency flag saves
- ✅ Auto-routing trigger assigns to correct role

---

### 4. Live Room Status Board (FR-HK-06)

**Admin Web - Dashboard:**
- [ ] Navigate to Dashboard
- [ ] Scroll to "Live Room Status Board" section
- [ ] Verify room grid displays all rooms
- [ ] Check color coding:
  - [ ] Green = Clean (clean, inspected)
  - [ ] Yellow = In Progress (in_progress)
  - [ ] Orange = Needs Cleaning (pending)
  - [ ] Purple = Pending Inspection (pending_inspection)
  - [ ] Red = Failed Inspection (failed_inspection)
  - [ ] Blue = Occupied (occupied)
  - [ ] Gray = Vacant (vacant)
  - [ ] Red Border = Maintenance (maintenance)
- [ ] Test floor filter dropdown
- [ ] Test status filter dropdown
- [ ] Start a task in Staff PWA → Verify board updates within 15 seconds
- [ ] Complete a task → Verify status changes on board
- [ ] Check staff name displays on in-progress tasks
- [ ] Check timer displays on in-progress tasks (MM:SS format)

**Real-Time Updates:**
- [ ] Open Dashboard in Browser 1
- [ ] Open Staff PWA in Browser 2
- [ ] Start task in PWA → Watch board update in Dashboard
- [ ] Complete task in PWA → Watch status change in Dashboard
- [ ] Verify 15-second auto-refresh works

**Database Subscription:**
- [ ] Verify board subscribes to housekeeping_tasks changes
- [ ] Make direct database update → Verify board reflects change

**Expected Results:**
- ✅ All rooms display in grid format
- ✅ 8 color-coded statuses working
- ✅ Filters work correctly
- ✅ Real-time updates within 15 seconds
- ✅ Staff assignments visible
- ✅ Timer display for in-progress tasks

---

## Integration Testing

### Cross-Module Workflow
1. **Complete Task Flow:**
   - [ ] Staff: Start task → Timer starts
   - [ ] Staff: Complete task → Status changes to pending_inspection
   - [ ] Dashboard: Room shows purple (pending inspection)
   - [ ] Admin: Inspect task → Pass/Fail
   - [ ] Dashboard: Room updates to green (passed) or orange (failed)

2. **Service Request Flow:**
   - [ ] Staff: Submit AC breakdown with high severity
   - [ ] Verify auto-routed to maintenance role
   - [ ] Admin: Check service_requests table
   - [ ] Verify breakdown_category, severity saved

3. **Timer Accuracy:**
   - [ ] Start 3 tasks at different times
   - [ ] Check Dashboard shows different timer values
   - [ ] Complete tasks → Verify durations differ

---

## Performance Testing

- [ ] Load Dashboard with 100+ rooms
- [ ] Verify board renders within 2 seconds
- [ ] Test with 50+ active tasks
- [ ] Check timer updates don't lag
- [ ] Verify filters work with large dataset
- [ ] Test on mobile device (Android/iOS)
- [ ] Test offline mode in Staff PWA
- [ ] Verify service worker updates

---

## Browser Compatibility

**Admin Web:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] Safari (latest)

**Staff PWA:**
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)
- [ ] Standalone PWA mode
- [ ] Offline functionality

---

## Arabic Interface Testing

- [ ] All new labels display in Arabic (Staff PWA)
- [ ] Breakdown categories show Arabic labels
- [ ] Severity levels in Arabic
- [ ] Timer label in Arabic
- [ ] Emergency checkbox in Arabic
- [ ] Right-to-left layout works correctly
- [ ] No English text visible to staff users

---

## Database Testing

### Migration 017 - Inspection Workflow
```sql
-- Verify columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'housekeeping_tasks' 
AND column_name IN (
  'inspection_status', 'requires_inspection', 'inspected_by',
  'inspected_at', 'inspection_notes', 'inspection_checklist',
  'actual_start_time', 'actual_end_time', 'pause_time'
);

-- Verify templates exist
SELECT * FROM inspection_checklist_templates;

-- Verify trigger exists
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name = 'set_inspection_status_trigger';
```

### Migration 018 - Enhanced Breakdowns
```sql
-- Verify columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'service_requests' 
AND column_name IN (
  'breakdown_category', 'severity', 'is_medical_emergency',
  'estimated_resolution_time', 'actual_resolution_time'
);

-- Verify breakdown templates (should be 30+)
SELECT category_name, COUNT(*) as issue_count
FROM breakdown_category_templates
GROUP BY category_name;

-- Verify trigger exists
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name = 'auto_route_service_request_trigger';
```

---

## Error Handling

- [ ] Try inspecting without selecting result (pass/fail)
- [ ] Try submitting inspection with empty required checklist items
- [ ] Try completing task without starting timer
- [ ] Try submitting service request without room
- [ ] Test network disconnection in PWA
- [ ] Test database connection loss
- [ ] Verify error messages display in Arabic

---

## Security Testing

- [ ] Verify RLS policies (if enabled)
- [ ] Test unauthorized access to inspection modal
- [ ] Verify only supervisors can inspect
- [ ] Test staff cannot access admin features
- [ ] Check inspector_id matches logged-in user
- [ ] Verify org_id isolation works

---

## Acceptance Criteria (SRS Compliance)

### FR-HK-02: Timer Tracking ✅
- [x] actual_start_time recorded on task start
- [x] actual_end_time recorded on completion
- [x] Real-time timer display in PWA
- [x] Duration calculated automatically

### FR-HK-03: Inspection Workflow ✅
- [x] Dynamic checklists based on task type
- [x] 3 templates: Regular (8 items), Checkout (10), Deep Clean (10)
- [x] Pass/fail decision workflow
- [x] Inspector notes (required for fail)
- [x] Failed tasks return to pending status
- [x] Audit trail: inspected_by, inspected_at

### FR-HK-04: Breakdown Categories ✅
- [x] 30+ predefined breakdown types
- [x] 6 main categories (AC, Plumbing, Electrical, Furniture, Appliance, Structural)
- [x] Severity levels (5 levels)
- [x] Medical emergency flag
- [x] Auto-routing by category
- [x] SLA estimation by category

### FR-HK-06: Live Dashboard ✅
- [x] Real-time room status grid
- [x] 8 color-coded statuses
- [x] Floor filter
- [x] Status filter
- [x] Staff assignment display
- [x] Timer display for active tasks
- [x] 15-second auto-refresh
- [x] Database subscriptions

---

## Sign-Off

**Tester:** _____________________  
**Date:** _____________________  
**Supervisor:** _____________________  
**Date:** _____________________  

**Overall Status:** ⬜ PASS | ⬜ FAIL | ⬜ PASS WITH ISSUES

**Notes:**
_______________________________________________________
_______________________________________________________
_______________________________________________________

---

## Deployment Approval

- [ ] All tests passed
- [ ] No critical issues
- [ ] Arabic interface verified
- [ ] Performance acceptable
- [ ] Client sign-off obtained

**Approved for Production:** ⬜ YES | ⬜ NO

**Deployment Date:** _____________________
