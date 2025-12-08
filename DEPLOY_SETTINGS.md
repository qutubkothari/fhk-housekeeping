# Settings Module Deployment Guide

## Module Status
✅ **Settings.jsx** - Fully implemented with 4 tabs:
- Organization Settings (name, address, phone, email, currency, timezone, language, business hours)
- User Profile (name, phone, language preferences)
- Security (password change with validation)
- Preferences (notification and display settings)

✅ **Build completed** - 618.35 kB (gzipped: 153.96 kB)

## Deployment Steps

### 1. Apply Database Migration
The password change function needs to be added to the database:

```bash
# SSH to your server
ssh -i /path/to/your-key.pem ubuntu@13.234.30.197

# Apply migration
sudo -u postgres psql -d fhk_housekeeping < /tmp/016_password_change_function.sql
```

**Migration file location:** `supabase/migrations/016_password_change_function.sql`

**What it does:**
- Creates `change_user_password(p_user_id, p_old_password, p_new_password)` function
- Validates old password using bcrypt
- Updates password securely with new bcrypt hash
- Returns boolean success status

### 2. Deploy Built Files
Copy the built admin application to the server:

```bash
# From your local machine
scp -i /path/to/your-key.pem -r apps/admin-web/dist/* ubuntu@13.234.30.197:/var/www/fhk/admin/

# Or use rsync for efficiency
rsync -avz -e "ssh -i /path/to/your-key.pem" apps/admin-web/dist/ ubuntu@13.234.30.197:/var/www/fhk/admin/
```

### 3. Verify Deployment
Visit: http://13.234.30.197/admin/

Navigate to **Settings** from the sidebar and verify:
1. ✅ Organization tab loads with current data
2. ✅ User Profile tab shows logged-in user info
3. ✅ Security tab allows password change
4. ✅ Preferences tab displays notification options
5. ✅ Save buttons work for all sections

## Features Implemented

### Organization Settings
- **Basic Info:** Name, address, phone, email
- **System Config:** Currency (SAR/USD/EUR/AED), Timezone, Default Language (AR/EN)
- **Business Hours:** Start/End time configuration
- **Persistence:** Saves to `organizations.settings` JSONB field

### User Profile
- **Personal Info:** Full name (English + Arabic), phone number
- **Preferences:** Preferred language selection
- **Email:** Read-only (cannot be changed)
- **Auto-load:** Fetches current user data on mount

### Security
- **Password Change:** Current password verification required
- **Validation:** Minimum 8 characters, matching confirmation
- **Security:** Uses bcrypt via `change_user_password()` RPC function
- **Feedback:** Clear success/error messages

### Preferences
- **Notifications:** Low stock alerts, task assignments, service requests, daily summaries
- **Display:** Room images, auto-refresh, Arabic translations
- **Local Storage:** Settings stored in browser (future: backend sync)

## Technical Details

### Database Schema Used
```sql
-- organizations.settings (JSONB)
{
  "currency": "SAR",
  "timezone": "Asia/Riyadh", 
  "default_language": "ar",
  "business_hours": {
    "start": "06:00",
    "end": "23:00"
  }
}

-- users table
- id (UUID)
- full_name (TEXT)
- full_name_ar (TEXT)
- email (TEXT) - read-only
- phone (TEXT)
- preferred_language (TEXT)
- password_hash (TEXT) - updated via RPC
```

### API Endpoints Used
- `GET /organizations?id=eq.{orgId}` - Fetch organization
- `PATCH /organizations?id=eq.{orgId}` - Update organization
- `GET /users?id=eq.{userId}` - Fetch user profile
- `PATCH /users?id=eq.{userId}` - Update user profile
- `RPC change_user_password(p_user_id, p_old_password, p_new_password)` - Change password

### Component Architecture
- **State Management:** React useState for form data
- **Data Fetching:** Supabase client with useEffect hooks
- **Form Handling:** Controlled inputs with onChange handlers
- **Loading States:** Disabled buttons during save operations
- **Success Feedback:** Temporary messages with auto-dismiss (3s)
- **Icons:** Lucide React for consistent UI

## Bundle Size Note
The build output shows 618.35 kB (gzipped: 153.96 kB), which is acceptable for an admin panel. The warning about chunk sizes can be addressed later with code splitting if needed:

```javascript
// Future optimization (if needed)
const Settings = lazy(() => import('./pages/Settings'))
const Reports = lazy(() => import('./pages/Reports'))
// etc.
```

## Next Steps
After deploying Settings module:
1. Test all save operations
2. Verify password change functionality
3. Confirm organization settings persist
4. Check user profile updates work
5. Move to final module: **Staff PWA** (mobile app for housekeepers)

## Troubleshooting

### Migration fails
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify database name: `sudo -u postgres psql -l | grep fhk`
- Check for syntax errors in migration file

### Password change doesn't work
- Verify migration was applied: `SELECT proname FROM pg_proc WHERE proname = 'change_user_password'`
- Check user has bcrypt extension: `SELECT * FROM pg_extension WHERE extname = 'pgcrypto'`
- Review function permissions: `\df change_user_password` in psql

### Save operations fail
- Check browser console for errors
- Verify Supabase URL/Key in `.env`
- Confirm organization/user IDs are valid
- Check network tab for failed requests

---

**Module:** Settings (8 of 9)  
**Status:** ✅ Complete - Ready for deployment  
**Next:** Staff PWA (Final module)
