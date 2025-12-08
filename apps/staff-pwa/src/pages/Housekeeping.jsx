import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Plus, Search, CheckCircle, Clock, AlertCircle, RefreshCw, Eye, User, Calendar, X, UserPlus, Edit2, Trash2 } from 'lucide-react'
import Select from 'react-select'
import { customSelectStyles } from '../utils/selectStyles'

export default function Housekeeping({ user }) {
  const [tasks, setTasks] = useState([])
  const [rooms, setRooms] = useState([])
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [modalMode, setModalMode] = useState('add')
  const [taskData, setTaskData] = useState({
    room_id: '',
    assigned_to: '',
    task_type: 'cleaning',
    priority: 'normal',
    scheduled_date: new Date().toISOString().split('T')[0],
    notes: ''
  })

  useEffect(() => {
    if (user?.org_id) {
      fetchData()
      const interval = setInterval(() => fetchData(true), 30000)
      return () => clearInterval(interval)
    }
  }, [user?.org_id])

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [tasksRes, roomsRes, staffRes] = await Promise.all([
        supabase
          .from('housekeeping_tasks')
          .select('*, rooms(room_number, floor)')
          .eq('org_id', user.org_id)
          .order('scheduled_date', { ascending: false }),
        supabase.from('rooms').select('*').eq('org_id', user.org_id).order('room_number'),
        supabase.from('users').select('*').eq('org_id', user.org_id).in('role', ['staff', 'housekeeping', 'supervisor']).order('full_name')
      ])

      setTasks(tasksRes.data || [])
      setRooms(roomsRes.data || [])
      setStaff(staffRes.data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignTask = async (e) => {
    e.preventDefault()
    
    try {
      const { error } = await supabase
        .from('housekeeping_tasks')
        .insert([{
          org_id: user.org_id,
          room_id: taskData.room_id,
          assigned_to: taskData.assigned_to,
          task_type: taskData.task_type,
          priority: taskData.priority,
          status: 'pending',
          scheduled_date: taskData.scheduled_date,
          notes: taskData.notes,
          created_by: user.id
        }])

      if (error) throw error

      setTaskData({
        room_id: '',
        assigned_to: '',
        task_type: 'cleaning',
        priority: 'normal',
        scheduled_date: new Date().toISOString().split('T')[0],
        notes: ''
      })
      
      setShowAssignModal(false)
      fetchData()
      alert('Task assigned successfully')
    } catch (error) {
      console.error('Error assigning task:', error)
      alert('Failed to assign task: ' + error.message)
    }
  }

  const handleEdit = (task) => {
    setSelectedTask(task)
    setModalMode('edit')
    setTaskData({
      room_id: task.room_id,
      assigned_to: task.assigned_to || '',
      task_type: task.task_type,
      priority: task.priority,
      scheduled_date: task.scheduled_date,
      notes: task.notes || ''
    })
    setShowAssignModal(true)
  }

  const handleView = (task) => {
    console.log('handleView called with task:', task)
    setSelectedTask(task)
    setShowViewModal(true)
    console.log('showViewModal set to true')
  }

  const handleDelete = async (task) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      const { error } = await supabase
        .from('housekeeping_tasks')
        .delete()
        .eq('id', task.id)

      if (error) throw error
      alert('Task deleted successfully')
      fetchData()
    } catch (error) {
      console.error('Error deleting task:', error)
      alert('Failed to delete task: ' + error.message)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    
    try {
      const { error } = await supabase
        .from('housekeeping_tasks')
        .update({
          room_id: taskData.room_id,
          assigned_to: taskData.assigned_to,
          task_type: taskData.task_type,
          priority: taskData.priority,
          scheduled_date: taskData.scheduled_date,
          notes: taskData.notes
        })
        .eq('id', selectedTask.id)

      if (error) throw error

      setTaskData({
        room_id: '',
        assigned_to: '',
        task_type: 'cleaning',
        priority: 'normal',
        scheduled_date: new Date().toISOString().split('T')[0],
        notes: ''
      })
      
      setShowAssignModal(false)
      setSelectedTask(null)
      setModalMode('add')
      fetchData()
      alert('Task updated successfully')
    } catch (error) {
      console.error('Error updating task:', error)
      alert('Failed to update task: ' + error.message)
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
      completed: 'bg-green-100 text-green-700 border-green-200',
      pending_inspection: 'bg-purple-100 text-purple-700 border-purple-200',
    }
    return styles[status] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.rooms?.room_number?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const stats = {
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    total: tasks.length
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div></div>
  }

  return (
    <div className="space-y-6">
      {/* Header with Assign Button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Housekeeping Tasks</h1>
        {(user.role === 'admin' || user.role === 'super_admin' || user.role === 'supervisor') && (
          <button
            onClick={() => setShowAssignModal(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Assign New Task
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Tasks', value: stats.total, color: 'from-blue-500 to-blue-600', icon: Calendar },
          { label: 'Pending', value: stats.pending, color: 'from-yellow-500 to-yellow-600', icon: Clock },
          { label: 'In Progress', value: stats.in_progress, color: 'from-purple-500 to-purple-600', icon: AlertCircle },
          { label: 'Completed', value: stats.completed, color: 'from-green-500 to-green-600', icon: CheckCircle },
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

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by room number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <Select
            value={{ value: filterStatus, label: filterStatus === 'all' ? 'All Status' : filterStatus.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') }}
            onChange={(option) => setFilterStatus(option?.value || 'all')}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'pending', label: 'Pending' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
              { value: 'pending_inspection', label: 'Pending Inspection' }
            ]}
            styles={customSelectStyles}
            isSearchable
            className="min-w-[180px]"
          />
          <button
            onClick={() => fetchData()}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Room</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Task Type</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Priority</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Scheduled</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTasks.map(task => (
                <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{task.rooms?.room_number || 'N/A'}</div>
                    <div className="text-xs text-gray-500">Floor {task.rooms?.floor}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize">{task.task_type?.replace('_', ' ')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full border ${getStatusBadge(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium capitalize ${
                      task.priority === 'urgent' ? 'text-red-600' :
                      task.priority === 'high' ? 'text-orange-600' :
                      task.priority === 'normal' ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{new Date(task.scheduled_date).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleView(task)}
                        className="text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleEdit(task)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(task)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No housekeeping tasks found</p>
        </div>
      )}

      {/* Assign/Edit Task Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserPlus className="w-6 h-6 text-white" />
                <h2 className="text-xl font-bold text-white">{modalMode === 'edit' ? 'Edit Task' : 'Assign New Task'}</h2>
              </div>
              <button
                onClick={() => {
                  setShowAssignModal(false)
                  setSelectedTask(null)
                  setModalMode('add')
                }}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={modalMode === 'edit' ? handleUpdate : handleAssignTask} className="p-6 space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-blue-800 text-sm">{modalMode === 'edit' ? 'Update task details below' : 'Assign housekeeping tasks to staff members'}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Room *</label>
                  <Select
                    value={rooms.find(r => r.id === taskData.room_id) ? {
                      value: taskData.room_id,
                      label: `${rooms.find(r => r.id === taskData.room_id).room_number} - ${rooms.find(r => r.id === taskData.room_id).room_type} (Floor ${rooms.find(r => r.id === taskData.room_id).floor})`
                    } : null}
                    onChange={(option) => setTaskData({ ...taskData, room_id: option?.value || '' })}
                    options={rooms.map(room => ({
                      value: room.id,
                      label: `${room.room_number} - ${room.room_type} (Floor ${room.floor})`
                    }))}
                    placeholder="Choose a room..."
                    styles={customSelectStyles}
                    isSearchable
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Assign To Staff *</label>
                  <Select
                    value={staff.find(s => s.id === taskData.assigned_to) ? {
                      value: taskData.assigned_to,
                      label: `${staff.find(s => s.id === taskData.assigned_to).full_name} - ${staff.find(s => s.id === taskData.assigned_to).role}`
                    } : null}
                    onChange={(option) => setTaskData({ ...taskData, assigned_to: option?.value || '' })}
                    options={staff.map(member => ({
                      value: member.id,
                      label: `${member.full_name} - ${member.role}`
                    }))}
                    placeholder="Choose a staff member..."
                    styles={customSelectStyles}
                    isSearchable
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Task Type *</label>
                  <Select
                    value={{ value: taskData.task_type, label: taskData.task_type.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') }}
                    onChange={(option) => setTaskData({ ...taskData, task_type: option?.value || 'cleaning' })}
                    options={[
                      { value: 'cleaning', label: 'Cleaning' },
                      { value: 'deep_cleaning', label: 'Deep Cleaning' },
                      { value: 'turndown', label: 'Turndown Service' },
                      { value: 'inspection', label: 'Inspection' }
                    ]}
                    styles={customSelectStyles}
                    isSearchable
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Priority *</label>
                  <Select
                    value={{ value: taskData.priority, label: taskData.priority.charAt(0).toUpperCase() + taskData.priority.slice(1) }}
                    onChange={(option) => setTaskData({ ...taskData, priority: option?.value || 'normal' })}
                    options={[
                      { value: 'low', label: 'Low' },
                      { value: 'normal', label: 'Normal' },
                      { value: 'high', label: 'High' },
                      { value: 'urgent', label: 'Urgent' }
                    ]}
                    styles={customSelectStyles}
                    isSearchable
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Scheduled Date *</label>
                  <input
                    type="date"
                    value={taskData.scheduled_date}
                    onChange={(e) => setTaskData({ ...taskData, scheduled_date: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                <textarea
                  value={taskData.notes}
                  onChange={(e) => setTaskData({ ...taskData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Optional notes..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignModal(false)
                    setSelectedTask(null)
                    setModalMode('add')
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-5 h-5" />
                  {modalMode === 'edit' ? 'Update Task' : 'Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Task Modal */}
      {showViewModal && selectedTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-gray-700 to-gray-800 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="w-6 h-6 text-white" />
                <h2 className="text-xl font-bold text-white">Task Details</h2>
              </div>
              <button
                onClick={() => {
                  setShowViewModal(false)
                  setSelectedTask(null)
                }}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Room Number</label>
                  <p className="text-lg font-bold text-gray-900">{selectedTask.rooms?.room_number || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Floor</label>
                  <p className="text-lg font-bold text-gray-900">{selectedTask.rooms?.floor || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Task Type</label>
                  <p className="text-lg font-bold text-gray-900 capitalize">{selectedTask.task_type?.replace('_', ' ')}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Priority</label>
                  <p className={`text-lg font-bold capitalize ${
                    selectedTask.priority === 'urgent' ? 'text-red-600' :
                    selectedTask.priority === 'high' ? 'text-orange-600' :
                    'text-blue-600'
                  }`}>{selectedTask.priority}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Status</label>
                  <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full border ${getStatusBadge(selectedTask.status)}`}>
                    {selectedTask.status.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Scheduled Date</label>
                  <p className="text-lg font-bold text-gray-900">{new Date(selectedTask.scheduled_date).toLocaleDateString()}</p>
                </div>
              </div>
              
              {selectedTask.notes && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Notes</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedTask.notes}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowViewModal(false)
                    handleEdit(selectedTask)
                  }}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Edit Task
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false)
                    setSelectedTask(null)
                  }}
                  className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
