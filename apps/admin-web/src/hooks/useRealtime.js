import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export const useRealtime = (table, orgId, filters = {}) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData()
    
    // Subscribe to realtime changes
    const channel = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: orgId ? `org_id=eq.${orgId}` : undefined,
        },
        (payload) => {
          console.log('Realtime update:', payload)
          fetchData() // Refresh data on any change
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, orgId, JSON.stringify(filters)])

  const fetchData = async () => {
    try {
      setLoading(true)
      let query = supabase.from(table).select('*')
      
      if (orgId) {
        query = query.eq('org_id', orgId)
      }
      
      // Apply additional filters
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
      
      const { data: result, error: err } = await query.order('created_at', { ascending: false })
      
      if (err) throw err
      setData(result || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, refresh: fetchData }
}

export const useRealtimeView = (viewName, orgId) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData()
  }, [viewName, orgId])

  const fetchData = async () => {
    try {
      setLoading(true)
      let query = supabase.from(viewName).select('*')
      
      if (orgId) {
        query = query.eq('org_id', orgId)
      }
      
      const { data: result, error: err } = await query
      
      if (err) throw err
      setData(result || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching view data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, refresh: fetchData }
}
