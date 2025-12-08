# API Documentation - FHK Housekeeping System

## Base URLs

- **Supabase**: `https://your-project.supabase.co`
- **Edge Functions**: `https://your-project.supabase.co/functions/v1`

## Authentication

All API requests require authentication via Supabase Auth.

```javascript
// Client-side authentication
import { supabase } from './supabaseClient'

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

// Get current session
const { data: { session } } = await supabase.auth.getSession()

// All subsequent requests automatically include auth token
```

---

## Database Tables

### 1. Rooms

**Table:** `rooms`

**Get all rooms:**
```javascript
const { data, error } = await supabase
  .from('rooms')
  .select('*')
  .eq('org_id', orgId)
```

**Get room with tasks:**
```javascript
const { data, error } = await supabase
  .from('rooms')
  .select(`
    *,
    current_staff:users(full_name),
    tasks:housekeeping_tasks(*)
  `)
  .eq('id', roomId)
  .single()
```

**Update room status:**
```javascript
const { error } = await supabase
  .from('rooms')
  .update({ status: 'cleaning' })
  .eq('id', roomId)
```

### 2. Housekeeping Tasks

**Table:** `housekeeping_tasks`

**Get staff tasks:**
```javascript
const { data, error } = await supabase
  .from('housekeeping_tasks')
  .select(`
    *,
    room:rooms(room_number, floor)
  `)
  .eq('assigned_to', userId)
  .eq('scheduled_date', '2025-12-05')
```

**Start task:**
```javascript
const { error } = await supabase
  .from('housekeeping_tasks')
  .update({
    status: 'in_progress',
    started_at: new Date().toISOString()
  })
  .eq('id', taskId)
```

**Complete task:**
```javascript
const { error } = await supabase
  .from('housekeeping_tasks')
  .update({
    status: 'completed',
    completed_at: new Date().toISOString(),
    duration_minutes: durationMinutes
  })
  .eq('id', taskId)
```

### 3. Service Requests

**Table:** `service_requests`

**Create service request:**
```javascript
const { data, error } = await supabase
  .from('service_requests')
  .insert({
    org_id: orgId,
    room_id: roomId,
    request_type: 'maintenance',
    category: 'ac_issue',
    title: 'AC not working',
    description: 'Room 101 AC not cooling',
    reported_by: userId,
    priority: 'high'
  })
```

### 4. Inventory

**Table:** `inventory_items`

**Get low stock items:**
```javascript
const { data, error } = await supabase
  .from('inventory_items')
  .select('*')
  .eq('org_id', orgId)
  .lte('current_stock', 'reorder_level')
```

**Issue inventory:**
```javascript
// Use transaction
const { error } = await supabase
  .from('inventory_transactions')
  .insert({
    org_id: orgId,
    item_id: itemId,
    transaction_type: 'issue',
    quantity: -5,
    room_id: roomId,
    staff_id: userId,
    created_by: userId
  })
// Stock automatically updates via trigger
```

### 5. Linen Management

**Table:** `linen_items`

**Send to laundry:**
```javascript
const batchId = `BATCH-${new Date().toISOString().split('T')[0]}-${Math.random().toString(36).substr(2, 4)}`

const { error } = await supabase
  .from('linen_transactions')
  .insert({
    org_id: orgId,
    linen_id: linenId,
    transaction_type: 'send_laundry',
    quantity: 20,
    laundry_batch_id: batchId,
    created_by: userId
  })
```

---

## Views

### Dashboard Stats

**RPC Function:** `get_dashboard_stats`

```javascript
const { data, error } = await supabase.rpc('get_dashboard_stats', {
  p_org_id: orgId
})

// Returns:
{
  rooms: { total, occupied, vacant, cleaning, maintenance },
  tasks_today: { total, completed, pending, in_progress },
  service_requests: { open, urgent },
  inventory: { low_stock_items },
  linen: { clean, soiled, in_laundry }
}
```

### Room Status Overview

**View:** `v_room_status_overview`

```javascript
const { data, error } = await supabase
  .from('v_room_status_overview')
  .select('*')
  .eq('org_id', orgId)
```

### Low Stock Items

**View:** `v_low_stock_items`

```javascript
const { data, error } = await supabase
  .from('v_low_stock_items')
  .select('*')
  .eq('org_id', orgId)
```

---

## Edge Functions

### Auto-Route Service Requests

**Endpoint:** `POST /functions/v1/auto-route-requests`

Uses OpenAI to automatically classify and route service requests.

```javascript
const { data, error } = await supabase.functions.invoke('auto-route-requests', {
  body: {
    description: 'The AC in room 101 is not working',
    roomId: 'room-uuid',
    reportedBy: 'user-uuid',
    orgId: 'org-uuid'
  }
})

// Returns:
{
  success: true,
  data: { /* service request record */ },
  classification: {
    request_type: 'maintenance',
    category: 'ac_issue',
    priority: 'high',
    department: 'maintenance',
    estimated_time: 30,
    title: 'AC Malfunction',
    title_ar: 'عطل في المكيف'
  }
}
```

---

## Realtime Subscriptions

### Subscribe to Task Updates

```javascript
const channel = supabase
  .channel('task_updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'housekeeping_tasks',
    filter: `assigned_to=eq.${userId}`
  }, (payload) => {
    console.log('Task updated:', payload)
  })
  .subscribe()

// Cleanup
supabase.removeChannel(channel)
```

### Subscribe to Room Changes

```javascript
const channel = supabase
  .channel('room_changes')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'rooms',
    filter: `org_id=eq.${orgId}`
  }, (payload) => {
    console.log('Room updated:', payload)
  })
  .subscribe()
```

---

## Error Handling

All Supabase operations return `{ data, error }`:

```javascript
const { data, error } = await supabase
  .from('rooms')
  .select('*')

if (error) {
  console.error('Error:', error.message)
  // Handle error
} else {
  // Use data
}
```

---

## Rate Limits

Supabase Free Tier:
- API Requests: 500,000/month
- Realtime connections: 200 concurrent
- Database size: 500 MB

For production, consider Supabase Pro tier.

---

## Common Patterns

### Fetch with Joins

```javascript
const { data, error } = await supabase
  .from('housekeeping_tasks')
  .select(`
    *,
    room:rooms(room_number, floor),
    assigned_staff:users!housekeeping_tasks_assigned_to_fkey(full_name),
    assigned_by_user:users!housekeeping_tasks_assigned_by_fkey(full_name)
  `)
```

### Pagination

```javascript
const { data, error } = await supabase
  .from('rooms')
  .select('*')
  .range(0, 9) // First 10 records
```

### Full-text Search

```javascript
const { data, error } = await supabase
  .from('inventory_items')
  .select('*')
  .textSearch('item_name_en', 'soap')
```

---

## Security

### Row Level Security (RLS)

All tables have RLS enabled. Users can only access their organization's data:

```sql
CREATE POLICY "Users access own org" ON rooms 
  FOR ALL USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
```

### API Keys

- **Anon Key**: Safe for client-side (has RLS restrictions)
- **Service Key**: Server-side only (bypasses RLS)

Never expose service key in frontend code!

---

For more details, see [Supabase Documentation](https://supabase.com/docs)
