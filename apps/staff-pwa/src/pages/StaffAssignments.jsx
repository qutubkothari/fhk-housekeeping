import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Calendar, Users, Clock, CheckCircle, XCircle, Search, Filter, Plus } from 'lucide-react'
import Select from 'react-select'
import { customSelectStyles } from '../utils/selectStyles'

export default function StaffAssignments({ user }) {
  const [assignments, setAssignments] = useState([])
  const [staff, setStaff] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [legacyAssignmentsUnavailable, setLegacyAssignmentsUnavailable] = useState(false)
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0])
  const [filterStaff, setFilterStaff] = useState('all')

  useEffect(() => {
    if (user?.org_id) {
      loadData()
    }
  }, [user?.org_id, filterDate])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load staff members
      const { data: staffData, error: staffError } = await supabase
        .from('users')
        .select('*')
        .eq('org_id', user.org_id)
        .in('role', ['staff', 'supervisor', 'maintenance'])
        .eq('is_active', true)
        .order('full_name')

      if (staffError) throw staffError

      // Load rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .eq('org_id', user.org_id)
        .order('room_number')

      if (roomsError) throw roomsError

      // New flow: load room assignments for the selected date
      const { data: roomAssignments, error: roomAssignmentsError } = await supabase
        .from('room_assignments')
        .select(`
          id,
          assignment_date,
          assignment_type,
          status,
          completion_percentage,
          created_at,
          rooms (room_number, floor, room_type)
        `)
        .eq('org_id', user.org_id)
        .eq('assignment_date', filterDate)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })

      if (roomAssignmentsError?.code === '42P01') {
        setLegacyAssignmentsUnavailable(true)
        setAssignments([])
      } else {
        if (roomAssignmentsError) throw roomAssignmentsError
        setLegacyAssignmentsUnavailable(false)

        const roomAssignmentIds = (roomAssignments || []).map(r => r.id)
        if (roomAssignmentIds.length === 0) {
          setAssignments([])
        } else {
          const { data: activityAssignments, error: activityAssignmentsError } = await supabase
            .from('activity_assignments')
            .select(`
              id,
              room_assignment_id,
              assigned_to,
              status,
              started_at,
              completed_at,
              time_taken_minutes,
              notes,
              housekeeping_activities (name, sequence_order)
            `)
            .in('room_assignment_id', roomAssignmentIds)

          if (activityAssignmentsError) throw activityAssignmentsError

          const staffById = new Map((staffData || []).map(s => [s.id, s]))
          const roomByAssignmentId = new Map((roomAssignments || []).map(ra => [ra.id, ra]))

          const rows = (activityAssignments || []).map(a => {
            const ra = roomByAssignmentId.get(a.room_assignment_id)
            const staffMember = staffById.get(a.assigned_to)
            return {
              id: a.id,
              assigned_to: a.assigned_to,
              status: a.status,
              room_assignment_id: a.room_assignment_id,
              assignment_type: ra?.assignment_type,
              completion_percentage: ra?.completion_percentage ?? 0,
              rooms: ra?.rooms,
              activity: a.housekeeping_activities,
              assigned_user: staffMember ? { full_name: staffMember.full_name, role: staffMember.role } : null,
            }
          })

          setAssignments(rows)
        }
      }

      setStaff(staffData || [])
      setRooms(roomsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAssignments = assignments.filter(assignment => {
    if (filterStaff === 'all') return true
    return assignment.assigned_to === filterStaff
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 border-green-300'
      case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'pending_inspection': return 'bg-purple-100 text-purple-700 border-purple-300'
      default: return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600'
      case 'high': return 'text-orange-600'
      case 'normal': return 'text-blue-600'
      case 'low': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  // Group assignments by staff
  const assignmentsByStaff = staff.map(staffMember => {
    const staffAssignments = filteredAssignments.filter(a => a.assigned_to === staffMember.id)
    return {
      staff: staffMember,
      assignments: staffAssignments,
      completed: staffAssignments.filter(a => a.status === 'completed').length,
      pending: staffAssignments.filter(a => a.status === 'pending').length,
      in_progress: staffAssignments.filter(a => a.status === 'in_progress').length,
    }
  }).filter(item => filterStaff === 'all' || item.staff.id === filterStaff)

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div></div>
  }

  if (legacyAssignmentsUnavailable) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900">Staff Assignments</h1>
        <p className="text-gray-600 mt-2">
          This deployment uses the new activity-based workflow. The legacy table <span className="font-semibold">housekeeping_tasks</span> is not available.
        </p>
        <p className="text-gray-600 mt-2">
          Use <span className="font-semibold">Bulk Assignment</span> to create assignments, and the staff mobile screen to track progress.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Assignments</h1>
          <p className="text-gray-600 mt-1">Manage and track staff task assignments</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Filter by Date
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Filter by Staff
            </label>
            <Select
              value={staff.find(s => s.id === filterStaff) ? {
                value: filterStaff,
                label: staff.find(s => s.id === filterStaff).full_name
              } : { value: 'all', label: 'All Staff Members' }}
              onChange={(option) => setFilterStaff(option?.value || 'all')}
              options={[
                { value: 'all', label: 'All Staff Members' },
                ...staff.map(s => ({ value: s.id, label: s.full_name }))
              ]}
              styles={customSelectStyles}
              isSearchable
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Assignments', value: filteredAssignments.length, color: 'from-blue-500 to-blue-600', icon: Calendar },
          { label: 'Completed', value: filteredAssignments.filter(a => a.status === 'completed').length, color: 'from-green-500 to-green-600', icon: CheckCircle },
          { label: 'In Progress', value: filteredAssignments.filter(a => a.status === 'in_progress').length, color: 'from-yellow-500 to-yellow-600', icon: Clock },
          { label: 'Pending', value: filteredAssignments.filter(a => a.status === 'pending').length, color: 'from-orange-500 to-orange-600', icon: XCircle },
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

      {/* Assignments by Staff */}
      <div className="space-y-4">
        {assignmentsByStaff.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No assignments found</p>
            <p className="text-gray-500 text-sm mt-2">Try selecting a different date or staff member</p>
          </div>
        ) : (
          assignmentsByStaff.map(({ staff: staffMember, assignments: staffAssignments, completed, pending, in_progress }) => (
            <div key={staffMember.id} className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{staffMember.full_name}</h3>
                    <p className="text-sm text-gray-600 capitalize">{staffMember.role}</p>
                  </div>
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{completed}</div>
                    <div className="text-gray-600">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{in_progress}</div>
                    <div className="text-gray-600">In Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{pending}</div>
                    <div className="text-gray-600">Pending</div>
                  </div>
                </div>
              </div>

              {staffAssignments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No assignments for this staff member on selected date
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {staffAssignments.map(assignment => (
                    <div key={assignment.id} className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-lg text-gray-900">
                            Room {assignment.rooms?.room_number}
                          </h4>
                          <p className="text-sm text-gray-500">Floor {assignment.rooms?.floor}</p>
                          {assignment.activity?.name && (
                            <p className="text-sm text-gray-700 mt-1">
                              {assignment.activity.name}
                            </p>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold border capitalize ${getStatusColor(assignment.status)}`}>
                          {assignment.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600">Type:</span>
                          <span className="text-gray-900 font-semibold">
                            {(assignment.assignment_type || 'assignment').replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600">Room Completion:</span>
                          <span className="text-gray-900 font-semibold">{assignment.completion_percentage || 0}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
