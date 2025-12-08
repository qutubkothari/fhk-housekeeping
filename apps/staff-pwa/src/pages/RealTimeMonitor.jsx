import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Activity, Clock, AlertCircle, CheckCircle2, Users, RefreshCw } from 'lucide-react'

export default function RealTimeMonitor({ user }) {
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
    if (user?.org_id) {
      loadData()
      const interval = setInterval(loadData, 30000) // Refresh every 30s
      return () => clearInterval(interval)
    }
  }, [user?.org_id])

  const loadData = async () => {
    try {
      // Load rooms with current status
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .eq('org_id', user.org_id)
        .order('room_number')

      if (roomsError) throw roomsError

      // Load active work sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('work_sessions')
        .select(`
          *,
          rooms (room_number, floor),
          users (full_name, role)
        `)
        .eq('org_id', user.org_id)
        .eq('status', 'in_progress')

      if (sessionsError) throw sessionsError

      setRooms(roomsData || [])
      setActiveSessions(sessionsData || [])

      // Calculate stats
      const cleaning = roomsData?.filter(r => r.status === 'cleaning').length || 0
      const maintenance = roomsData?.filter(r => r.status === 'maintenance').length || 0
      const vacant = roomsData?.filter(r => r.status === 'vacant').length || 0
      const occupied = roomsData?.filter(r => r.status === 'occupied').length || 0

      setStats({ cleaning, maintenance, vacant, occupied })
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'vacant': return 'bg-green-100 text-green-800 border-green-300'
      case 'occupied': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'cleaning': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'maintenance': return 'bg-orange-100 text-orange-800 border-orange-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'vacant': return CheckCircle2
      case 'occupied': return Users
      case 'cleaning': return Clock
      case 'maintenance': return AlertCircle
      default: return Activity
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div></div>
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Vacant', value: stats.vacant, color: 'from-green-500 to-green-600', icon: CheckCircle2 },
          { label: 'Occupied', value: stats.occupied, color: 'from-blue-500 to-blue-600', icon: Users },
          { label: 'Cleaning', value: stats.cleaning, color: 'from-yellow-500 to-yellow-600', icon: Clock },
          { label: 'Maintenance', value: stats.maintenance, color: 'from-orange-500 to-orange-600', icon: AlertCircle },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className={`text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>{stat.value}</p>
              </div>
              <div className={`p-3 bg-gradient-to-br ${stat.color} rounded-lg`}>
                <stat.icon className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Active Work Sessions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Active Work Sessions</h2>
          <button
            onClick={loadData}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {activeSessions.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No active work sessions</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeSessions.map(session => (
              <div key={session.id} className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">
                      Room {session.rooms?.room_number}
                    </h3>
                    <p className="text-sm text-gray-500">Floor {session.rooms?.floor}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${
                    session.session_type === 'housekeeping' ? 'bg-yellow-100 text-yellow-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {session.session_type}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{session.users?.full_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">
                      {new Date(session.started_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Room Status Grid */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">All Rooms Status</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {rooms.map(room => {
            const StatusIcon = getStatusIcon(room.status)
            return (
              <div
                key={room.id}
                className={`border-2 rounded-lg p-4 text-center ${getStatusColor(room.status)}`}
              >
                <StatusIcon className="w-6 h-6 mx-auto mb-2" />
                <div className="font-bold text-lg">{room.room_number}</div>
                <div className="text-xs mt-1 capitalize">{room.status}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
