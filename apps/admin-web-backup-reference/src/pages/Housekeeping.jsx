import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/stores/authStore'
import { Plus, Search, Edit2, Trash2, Eye, RefreshCw, CheckCircle, Clock, AlertCircle, User } from 'lucide-react'
import InspectionModal from '@/components/InspectionModal'

export default function Housekeeping() {
  const { t } = useTranslation()
  const { orgId, user } = useAuthStore()
  
  const [tasks, setTasks] = useState([])
  const [rooms, setRooms] = useState([])
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('add')
  const [selectedTask, setSelectedTask] = useState(null)
  const [showInspectionModal, setShowInspectionModal] = useState(false)
  const [taskToInspect, setTaskToInspect] = useState(null)
  const [formData, setFormData] = useState({
    room_id: '',
    assigned_to: '',
    task_type: 'regular_cleaning',
    priority: 'normal',
    status: 'pending',
    scheduled_date: new Date().toISOString().split('T')[0],
    notes: ''
  })

  const taskTypes = ['regular_cleaning', 'checkout_cleaning', 'deep_cleaning', 'inspection', 'maintenance']
  const priorities = ['low', 'normal', 'high', 'urgent']
  const statuses = ['pending', 'in_progress', 'completed', 'pending_inspection', 'inspected', 'failed_inspection']

  useEffect(() => {
    if (orgId) {
      fetchData()
      
      const interval = setInterval(() => {
        fetchData(true)
      }, 30000)
      
      return () => clearInterval(interval)
    }
  }, [orgId])

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      else setRefreshing(true)

      const [tasksRes, roomsRes, staffRes] = await Promise.all([
        supabase
          .from('housekeeping_tasks')
          .select(`
            *,
            rooms (room_number, floor, room_type),
            assigned:users!housekeeping_tasks_assigned_to_fkey (full_name, full_name_ar),
            assignedBy:users!housekeeping_tasks_assigned_by_fkey (full_name)
          `)
          .eq('org_id', orgId)
          .order('scheduled_date', { ascending: false })
          .order('priority', { ascending: false }),
        
        supabase
          .from('rooms')
          .select('id, room_number, floor, room_type')
          .eq('org_id', orgId)
          .order('room_number'),
        
        supabase
          .from('users')
          .select('id, full_name, full_name_ar, role')
          .eq('org_id', orgId)
          .in('role', ['staff', 'supervisor'])
          .eq('is_active', true)
      ])

      if (tasksRes.error) throw tasksRes.error
      if (roomsRes.error) throw roomsRes.error
      if (staffRes.error) throw staffRes.error

      setTasks(tasksRes.data || [])
      setRooms(roomsRes.data || [])
      setStaff(staffRes.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      if (!silent) alert(t('Failed to fetch data'))
    } finally {
      if (!silent) setLoading(false)
      else setRefreshing(false)
    }
  }

  const handleManualRefresh = () => {
    fetchData()
  }

  const handleAdd = () => {
    setModalMode('add')
    setSelectedTask(null)
    setFormData({
      room_id: '',
      assigned_to: '',
      task_type: 'regular_cleaning',
      priority: 'normal',
      status: 'pending',
      scheduled_date: new Date().toISOString().split('T')[0],
      notes: ''
    })
    setShowModal(true)
  }

  const handleEdit = (task) => {
    setModalMode('edit')
    setSelectedTask(task)
    setFormData({
      room_id: task.room_id,
      assigned_to: task.assigned_to,
      task_type: task.task_type,
      priority: task.priority,
      status: task.status,
      scheduled_date: task.scheduled_date,
      notes: task.notes || ''
    })
    setShowModal(true)
  }

  const handleView = (task) => {
    setModalMode('view')
    setSelectedTask(task)
    setFormData({
      room_id: task.room_id,
      assigned_to: task.assigned_to,
      task_type: task.task_type,
      priority: task.priority,
      status: task.status,
      scheduled_date: task.scheduled_date,
      notes: task.notes || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (task) => {
    if (!confirm(t('Are you sure you want to delete this task?'))) return

    try {
      const { error } = await supabase
        .from('housekeeping_tasks')
        .delete()
        .eq('id', task.id)

      if (error) throw error
      alert(t('Task deleted successfully'))
      fetchData()
    } catch (error) {
      console.error('Error deleting task:', error)
      alert(t('Failed to delete task'))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (modalMode === 'add') {
        const { error } = await supabase
          .from('housekeeping_tasks')
          .insert([{ 
            ...formData, 
            org_id: orgId,
            assigned_by: user.id
          }])

        if (error) throw error
        alert(t('Task created successfully'))
      } else if (modalMode === 'edit') {
        const { error } = await supabase
          .from('housekeeping_tasks')
          .update(formData)
          .eq('id', selectedTask.id)

        if (error) throw error
        alert(t('Task updated successfully'))
      }

      setShowModal(false)
      fetchData()
    } catch (error) {
      console.error('Error saving task:', error)
      alert(t('Failed to save task'))
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      inspected: 'bg-purple-100 text-purple-800',
      failed: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-gray-600',
      normal: 'text-blue-600',
      high: 'text-orange-600',
      urgent: 'text-red-600'
    }
    return colors[priority] || 'text-gray-600'
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return CheckCircle
      case 'in_progress': return Clock
      case 'failed': return AlertCircle
      default: return Clock
    }
  }

  const filteredTasks = tasks.filter(task => {
    const room = task.rooms?.room_number || ''
    const matchesSearch = room.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.task_type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority
    return matchesSearch && matchesStatus && matchesPriority
  })

  const todayTasks = tasks.filter(t => t.scheduled_date === new Date().toISOString().split('T')[0])
  const pendingTasks = tasks.filter(t => t.status === 'pending')
  const completedTasks = tasks.filter(t => t.status === 'completed')

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('Housekeeping Tasks')}</h1>
          <p className="text-gray-600 mt-1">{t('Manage cleaning and maintenance tasks')}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            {t('Refresh')}
          </button>
          <button
            onClick={handleAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            {t('Create Task')}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">{t('Today\'s Tasks')}</p>
          <p className="text-3xl font-bold text-gray-900">{todayTasks.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
          <p className="text-sm text-gray-600">{t('Pending')}</p>
          <p className="text-3xl font-bold text-gray-900">{pendingTasks.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
          <p className="text-sm text-gray-600">{t('Completed')}</p>
          <p className="text-3xl font-bold text-gray-900">{completedTasks.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
          <p className="text-sm text-gray-600">{t('Total Tasks')}</p>
          <p className="text-3xl font-bold text-gray-900">{tasks.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t('Search tasks...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{t('All Status')}</option>
            {statuses.map(status => (
              <option key={status} value={status}>{t(status)}</option>
            ))}
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{t('All Priorities')}</option>
            {priorities.map(priority => (
              <option key={priority} value={priority}>{t(priority)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-4">{t('Loading tasks...')}</p>
        </div>
      )}

      {/* Tasks List */}
      {!loading && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('Room')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('Task Type')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('Assigned To')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('Priority')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('Status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('Scheduled Date')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('Actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTasks.map(task => {
                const StatusIcon = getStatusIcon(task.status)
                return (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {task.rooms?.room_number || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {t('Floor')} {task.rooms?.floor}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 capitalize">
                        {t(task.task_type)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {task.assigned?.full_name || 'Unassigned'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium capitalize ${getPriorityColor(task.priority)}`}>
                        {t(task.priority)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full ${getStatusColor(task.status)}`}>
                        <StatusIcon className="w-3 h-3" />
                        {t(task.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(task.scheduled_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {task.status === 'pending_inspection' && (
                          <button
                            onClick={() => {
                              setTaskToInspect(task)
                              setShowInspectionModal(true)
                            }}
                            className="text-purple-600 hover:text-purple-900"
                            title="Inspect Task"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleView(task)}
                          className="text-gray-600 hover:text-gray-900"
                          title={t('View')}
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEdit(task)}
                          className="text-blue-600 hover:text-blue-900"
                          title={t('Edit')}
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(task)}
                          className="text-red-600 hover:text-red-900"
                          title={t('Delete')}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredTasks.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-600">{t('No tasks found')}</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">
                {modalMode === 'add' && t('Create Task')}
                {modalMode === 'edit' && t('Edit Task')}
                {modalMode === 'view' && t('Task Details')}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('Room')} *
                  </label>
                  <select
                    value={formData.room_id}
                    onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                    disabled={modalMode === 'view'}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">{t('Select room')}</option>
                    {rooms.map(room => (
                      <option key={room.id} value={room.id}>
                        {room.room_number} - {t('Floor')} {room.floor}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('Assign To')} *
                  </label>
                  <select
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    disabled={modalMode === 'view'}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">{t('Select staff')}</option>
                    {staff.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.full_name} ({t(member.role)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('Task Type')} *
                  </label>
                  <select
                    value={formData.task_type}
                    onChange={(e) => setFormData({ ...formData, task_type: e.target.value })}
                    disabled={modalMode === 'view'}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    {taskTypes.map(type => (
                      <option key={type} value={type}>{t(type)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('Priority')} *
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    disabled={modalMode === 'view'}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    {priorities.map(priority => (
                      <option key={priority} value={priority}>{t(priority)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('Status')} *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    disabled={modalMode === 'view'}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    {statuses.map(status => (
                      <option key={status} value={status}>{t(status)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('Scheduled Date')} *
                  </label>
                  <input
                    type="date"
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                    disabled={modalMode === 'view'}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('Notes')}
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    disabled={modalMode === 'view'}
                    rows="3"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                >
                  {modalMode === 'view' ? t('Close') : t('Cancel')}
                </button>
                {modalMode !== 'view' && (
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {modalMode === 'add' ? t('Create Task') : t('Update Task')}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspection Modal */}
      {showInspectionModal && taskToInspect && (
        <InspectionModal
          task={taskToInspect}
          onClose={() => {
            setShowInspectionModal(false)
            setTaskToInspect(null)
            fetchTasks()
          }}
          inspectorId={user?.id}
          orgId={orgId}
        />
      )}
    </div>
  )
}
