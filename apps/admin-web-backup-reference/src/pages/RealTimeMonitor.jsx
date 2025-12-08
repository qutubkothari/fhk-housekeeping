import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Activity, Clock, AlertCircle, CheckCircle2, Users } from 'lucide-react'

export default function RealTimeMonitor() {
  const [rooms, setRooms] = useState([])
  const [activeSessions, setActiveSessions] = useState([])
  const [stats, setStats] = useState({
    cleaning: 0,
    maintenance: 0,
    vacant: 0,
    occupied: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    setupRealtimeSubscription()
  }, [])

  const loadData = async () => {
    try {
      // Load rooms with current status
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .eq('is_active', true)
        .order('room_number')

      if (roomsError) throw roomsError

      // Load active work sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('work_sessions')
        .select(`
          *,
          rooms (room_number, floor, building),
          users (full_name, role)
        `)
        .eq('status', 'in_progress')

      if (sessionsError) throw sessionsError

      setRooms(roomsData || [])
      setActiveSessions(sessionsData || [])

      // Calculate stats
      const cleaning = roomsData.filter(r => r.status === 'cleaning').length
      const maintenance = roomsData.filter(r => r.status === 'maintenance').length
      const vacant = roomsData.filter(r => r.status === 'vacant').length
      const occupied = roomsData.filter(r => r.status === 'occupied').length

      setStats({ cleaning, maintenance, vacant, occupied })
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    const roomsChannel = supabase
      .channel('room_status_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms' },
        () => loadData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'work_sessions' },
        () => loadData()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(roomsChannel)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'vacant': return 'bg-green-100 text-green-800 border-green-300'
      case 'occupied': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'cleaning': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'maintenance': return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'out_of_order': return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'vacant': return 'Vacant'
      case 'occupied': return 'Occupied'
      case 'cleaning': return 'Cleaning'
      case 'maintenance': return 'Maintenance'
      case 'out_of_order': return 'Out of Order'
      default: return status
    }
  }

  const getTimeElapsed = (startedAt) => {
    const start = new Date(startedAt)
    const now = new Date()
    const diffMs = now - start
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 60) return `${diffMins} min`
    const hours = Math.floor(diffMins / 60)
    const mins = diffMins % 60
    return `${hours}h ${mins}m`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Real-Time Monitor</h1>
        <p className="text-gray-600">Live room status and active work sessions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Cleaning</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.cleaning}</p>
            </div>
            <Activity className="w-12 h-12 text-yellow-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Maintenance</p>
              <p className="text-3xl font-bold text-orange-600">{stats.maintenance}</p>
            </div>
            <AlertCircle className="w-12 h-12 text-orange-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Vacant</p>
              <p className="text-3xl font-bold text-green-600">{stats.vacant}</p>
            </div>
            <CheckCircle2 className="w-12 h-12 text-green-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Occupied</p>
              <p className="text-3xl font-bold text-blue-600">{stats.occupied}</p>
            </div>
            <Users className="w-12 h-12 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Active Work Sessions */}
      {activeSessions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Active Work Sessions</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Room
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Staff
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activeSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-3"></div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              Room {session.rooms.room_number}
                            </div>
                            <div className="text-sm text-gray-500">
                              Floor {session.rooms.floor}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{session.users.full_name}</div>
                        <div className="text-sm text-gray-500 capitalize">{session.users.role}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          session.session_type === 'housekeeping' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {session.session_type === 'housekeeping' ? 'Cleaning' : 'Maintenance'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2 text-gray-400" />
                          {getTimeElapsed(session.started_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          In Progress
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* All Rooms Grid */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">All Rooms</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {rooms.map((room) => (
            <div
              key={room.id}
              className={`relative p-4 rounded-lg border-2 ${getStatusColor(room.status)} transition-all hover:shadow-lg`}
            >
              <div className="text-center">
                <div className="text-2xl font-bold mb-1">{room.room_number}</div>
                <div className="text-xs font-semibold uppercase">{getStatusLabel(room.status)}</div>
                {room.floor && (
                  <div className="text-xs opacity-75 mt-1">Floor {room.floor}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
