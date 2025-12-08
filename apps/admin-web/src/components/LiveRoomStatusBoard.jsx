import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/stores/authStore'
import { 
  Home, Clock, CheckCircle, AlertCircle, User, 
  Wrench, Eye, RefreshCw
} from 'lucide-react'

export default function LiveRoomStatusBoard() {
  const { orgId } = useAuthStore()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFloor, setSelectedFloor] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')

  useEffect(() => {
    if (orgId) {
      fetchRoomStatuses()
      
      // Real-time subscription
      const channel = supabase
        .channel('room_status_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'housekeeping_tasks',
        }, () => {
          fetchRoomStatuses()
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'rooms',
        }, () => {
          fetchRoomStatuses()
        })
        .subscribe()

      const interval = setInterval(fetchRoomStatuses, 15000)

      return () => {
        supabase.removeChannel(channel)
        clearInterval(interval)
      }
    }
  }, [orgId])

  const fetchRoomStatuses = async () => {
    try {
      // Get all rooms with their latest tasks
      const { data: roomsData, error } = await supabase
        .from('rooms')
        .select(`
          *,
          latest_task:housekeeping_tasks(
            id,
            status,
            task_type,
            priority,
            assigned_to,
            started_at,
            completed_at,
            inspection_status,
            assigned_user:users(full_name, full_name_ar)
          )
        `)
        .eq('org_id', orgId)
        .order('floor', { ascending: true })
        .order('room_number', { ascending: true })

      if (error) throw error

      // Get the most recent task for each room
      const roomsWithStatus = roomsData.map(room => {
        // Find the most recent task
        const tasks = Array.isArray(room.latest_task) ? room.latest_task : room.latest_task ? [room.latest_task] : []
        const latestTask = tasks.length > 0 ? tasks[0] : null

        return {
          ...room,
          currentTask: latestTask,
          displayStatus: getDisplayStatus(room, latestTask)
        }
      })

      setRooms(roomsWithStatus)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching room statuses:', error)
      setLoading(false)
    }
  }

  const getDisplayStatus = (room, task) => {
    if (!task) {
      return {
        status: room.occupancy_status,
        color: room.occupancy_status === 'occupied' ? 'blue' : 'gray',
        label: room.occupancy_status === 'occupied' ? 'Occupied' : 'Vacant',
        icon: Home
      }
    }

    if (task.inspection_status === 'pending') {
      return {
        status: 'pending_inspection',
        color: 'purple',
        label: 'Pending Inspection',
        icon: Eye
      }
    }

    if (task.inspection_status === 'failed') {
      return {
        status: 'failed_inspection',
        color: 'red',
        label: 'Failed Inspection',
        icon: AlertCircle
      }
    }

    switch (task.status) {
      case 'in_progress':
        return {
          status: 'in_progress',
          color: 'yellow',
          label: 'Cleaning in Progress',
          icon: Clock
        }
      case 'completed':
        return {
          status: 'completed',
          color: 'green',
          label: 'Clean',
          icon: CheckCircle
        }
      case 'pending':
        return {
          status: 'pending',
          color: 'orange',
          label: 'Needs Cleaning',
          icon: AlertCircle
        }
      default:
        return {
          status: room.occupancy_status,
          color: 'gray',
          label: room.occupancy_status,
          icon: Home
        }
    }
  }

  const floors = ['all', ...new Set(rooms.map(r => r.floor).filter(Boolean))]

  const filteredRooms = rooms.filter(room => {
    if (selectedFloor !== 'all' && room.floor !== parseInt(selectedFloor)) return false
    if (selectedStatus !== 'all' && room.displayStatus.status !== selectedStatus) return false
    return true
  })

  const statusColors = {
    blue: 'bg-blue-100 border-blue-400 text-blue-800',
    green: 'bg-green-100 border-green-400 text-green-800',
    yellow: 'bg-yellow-100 border-yellow-400 text-yellow-800',
    red: 'bg-red-100 border-red-400 text-red-800',
    orange: 'bg-orange-100 border-orange-400 text-orange-800',
    purple: 'bg-purple-100 border-purple-400 text-purple-800',
    gray: 'bg-gray-100 border-gray-400 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Home className="w-6 h-6 text-blue-600" />
            Live Room Status Board
          </h2>
          <button
            onClick={fetchRoomStatuses}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
        </div>

        <div className="flex gap-4">
          {/* Floor Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {floors.map(floor => (
                <option key={floor} value={floor}>
                  {floor === 'all' ? 'All Floors' : `Floor ${floor}`}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Needs Cleaning</option>
              <option value="in_progress">In Progress</option>
              <option value="pending_inspection">Pending Inspection</option>
              <option value="completed">Clean</option>
              <option value="failed_inspection">Failed Inspection</option>
            </select>
          </div>
        </div>
      </div>

      {/* Room Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        {filteredRooms.map(room => {
          const StatusIcon = room.displayStatus.icon
          const colorClass = statusColors[room.displayStatus.color] || statusColors.gray

          return (
            <div
              key={room.id}
              className={`${colorClass} border-2 rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow`}
              title={`${room.room_number} - ${room.displayStatus.label}`}
            >
              {/* Room Number */}
              <div className="text-center mb-2">
                <div className="text-2xl font-bold">{room.room_number}</div>
                <div className="text-xs opacity-75">Floor {room.floor}</div>
              </div>

              {/* Status Icon */}
              <div className="flex justify-center mb-2">
                <StatusIcon className="w-6 h-6" />
              </div>

              {/* Status Label */}
              <div className="text-xs text-center font-medium mb-2">
                {room.displayStatus.label}
              </div>

              {/* Staff Info */}
              {room.currentTask && room.currentTask.assigned_user && (
                <div className="text-xs text-center opacity-75 truncate flex items-center justify-center gap-1">
                  <User className="w-3 h-3" />
                  <span className="truncate">
                    {room.currentTask.assigned_user.full_name_ar || room.currentTask.assigned_user.full_name}
                  </span>
                </div>
              )}

              {/* Time Info */}
              {room.currentTask && room.currentTask.started_at && room.currentTask.status === 'in_progress' && (
                <div className="text-xs text-center opacity-75 mt-1">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {Math.round((new Date() - new Date(room.currentTask.started_at)) / 60000)} min
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filteredRooms.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Home className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No rooms match the selected filters</p>
        </div>
      )}

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <h3 className="font-bold mb-3">Status Legend</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-400 rounded"></div>
            <span className="text-sm">Clean</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-400 rounded"></div>
            <span className="text-sm">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-400 rounded"></div>
            <span className="text-sm">Needs Cleaning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-400 rounded"></div>
            <span className="text-sm">Pending Inspection</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-400 rounded"></div>
            <span className="text-sm">Failed Inspection</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-400 rounded"></div>
            <span className="text-sm">Occupied</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-400 rounded"></div>
            <span className="text-sm">Vacant</span>
          </div>
        </div>
      </div>
    </div>
  )
}
