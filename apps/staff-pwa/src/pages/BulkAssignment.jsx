import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { translations } from '../translations'
import { 
  CheckSquare, Square, Users, Clock, Calendar, 
  Save, X, Home, Activity, User, ChevronRight,
  Edit2, Trash2, Eye, List, Plus 
} from 'lucide-react'

export default function BulkAssignment({ user, lang = 'en' }) {
  const t = (key) => translations[key]?.[lang] || key
  const orgId = user?.org_id

  const [step, setStep] = useState(1) // 1: Select Rooms, 2: Select Activities, 3: Assign Staff, 4: Review
  const [viewMode, setViewMode] = useState('create') // 'create' or 'manage'
  const [rooms, setRooms] = useState([])
  const [activities, setActivities] = useState([])
  const [staff, setStaff] = useState([])
  const [shifts, setShifts] = useState([])
  const [existingAssignments, setExistingAssignments] = useState([])
  const [loading, setLoading] = useState(true)

  // Selection state
  const [selectedRooms, setSelectedRooms] = useState([])
  const [selectedActivities, setSelectedActivities] = useState([])
  const [assignmentData, setAssignmentData] = useState({
    assignment_type: 'before_arrival',
    shift_id: null,
    target_completion_time: '',
    notes: ''
  })
  const [activityStaffMap, setActivityStaffMap] = useState({}) // { activity_id: staff_id }

  useEffect(() => {
    fetchData()
  }, [orgId, viewMode])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [roomsRes, activitiesRes, staffRes, shiftsRes] = await Promise.all([
        supabase
          .from('rooms')
          .select('*')
          .eq('org_id', orgId)
          .eq('is_active', true)
          .order('room_number'),
        supabase
          .from('housekeeping_activities')
          .select('*')
          .eq('org_id', orgId)
          .eq('is_active', true)
          .order('sequence_order'),
        supabase
          .from('users')
          .select('*')
          .eq('org_id', orgId)
          .eq('is_active', true)
          .in('role', ['staff', 'supervisor']),
        supabase
          .from('shifts')
          .select('*')
          .eq('org_id', orgId)
          .eq('is_active', true)
      ])

      setRooms(roomsRes.data || [])
      setActivities(activitiesRes.data || [])
      setStaff(staffRes.data || [])
      setShifts(shiftsRes.data || [])

      // Fetch existing assignments for manage view
      if (viewMode === 'manage') {
        const { data: assignmentsData, error } = await supabase
          .from('room_assignments')
          .select(`
            *,
            rooms(room_number, floor, room_type),
            shifts(name, start_time, end_time),
            activity_assignments(
              id,
              activity_id,
              assigned_to,
              status,
              housekeeping_activities(name),
              users:assigned_to(full_name)
            )
          `)
          .eq('org_id', orgId)
          .gte('assignment_date', new Date().toISOString().split('T')[0])
          .order('created_at', { ascending: false })
          .limit(50)

        if (!error) {
          setExistingAssignments(assignmentsData || [])
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleRoom = (roomId) => {
    setSelectedRooms(prev => 
      prev.includes(roomId) 
        ? prev.filter(id => id !== roomId)
        : [...prev, roomId]
    )
  }

  const toggleActivity = (activityId) => {
    setSelectedActivities(prev => 
      prev.includes(activityId) 
        ? prev.filter(id => id !== activityId)
        : [...prev, activityId]
    )
  }

  const selectAllRooms = () => {
    setSelectedRooms(rooms.map(r => r.id))
  }

  const selectAllActivities = () => {
    setSelectedActivities(activities.map(a => a.id))
  }

  const handleSubmit = async () => {
    try {
      // Create room assignments for each selected room
      const roomAssignments = selectedRooms.map(roomId => ({
        org_id: orgId,
        room_id: roomId,
        assignment_type: assignmentData.assignment_type,
        assigned_by: user.id,
        shift_id: assignmentData.shift_id,
        target_completion_time: assignmentData.target_completion_time || null,
        notes: assignmentData.notes
      }))

      const { data: createdAssignments, error: assignmentError } = await supabase
        .from('room_assignments')
        .insert(roomAssignments)
        .select()

      if (assignmentError) throw assignmentError

      // Create activity assignments for each room assignment
      const activityAssignments = []
      createdAssignments.forEach(roomAssignment => {
        selectedActivities.forEach(activityId => {
          const assignedStaffId = activityStaffMap[activityId]
          if (assignedStaffId) {
            activityAssignments.push({
              room_assignment_id: roomAssignment.id,
              activity_id: activityId,
              assigned_to: assignedStaffId
            })
          }
        })
      })

      const { error: activityError } = await supabase
        .from('activity_assignments')
        .insert(activityAssignments)

      if (activityError) throw activityError

      alert(t('assignmentCreated'))
      
      // Reset
      setSelectedRooms([])
      setSelectedActivities([])
      setActivityStaffMap({})
      setAssignmentData({
        assignment_type: 'before_arrival',
        shift_id: null,
        target_completion_time: '',
        notes: ''
      })
      setStep(1)
      setViewMode('manage') // Switch to manage view after creation
      fetchData()
    } catch (error) {
      console.error('Error creating assignments:', error)
      alert('Error creating assignments: ' + error.message)
    }
  }

  const handleDeleteAssignment = async (assignmentId) => {
    if (!confirm('Are you sure you want to delete this assignment? All related activity assignments will also be deleted.')) {
      return
    }

    try {
      // Delete activity assignments first
      await supabase
        .from('activity_assignments')
        .delete()
        .eq('room_assignment_id', assignmentId)

      // Delete room assignment
      const { error } = await supabase
        .from('room_assignments')
        .delete()
        .eq('id', assignmentId)

      if (error) throw error

      alert('Assignment deleted successfully')
      fetchData()
    } catch (error) {
      console.error('Error deleting assignment:', error)
      alert('Error deleting assignment: ' + error.message)
    }
  }

  const handleCancelAssignment = async (assignmentId) => {
    if (!confirm('Are you sure you want to cancel this assignment?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('room_assignments')
        .update({ status: 'cancelled' })
        .eq('id', assignmentId)

      if (error) throw error

      alert('Assignment cancelled successfully')
      fetchData()
    } catch (error) {
      console.error('Error cancelling assignment:', error)
      alert('Error cancelling assignment: ' + error.message)
    }
  }
      
    } catch (error) {
      console.error('Error creating assignments:', error)
      alert(t('error') + ': ' + error.message)
    }
  }

  if (loading) {
    return <div className="text-center py-12">{t('loading')}</div>
  }

  return (
    <div className="space-y-6">
      {/* Header with View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('bulkAssignment')}</h1>
          <p className="text-sm text-gray-600 mt-1">
            {viewMode === 'create' ? `${t('assignRooms')} - Step ${step}/4` : 'Manage existing assignments'}
          </p>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => { setViewMode('create'); setStep(1); }}
            className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
              viewMode === 'create'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Plus className="w-4 h-4" />
            Create New
          </button>
          <button
            onClick={() => setViewMode('manage')}
            className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
              viewMode === 'manage'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <List className="w-4 h-4" />
            Manage Existing
          </button>
        </div>
      </div>

      {/* Manage Existing Assignments View */}
      {viewMode === 'manage' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Existing Assignments</h2>
            
            {existingAssignments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No assignments found</p>
                <p className="text-sm text-gray-500 mt-1">Create new assignments to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {existingAssignments.map(assignment => (
                  <div key={assignment.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Home className="w-5 h-5 text-blue-600" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            Room {assignment.rooms?.room_number}
                          </h3>
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                            assignment.status === 'completed' ? 'bg-green-100 text-green-800' :
                            assignment.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            assignment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {assignment.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                          <div>
                            <span className="font-medium">Type:</span> {assignment.assignment_type?.replace(/_/g, ' ')}
                          </div>
                          <div>
                            <span className="font-medium">Date:</span> {new Date(assignment.assignment_date).toLocaleDateString()}
                          </div>
                          {assignment.shifts && (
                            <div>
                              <span className="font-medium">Shift:</span> {assignment.shifts.name}
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Completion:</span> {assignment.completion_percentage || 0}%
                          </div>
                        </div>

                        {assignment.activity_assignments && assignment.activity_assignments.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-sm font-medium text-gray-700 mb-2">Activities ({assignment.activity_assignments.length}):</p>
                            <div className="flex flex-wrap gap-2">
                              {assignment.activity_assignments.map(aa => (
                                <div key={aa.id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-sm">
                                  <Activity className="w-4 h-4 text-gray-400" />
                                  <span>{aa.housekeeping_activities?.name}</span>
                                  <span className="text-gray-400">→</span>
                                  <User className="w-4 h-4 text-blue-500" />
                                  <span className="font-medium">{aa.users?.full_name}</span>
                                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                                    aa.status === 'completed' ? 'bg-green-100 text-green-700' :
                                    aa.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {aa.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {assignment.notes && (
                          <div className="mt-2 text-sm text-gray-600 italic">
                            Note: {assignment.notes}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        {assignment.status === 'pending' && (
                          <button
                            onClick={() => handleCancelAssignment(assignment.id)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Cancel Assignment"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAssignment(assignment.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Assignment"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress Steps - Only show in create mode */}
      {viewMode === 'create' && (
        <div className="flex items-center gap-4">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {s}
              </div>
              {s < 4 && <ChevronRight className="w-5 h-5 text-gray-400" />}
            </div>
          ))}
        </div>
      )}

      {/* Step 1: Select Rooms - Only show in create mode */}
      {viewMode === 'create' && step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t('selectRooms')}</h2>
            <div className="flex gap-3">
              <button
                onClick={selectAllRooms}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {t('selectAll')}
              </button>
              <span className="px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg">
                {selectedRooms.length} {t('roomsSelected')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => toggleRoom(room.id)}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  selectedRooms.includes(room.id)
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <Home className="w-5 h-5 text-gray-400" />
                  {selectedRooms.includes(room.id) ? (
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-300" />
                  )}
                </div>
                <div className="font-semibold text-lg">{room.room_number}</div>
                <div className="text-sm text-gray-600">{room.room_type}</div>
              </button>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={selectedRooms.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {t('next')}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Select Activities - Only show in create mode */}
      {viewMode === 'create' && step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t('selectActivities')}</h2>
            <div className="flex gap-3">
              <button
                onClick={selectAllActivities}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {t('selectAll')}
              </button>
              <span className="px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg">
                {selectedActivities.length} {t('activitiesSelected')}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {activities.map((activity) => (
              <button
                key={activity.id}
                onClick={() => toggleActivity(activity.id)}
                className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                  selectedActivities.includes(activity.id)
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  {selectedActivities.includes(activity.id) ? (
                    <CheckSquare className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-300 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{activity.name}</span>
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                        {activity.code}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        {activity.estimated_minutes} {t('minutes')}
                      </span>
                    </div>
                    {activity.description && (
                      <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {t('back')}
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={selectedActivities.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {t('next')}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Assign Staff & Details - Only show in create mode */}
      {viewMode === 'create' && step === 3 && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">{t('assignToStaff')}</h2>

          {/* Assignment Details */}
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('assignmentType')}
                </label>
                <select
                  value={assignmentData.assignment_type}
                  onChange={(e) => setAssignmentData({ ...assignmentData, assignment_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="before_arrival">{t('beforeArrival')}</option>
                  <option value="occupied">{t('occupied')}</option>
                  <option value="preventive_maintenance">{t('preventiveMaintenance')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('selectShift')}
                </label>
                <select
                  value={assignmentData.shift_id || ''}
                  onChange={(e) => setAssignmentData({ ...assignmentData, shift_id: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t('selectShift')}</option>
                  {shifts.map((shift) => (
                    <option key={shift.id} value={shift.id}>
                      {shift.name} ({shift.start_time} - {shift.end_time})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('targetTime')}
              </label>
              <input
                type="datetime-local"
                value={assignmentData.target_completion_time}
                onChange={(e) => setAssignmentData({ ...assignmentData, target_completion_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('notes')}
              </label>
              <textarea
                value={assignmentData.notes}
                onChange={(e) => setAssignmentData({ ...assignmentData, notes: e.target.value })}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Staff Assignment for Each Activity */}
          <div className="space-y-3">
            <h3 className="font-medium">{t('selectStaff')}</h3>
            {activities.filter(a => selectedActivities.includes(a.id)).map((activity) => (
              <div key={activity.id} className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg">
                <Activity className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-medium">{activity.name}</div>
                  <div className="text-sm text-gray-600">{activity.code}</div>
                </div>
                <select
                  value={activityStaffMap[activity.id] || ''}
                  onChange={(e) => setActivityStaffMap({ ...activityStaffMap, [activity.id]: e.target.value })}
                  className="w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t('selectStaff')}</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.role})
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {t('back')}
            </button>
            <button
              onClick={() => setStep(4)}
              disabled={!Object.keys(activityStaffMap).length}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {t('next')}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Review & Submit - Only show in create mode */}
      {viewMode === 'create' && step === 4 && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">{t('review')}</h2>

          <div className="grid grid-cols-3 gap-6">
            {/* Rooms Summary */}
            <div className="bg-white p-6 border border-gray-200 rounded-lg">
              <h3 className="font-medium mb-3">{t('selectedRooms')}</h3>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {selectedRooms.length}
              </div>
              <div className="text-sm text-gray-600">
                {rooms.filter(r => selectedRooms.includes(r.id)).map(r => r.room_number).join(', ')}
              </div>
            </div>

            {/* Activities Summary */}
            <div className="bg-white p-6 border border-gray-200 rounded-lg">
              <h3 className="font-medium mb-3">{t('selectedActivities')}</h3>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {selectedActivities.length}
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                {activities.filter(a => selectedActivities.includes(a.id)).map(a => (
                  <div key={a.id}>{a.name}</div>
                ))}
              </div>
            </div>

            {/* Total Assignments */}
            <div className="bg-white p-6 border border-gray-200 rounded-lg">
              <h3 className="font-medium mb-3">{t('totalAssignments')}</h3>
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {selectedRooms.length * selectedActivities.length}
              </div>
              <div className="text-sm text-gray-600">
                {selectedRooms.length} {t('rooms')} × {selectedActivities.length} {t('activities')}
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setStep(3)}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {t('back')}
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Save className="w-5 h-5" />
              {t('createAssignments')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
