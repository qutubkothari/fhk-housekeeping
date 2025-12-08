# Fix Invalid User IDs Error

## Problem
Getting error: `invalid input syntax for type uuid: "inv-user-001"`

This happens because the database has users with invalid ID formats.

## Solution

### Step 1: Run SQL Script in Supabase
1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Open the file: `ENSURE_DEMO_USERS.sql`
4. Click **Run** to execute the script

This will:
- Delete any users with invalid IDs
- Create/update all demo users with correct UUIDs
- Set proper passwords and roles

### Step 2: Clear Browser Cache
1. Open browser DevTools (F12)
2. Go to **Application** tab
3. Expand **Local Storage**
4. Find your site's storage
5. **Delete** the `fhk_user` key
6. **Delete** the `auth-storage` key
7. Refresh the page (Ctrl+F5)

### Step 3: Test Login
Now login with any user:
- `admin@demohotel.com` / `admin123`
- `inventory@demohotel.com` / `inv123`
- `laundry@demohotel.com` / `laundry123`
- `maintenance@demohotel.com` / `maint123`

## What Changed

### Updated Login System
The login now:
1. **First** tries to authenticate using the database `login()` function (with real UUIDs from database)
2. **Fallback** to hardcoded test users only if database login fails
3. Uses proper UUID formats (starting with letters: `a1111111-...`, `b2222222-...`, etc.)

### Why This Works
- Database users now have real UUIDs from Supabase
- Login function returns actual user data from database
- No more hardcoded invalid IDs

## Verification
After fixing, you should see in console:
```
✅ Login successful
✅ User ID: [valid UUID]
✅ Role: inventory
```

Instead of:
```
❌ invalid input syntax for type uuid: "inv-user-001"
```
