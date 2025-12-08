# 🚀 Action Required: Deploy Edge Function

The "Auto-Route Requests" function needs to be updated to support the new Multi-Select feature and fix the CORS error.

Since the Supabase CLI is not installed on this machine, you must do this manually.

## Step 1: Open Supabase Dashboard
Go to: https://supabase.com/dashboard/project/oglmyyyhfwuhyghcbnmi/functions/auto-route-requests

## Step 2: Edit Function
1. Click on the **"auto-route-requests"** function.
2. Click **"Edit"** or **"View Source"**.
3. **Delete all existing code** and paste the code below.

## Step 3: The Code to Paste

```typescript
// Supabase Edge Function: Auto-route service requests using OpenAI
// Deploy: supabase functions deploy auto-route-requests

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestPayload {
  description: string
  roomId: string
  reportedBy: string
  orgId: string
  breakdownCategory?: string
  severity?: string
  isEmergency?: boolean
}

interface AIClassification {
  request_type: 'housekeeping' | 'maintenance' | 'guest_request' | 'breakdown'
  category: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  department: 'housekeeping' | 'maintenance' | 'laundry'
  estimated_time: number
  title: string
  title_ar: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { description, roomId, reportedBy, orgId, breakdownCategory, severity, isEmergency }: RequestPayload = await req.json()

    let classification: AIClassification

    // If breakdownCategory is provided (from manual selection), use it directly
    if (breakdownCategory) {
      classification = {
        request_type: 'maintenance', // Default to maintenance for breakdown categories
        category: breakdownCategory,
        priority: (severity as any) || 'normal',
        department: 'maintenance',
        estimated_time: 60, // Default 1 hour
        title: breakdownCategory,
        title_ar: breakdownCategory // We might not have the AR translation here easily, so use EN
      }
      
      // Adjust priority if emergency
      if (isEmergency) {
        classification.priority = 'urgent'
      }
    } else {
      // Fallback to OpenAI for auto-classification
      if (!OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured')
      }

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are an AI assistant for a hotel management system. Classify service requests into appropriate categories.
              
  Return JSON with this structure:
  {
    "request_type": "housekeeping|maintenance|guest_request|breakdown",
    "category": "specific category like ac_issue, plumbing, extra_towels, cleaning, etc",
    "priority": "low|normal|high|urgent",
    "department": "housekeeping|maintenance|laundry",
    "estimated_time": <minutes as integer>,
    "title": "Short English title",
    "title_ar": "Short Arabic title"
  }
  
  Priority levels:
  - urgent: Safety issues, no water/electricity, guest emergency
  - high: AC not working, plumbing issues, broken furniture
  - normal: Extra amenities, minor repairs, routine cleaning
  - low: General inquiries, non-urgent requests
  
  Estimated time in minutes based on typical service duration.`
            },
            {
              role: 'user',
              content: `Classify this hotel service request: "${description}"`
            }
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' }
        }),
      })

      const aiResult = await openaiResponse.json()
      classification = JSON.parse(aiResult.choices[0].message.content)
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)

    // Find appropriate staff to assign
    let assignedTo = null
    
    const { data: availableStaff } = await supabase
      .from('users')
      .select('id')
      .eq('org_id', orgId)
      .eq('role', classification.department === 'housekeeping' ? 'staff' : 'maintenance')
      .eq('is_active', true)
      .limit(1)
      .single()

    if (availableStaff) {
      assignedTo = availableStaff.id
    }

    // Insert service request
    const { data: serviceRequest, error } = await supabase
      .from('service_requests')
      .insert({
        org_id: orgId,
        room_id: roomId,
        request_type: classification.request_type,
        category: classification.category,
        title: classification.title,
        description: description,
        reported_by: reportedBy,
        assigned_to: assignedTo,
        status: assignedTo ? 'assigned' : 'open',
        priority: classification.priority,
        estimated_time: classification.estimated_time,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: serviceRequest,
        classification: classification,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})
```

## Step 4: Save and Deploy
Click the **"Save"** or **"Deploy"** button in the Supabase Dashboard.
