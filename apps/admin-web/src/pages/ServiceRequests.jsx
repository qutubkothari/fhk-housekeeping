import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/stores/authStore'
import { 
  Plus, Search, Filter, RefreshCw, Edit2, Eye, Trash2, 
  Clock, AlertTriangle, CheckCircle, XCircle, User, 
  Home, Calendar, FileText, Tag, Activity
} from 'lucide-react'

export default function ServiceRequests() {
  const { t } = useTranslation()
  const { orgId, user } = useAuthStore()

  const [requests, setRequests] = useState([])
  const [rooms, setRooms] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('add') // add, edit, view
  const [selectedRequest, setSelectedRequest] = useState(null)

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    in_progress: 0,
    resolved: 0
  })

  // Form state
  const [formData, setFormData] = useState({
    room_id: '',
    request_type: 'guest_request',
    category: '',
    title: '',
    description: '',
    priority: 'normal',
    assigned_to: '',
    estimated_time: ''
  })

  useEffect(() => {
    fetchData()
    fetchRooms()
    fetchUsers()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchData(true)
    }, 30000)
    
    return () => clearInterval(interval)
  }, [orgId])

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          *,
          room:rooms(room_number, floor, room_type),
          reporter:reported_by(full_name, email),
          assignee:assigned_to(full_name, email)
        `)
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setRequests(data || [])
      calculateStats(data || [])
    } catch (error) {
      console.error('Error fetching service requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('id, room_number, floor, room_type')
        .eq('org_id', orgId)
        .eq('is_active', true)
        .order('room_number')

      if (error) throw error
      setRooms(data || [])
    } catch (error) {
      console.error('Error fetching rooms:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, role')
        .eq('org_id', orgId)
        .eq('is_active', true)
        .in('role', ['staff', 'supervisor', 'maintenance'])
        .order('full_name')

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const calculateStats = (data) => {
    setStats({
      total: data.length,
      open: data.filter(r => r.status === 'open' || r.status === 'assigned').length,
      in_progress: data.filter(r => r.status === 'in_progress').length,
      resolved: data.filter(r => r.status === 'resolved' || r.status === 'closed').length
    })
  }

  const handleAdd = () => {
    setModalMode('add')
    setSelectedRequest(null)
    setFormData({
      room_id: '',
      request_type: 'guest_request',
      category: '',
      title: '',
      description: '',
      priority: 'normal',
      assigned_to: '',
      estimated_time: ''
    })
    setShowModal(true)
  }

  const handleEdit = (request) => {
    setModalMode('edit')
    setSelectedRequest(request)
    setFormData({
      room_id: request.room_id,
      request_type: request.request_type,
      category: request.category,
      title: request.title,
      description: request.description || '',
      priority: request.priority,
      assigned_to: request.assigned_to || '',
      estimated_time: request.estimated_time || ''
    })
    setShowModal(true)
  }

  const handleView = (request) => {
    setModalMode('view')
    setSelectedRequest(request)
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm(t('confirm_delete'))) return

    try {
      const { error } = await supabase
        .from('service_requests')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchData()
    } catch (error) {
      console.error('Error deleting request:', error)
      alert('Failed to delete request')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (modalMode === 'add') {
        const { error } = await supabase
          .from('service_requests')
          .insert({
            org_id: orgId,
            reported_by: user.id,
            ...formData,
            status: formData.assigned_to ? 'assigned' : 'open'
          })

        if (error) throw error
      } else if (modalMode === 'edit') {
        const { error } = await supabase
          .from('service_requests')
          .update(formData)
          .eq('id', selectedRequest.id)

        if (error) throw error
      }

      setShowModal(false)
      fetchData()
    } catch (error) {
      console.error('Error saving request:', error)
      alert('Failed to save request')
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      const updates = { status: newStatus }
      
      if (newStatus === 'resolved') {
        updates.resolved_at = new Date().toISOString()
      } else if (newStatus === 'closed') {
        updates.closed_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('service_requests')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      fetchData()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    }
  }

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.room?.room_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.category?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === 'all' || request.status === filterStatus
    const matchesPriority = filterPriority === 'all' || request.priority === filterPriority
    const matchesType = filterType === 'all' || request.request_type === filterType

    return matchesSearch && matchesStatus && matchesPriority && matchesType
  })

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      normal: 'bg-blue-100 text-blue-800',
      low: 'bg-gray-100 text-gray-800'
    }
    return colors[priority] || 'bg-gray-100 text-gray-800'
  }

  const getTypeColor = (type) => {
    const colors = {
      guest_request: 'bg-green-100 text-green-800',
      breakdown: 'bg-red-100 text-red-800',
      maintenance: 'bg-orange-100 text-orange-800',
      housekeeping: 'bg-blue-100 text-blue-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('service_requests')}</h1>
          <p className="text-gray-600 mt-1">Manage guest requests and maintenance issues</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Request
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Open/Assigned</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.open}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{stats.in_progress}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.resolved}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="guest_request">Guest Request</option>
            <option value="breakdown">Breakdown</option>
            <option value="maintenance">Maintenance</option>
            <option value="housekeeping">Housekeeping</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={() => fetchData()}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Request
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Room
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    No service requests found
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{request.title}</div>
                        <div className="text-sm text-gray-500">{request.category}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{request.room?.room_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(request.request_type)}`}>
                        <Tag className="w-3 h-3" />
                        {request.request_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                        {request.priority === 'urgent' && <AlertTriangle className="w-3 h-3" />}
                        {request.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={request.status}
                        onChange={(e) => handleStatusChange(request.id, e.target.value)}
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium border-0 cursor-pointer ${getStatusColor(request.status)}`}
                      >
                        <option value="open">Open</option>
                        <option value="assigned">Assigned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {request.assignee ? (
                          <>
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{request.assignee.full_name}</span>
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">Unassigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        {formatDate(request.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleView(request)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(request)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(request.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {modalMode === 'add' ? 'Add Service Request' : modalMode === 'edit' ? 'Edit Service Request' : 'View Service Request'}
              </h2>
            </div>

            {modalMode === 'view' ? (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Room</label>
                    <p className="mt-1 text-gray-900">{selectedRequest.room?.room_number}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Request Type</label>
                    <p className="mt-1">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(selectedRequest.request_type)}`}>
                        {selectedRequest.request_type.replace('_', ' ')}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Category</label>
                    <p className="mt-1 text-gray-900">{selectedRequest.category}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Priority</label>
                    <p className="mt-1">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(selectedRequest.priority)}`}>
                        {selectedRequest.priority}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <p className="mt-1">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                        {selectedRequest.status}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Assigned To</label>
                    <p className="mt-1 text-gray-900">{selectedRequest.assignee?.full_name || 'Unassigned'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Reported By</label>
                    <p className="mt-1 text-gray-900">{selectedRequest.reporter?.full_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Created</label>
                    <p className="mt-1 text-gray-900">{formatDate(selectedRequest.created_at)}</p>
                  </div>
                  {selectedRequest.estimated_time && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Estimated Time</label>
                      <p className="mt-1 text-gray-900">{selectedRequest.estimated_time} minutes</p>
                    </div>
                  )}
                  {selectedRequest.resolved_at && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Resolved At</label>
                      <p className="mt-1 text-gray-900">{formatDate(selectedRequest.resolved_at)}</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Title</label>
                  <p className="mt-1 text-gray-900">{selectedRequest.title}</p>
                </div>
                {selectedRequest.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <p className="mt-1 text-gray-900 whitespace-pre-wrap">{selectedRequest.description}</p>
                  </div>
                )}
                {selectedRequest.resolution_notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Resolution Notes</label>
                    <p className="mt-1 text-gray-900 whitespace-pre-wrap">{selectedRequest.resolution_notes}</p>
                  </div>
                )}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Room */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Room *
                    </label>
                    <select
                      required
                      value={formData.room_id}
                      onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select room</option>
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.room_number} - {room.room_type}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Request Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Request Type *
                    </label>
                    <select
                      required
                      value={formData.request_type}
                      onChange={(e) => setFormData({ ...formData, request_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="guest_request">Guest Request</option>
                      <option value="breakdown">Breakdown</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="housekeeping">Housekeeping</option>
                    </select>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., ac_issue, extra_towels"
                    />
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority *
                    </label>
                    <select
                      required
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  {/* Assigned To */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assign To
                    </label>
                    <select
                      value={formData.assigned_to}
                      onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Unassigned</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.full_name} ({user.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Estimated Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Time (minutes)
                    </label>
                    <input
                      type="number"
                      value={formData.estimated_time}
                      onChange={(e) => setFormData({ ...formData, estimated_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="30"
                    />
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief title of the request"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Detailed description..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {modalMode === 'add' ? 'Create Request' : 'Update Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
