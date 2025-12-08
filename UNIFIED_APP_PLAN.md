# FHK Unified Application Plan

## Overview
Single login page → Role-based dashboards

## User Roles & Interfaces

### Desktop Dashboard Users (Full Interface)
1. **Super Admin** (`super_admin`)
   - All modules access
   - Dashboard, Rooms, Staff, Housekeeping, Service Requests
   - Inventory, Laundry/Linen, Assets, Reports, Settings
   - Real-time Monitor

2. **Inventory Manager** (`inventory`)
   - Inventory module only
   - View items, issue to staff, link assets to rooms
   - Stock management, consumption tracking

3. **Laundry Manager** (`laundry`)
   - Laundry/Linen module only
   - Linen tracking, laundry requests
   - Inventory of linens

### Mobile Users (Simple Task Interface)
4. **Supervisor** (`supervisor`)
   - View all employees
   - Assign tasks to housekeeping/maintenance
   - Monitor task completion
   - Mobile optimized

5. **Housekeeping Staff** (`staff`)
   - View assigned rooms
   - Start/Complete cleaning tasks
   - Report issues found
   - Mobile only

6. **Maintenance/Technician** (`maintenance`)
   - View assigned repairs
   - Update work status
   - Document work done
   - Mobile only

## Database Users Mapping
```sql
-- Super Admin
admin@demohotel.com → super_admin

-- Inventory
inventory@demohotel.com → inventory

-- Laundry  
laundry@demohotel.com → laundry

-- Supervisor
supervisor@demohotel.com → supervisor

-- Staff
fatima@demohotel.com → staff
ahmed@demohotel.com → staff
sara@demohotel.com → staff

-- Maintenance
technician@demohotel.com → maintenance
maintenance@demohotel.com → maintenance
```

## File Structure

```
apps/
├── admin-web-backup/          # Original reference (DO NOT MODIFY)
├── admin-web/                 # Keep for now, will deprecate
└── staff-pwa/                 # UNIFIED APP
    ├── src/
    │   ├── AppProfessional.jsx       # Main router
    │   ├── pages/
    │   │   ├── Login.jsx             # Single login page
    │   │   ├── Dashboard.jsx         # Super admin dashboard
    │   │   ├── Rooms.jsx             # Super admin
    │   │   ├── Staff.jsx             # Super admin
    │   │   ├── Housekeeping.jsx      # Super admin
    │   │   ├── ServiceRequests.jsx   # Super admin
    │   │   ├── Inventory.jsx         # Super admin + Inventory manager
    │   │   ├── Linen.jsx             # Super admin + Laundry manager
    │   │   ├── Reports.jsx           # Super admin
    │   │   ├── Settings.jsx          # Super admin
    │   │   ├── AssetManagement.jsx   # Super admin
    │   │   ├── RealTimeMonitor.jsx   # Super admin
    │   │   ├── SupervisorMobile.jsx  # Supervisor mobile
    │   │   ├── StaffMobile.jsx       # Staff mobile
    │   │   └── MaintenanceMobile.jsx # Maintenance mobile
    │   └── components/
    │       ├── Layout.jsx            # Desktop layout with sidebar
    │       └── MobileLayout.jsx      # Mobile layout simple
    └── ...
```

## Implementation Steps

### Phase 1: Setup (Current)
- [x] Backup admin-web to admin-web-backup
- [ ] Update role definitions in database
- [ ] Create unified login page

### Phase 2: Copy Admin Features
- [ ] Copy all admin pages from admin-web
- [ ] Apply modern design system
- [ ] Create desktop layout with sidebar

### Phase 3: Mobile Interfaces
- [ ] Create supervisor mobile interface
- [ ] Create staff mobile interface  
- [ ] Create maintenance mobile interface

### Phase 4: Role-Based Routing
- [ ] Implement role check on login
- [ ] Route to correct interface based on role
- [ ] Restrict module access by role

### Phase 5: Testing & Deployment
- [ ] Test all user roles
- [ ] Build production version
- [ ] Deploy to server

## Design System
- **Desktop**: Sidebar navigation, multi-panel layouts
- **Mobile**: Bottom tab bar, single-panel screens
- **Colors**: 
  - Super Admin: Blue (#0ea5e9)
  - Inventory: Green (#10b981)
  - Laundry: Purple (#8b5cf6)
  - Supervisor: Orange (#f59e0b)
  - Staff: Teal (#14b8a6)
  - Maintenance: Red (#ef4444)
