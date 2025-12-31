import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Plus, Search, RefreshCw, Eye, AlertTriangle, CheckCircle, Clock, Wrench, X, Edit2, Trash2 } from 'lucide-react'
import Select from 'react-select'
import { customSelectStyles } from '../utils/selectStyles'
import { translations } from '../translations'

export default function ServiceRequests({ user, lang = 'en' }) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [modalMode, setModalMode] = useState('add')
  const [rooms, setRooms] = useState([])
  const [maintenanceStaff, setMaintenanceStaff] = useState([])
  const [requestData, setRequestData] = useState({
    room_id: '',
    title: '',
    description: '',
    request_type: 'maintenance',
    category: 'general',
    issues_reported: [],
    priority: 'normal',
    assigned_to: '',
    status: 'open'
  })
  
  const t = (key) => translations[key]?.[lang] || translations[key]?.en || key

  useEffect(() => {
    console.log('🟠 ServiceRequests v2.0 - WITH CREATE REQUEST BUTTON')
    if (user?.org_id) {
      fetchData()
      fetchRooms()
      fetchMaintenanceStaff()
      const interval = setInterval(() => fetchData(true), 30000)
      return () => clearInterval(interval)
    }
  }, [user?.org_id])

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const { data, error } = await supabase
        .from('service_requests')
        .select('*, rooms(room_number, floor)')
        .eq('org_id', user.org_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setRequests(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('org_id', user.org_id)
        .order('room_number')

      if (error) throw error
      setRooms(data || [])
    } catch (error) {
      console.error('Error fetching rooms:', error)
    }
  }

  const fetchMaintenanceStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('org_id', user.org_id)
        .in('role', ['maintenance', 'supervisor', 'admin', 'super_admin'])
        .order('full_name')

      if (error) throw error
      setMaintenanceStaff(data || [])
    } catch (error) {
      console.error('Error fetching staff:', error)
    }
  }

  const handleView = (request) => {
    setSelectedRequest(request)
    setShowViewModal(true)
  }

  const handleEdit = (request) => {
    setSelectedRequest(request)
    setModalMode('edit')
    setRequestData({
      room_id: request.room_id,
      title: request.title,
      description: request.description,
      request_type: request.request_type,
      category: request.category || 'general',
      issues_reported: Array.isArray(request.issues_reported) ? request.issues_reported : [],
      priority: request.priority,
      assigned_to: request.assigned_to || '',
      status: request.status || 'open'
    })
    setShowCreateModal(true)
  }

  const handleDelete = async (request) => {
    if (!confirm('Are you sure you want to delete this service request?')) return

    try {
      const { error } = await supabase
        .from('service_requests')
        .delete()
        .eq('id', request.id)

      if (error) throw error
      alert('Request deleted successfully')
      fetchData()
    } catch (error) {
      console.error('Error deleting request:', error)
      alert('Failed to delete request: ' + error.message)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    
    try {
      const updatePayload = {
        room_id: requestData.room_id,
        title: requestData.title,
        description: requestData.description,
        request_type: requestData.request_type,
        category: requestData.category,
        issues_reported: requestData.issues_reported?.length ? requestData.issues_reported : null,
        priority: requestData.priority,
        assigned_to: requestData.assigned_to || null,
        status: requestData.status,
        ...(requestData.status === 'resolved' && { resolved_at: new Date().toISOString() }),
        ...(requestData.status === 'closed' && { closed_at: new Date().toISOString() })
      }

      let { error } = await supabase
        .from('service_requests')
        .update(updatePayload)
        .eq('id', selectedRequest.id)

      // Backward compatibility if DB column not added yet
      if (error && (error.code === '42703' || String(error.message || '').toLowerCase().includes('issues_reported'))) {
        const { issues_reported, ...fallbackPayload } = updatePayload
        ;({ error } = await supabase.from('service_requests').update(fallbackPayload).eq('id', selectedRequest.id))
      }

      if (error) throw error
      
      alert('Request updated successfully')
      setShowCreateModal(false)
      setModalMode('add')
      setSelectedRequest(null)
      setRequestData({
        room_id: '',
        title: '',
        description: '',
        request_type: 'maintenance',
        category: 'general',
        issues_reported: [],
        priority: 'normal',
        assigned_to: '',
        status: 'open'
      })
      fetchData()
    } catch (error) {
      console.error('Error updating request:', error)
      alert('Failed to update request: ' + error.message)
    }
  }

  const handleCreateRequest = async (e) => {
    e.preventDefault()
    
    try {
      const insertPayload = {
        org_id: user.org_id,
        room_id: requestData.room_id,
        title: requestData.title,
        description: requestData.description,
        request_type: requestData.request_type,
        category: requestData.category,
        issues_reported: requestData.issues_reported?.length ? requestData.issues_reported : null,
        priority: requestData.priority,
        status: 'open',
        assigned_to: requestData.assigned_to || null,
        reported_by: user.id
      }

      let { error } = await supabase
        .from('service_requests')
        .insert([insertPayload])

      // Backward compatibility if DB column not added yet
      if (error && (error.code === '42703' || String(error.message || '').toLowerCase().includes('issues_reported'))) {
        const { issues_reported, ...fallbackPayload } = insertPayload
        ;({ error } = await supabase.from('service_requests').insert([fallbackPayload]))
      }

      if (error) throw error

      setRequestData({
        room_id: '',
        title: '',
        description: '',
        request_type: 'maintenance',
        category: 'general',
        issues_reported: [],
        priority: 'normal',
        assigned_to: '',
        status: 'open'
      })
      
      setShowCreateModal(false)
      fetchData()
      alert('Service request created successfully')
    } catch (error) {
      console.error('Error creating request:', error)
      alert('Failed to create request: ' + error.message)
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
      resolved: 'bg-green-100 text-green-700 border-green-200',
      cancelled: 'bg-gray-100 text-gray-700 border-gray-200',
    }
    return styles[status] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'text-red-600',
      high: 'text-orange-600',
      normal: 'text-blue-600',
      low: 'text-gray-600',
    }
    return colors[priority] || 'text-gray-600'
  }

  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         req.rooms?.room_number?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus
    const matchesPriority = filterPriority === 'all' || req.priority === filterPriority
    return matchesSearch && matchesStatus && matchesPriority
  })

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    in_progress: requests.filter(r => r.status === 'in_progress').length,
    resolved: requests.filter(r => r.status === 'resolved').length,
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div></div>
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Service Requests</h1>
        {(user.role === 'admin' || user.role === 'super_admin' || user.role === 'front_desk') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-4 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Request
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Requests', value: stats.total, color: 'from-blue-500 to-blue-600', icon: Wrench },
          { label: 'Pending', value: stats.pending, color: 'from-yellow-500 to-yellow-600', icon: Clock },
          { label: 'In Progress', value: stats.in_progress, color: 'from-purple-500 to-purple-600', icon: AlertTriangle },
          { label: 'Resolved', value: stats.resolved, color: 'from-green-500 to-green-600', icon: CheckCircle },
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
              placeholder="Search requests..."
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
              { value: 'open', label: 'Open' },
              { value: 'assigned', label: 'Assigned' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'resolved', label: 'Resolved' },
              { value: 'closed', label: 'Closed' },
              { value: 'cancelled', label: 'Cancelled' }
            ]}
            styles={customSelectStyles}
            isSearchable
            className="min-w-[160px]"
          />
          <Select
            value={{ value: filterPriority, label: filterPriority === 'all' ? 'All Priority' : filterPriority.charAt(0).toUpperCase() + filterPriority.slice(1) }}
            onChange={(option) => setFilterPriority(option?.value || 'all')}
            options={[
              { value: 'all', label: 'All Priority' },
              { value: 'low', label: 'Low' },
              { value: 'normal', label: 'Normal' },
              { value: 'high', label: 'High' },
              { value: 'urgent', label: 'Urgent' }
            ]}
            styles={customSelectStyles}
            isSearchable
            className="min-w-[160px]"
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

      {/* Requests List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Room</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Title</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Type</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Priority</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Created</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map(req => (
                <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{req.rooms?.room_number || 'N/A'}</div>
                    <div className="text-xs text-gray-500">Floor {req.rooms?.floor}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{req.title}</div>
                    <div className="text-xs text-gray-500">{req.description?.substring(0, 50)}...</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize">{req.request_type?.replace('_', ' ')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-semibold capitalize ${getPriorityColor(req.priority)}`}>
                      {req.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full border ${getStatusBadge(req.status)}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{new Date(req.created_at).toLocaleDateString()}</div>
                    <div className="text-xs text-gray-500">{new Date(req.created_at).toLocaleTimeString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleView(req)}
                        className="text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleEdit(req)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(req)}
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

      {filteredRequests.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No service requests found</p>
        </div>
      )}

      {/* Create Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-orange-700 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {modalMode === 'edit' ? <Edit2 className="w-6 h-6 text-white" /> : <Plus className="w-6 h-6 text-white" />}
                <h2 className="text-xl font-bold text-white">{modalMode === 'edit' ? 'Edit Service Request' : 'Create Service Request'}</h2>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setModalMode('add')
                  setSelectedRequest(null)
                  setRequestData({
                    room_id: '',
                    title: '',
                    description: '',
                    request_type: 'maintenance',
                    category: 'general',
                    priority: 'normal',
                    assigned_to: ''
                  })
                }}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={modalMode === 'edit' ? handleUpdate : handleCreateRequest} className="p-6 space-y-6">
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <p className="text-orange-800 text-sm">{modalMode === 'edit' ? 'Edit the service request details' : 'Create a new maintenance or service request'}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Room *</label>
                  <Select
                    value={rooms.find(r => r.id === requestData.room_id) ? {
                      value: requestData.room_id,
                      label: `${rooms.find(r => r.id === requestData.room_id).room_number} - ${rooms.find(r => r.id === requestData.room_id).room_type} (Floor ${rooms.find(r => r.id === requestData.room_id).floor})`
                    } : null}
                    onChange={(option) => setRequestData({ ...requestData, room_id: option?.value || '' })}
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Request Type *</label>
                  <Select
                    value={{ value: requestData.request_type, label: requestData.request_type.charAt(0).toUpperCase() + requestData.request_type.slice(1) }}
                    onChange={(option) => setRequestData({ ...requestData, request_type: option?.value || 'maintenance' })}
                    options={[
                      { value: 'maintenance', label: 'Maintenance' },
                      { value: 'housekeeping', label: 'Housekeeping' },
                      { value: 'plumbing', label: 'Plumbing' },
                      { value: 'electrical', label: 'Electrical' },
                      { value: 'hvac', label: 'HVAC' },
                      { value: 'other', label: 'Other' }
                    ]}
                    styles={customSelectStyles}
                    isSearchable
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                  <Select
                    value={{ value: requestData.category, label: requestData.category.charAt(0).toUpperCase() + requestData.category.slice(1) }}
                    onChange={(option) => setRequestData({ ...requestData, category: option?.value || 'general' })}
                    options={[
                      { value: 'general', label: 'General' },
                      { value: 'turn_down', label: 'Turn Down Service' },
                      { value: 'plumbing', label: 'Plumbing' },
                      { value: 'electrical', label: 'Electrical' },
                      { value: 'hvac', label: 'HVAC/AC' },
                      { value: 'cleaning', label: 'Cleaning' },
                      { value: 'amenity', label: 'Amenity' },
                      { value: 'furniture', label: 'Furniture' },
                      { value: 'appliance', label: 'Appliance' },
                      { value: 'safety', label: 'Safety' },
                      { value: 'other', label: 'Other' }
                    ]}
                    styles={customSelectStyles}
                    isSearchable
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Issues (Multiple)</label>
                  <Select
                    isMulti
                    value={(requestData.issues_reported || []).map((v) => ({ value: v, label: v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) }))}
                    onChange={(options) => setRequestData({ ...requestData, issues_reported: (options || []).map((o) => o.value) })}
                    options={[
                      { value: 'ac_issue', label: 'AC Issue' },
                      { value: 'plumbing_issue', label: 'Plumbing Issue' },
                      { value: 'electrical_issue', label: 'Electrical Issue' },
                      { value: 'furniture_damage', label: 'Furniture Damage' },
                      { value: 'appliance_issue', label: 'Appliance Issue' },
                      { value: 'safety_issue', label: 'Safety Issue' },
                      { value: 'cleaning_issue', label: 'Cleaning Issue' },
                      { value: 'amenity_request', label: 'Amenity Request' },
                      { value: 'other', label: 'Other' }
                    ]}
                    placeholder="Select one or more issues..."
                    styles={customSelectStyles}
                    isSearchable
                  />
                  <p className="text-xs text-gray-500 mt-1">Use this for maintenance/breakdown cases when multiple issues exist in the same room.</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  value={requestData.title}
                  onChange={(e) => setRequestData({ ...requestData, title: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Brief description of the issue"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                <textarea
                  value={requestData.description}
                  onChange={(e) => setRequestData({ ...requestData, description: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  rows="4"
                  placeholder="Detailed description of the issue..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Priority *</label>
                  <Select
                    value={{ value: requestData.priority, label: requestData.priority.charAt(0).toUpperCase() + requestData.priority.slice(1) }}
                    onChange={(option) => setRequestData({ ...requestData, priority: option?.value || 'normal' })}
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

                {modalMode === 'edit' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status *</label>
                    <Select
                      value={{ value: requestData.status, label: requestData.status.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') }}
                      onChange={(option) => setRequestData({ ...requestData, status: option?.value || 'open' })}
                      options={[
                        { value: 'open', label: 'Open' },
                        { value: 'assigned', label: 'Assigned' },
                        { value: 'in_progress', label: 'In Progress' },
                        { value: 'resolved', label: 'Resolved' },
                        { value: 'closed', label: 'Closed' },
                        { value: 'cancelled', label: 'Cancelled' }
                      ]}
                      styles={customSelectStyles}
                      isSearchable
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Assign To</label>
                  <Select
                    value={maintenanceStaff.find(s => s.id === requestData.assigned_to) ? {
                      value: requestData.assigned_to,
                      label: `${maintenanceStaff.find(s => s.id === requestData.assigned_to).full_name} - ${maintenanceStaff.find(s => s.id === requestData.assigned_to).role}`
                    } : null}
                    onChange={(option) => setRequestData({ ...requestData, assigned_to: option?.value || '' })}
                    options={maintenanceStaff.map(staff => ({
                      value: staff.id,
                      label: `${staff.full_name} - ${staff.role}`
                    }))}
                    placeholder="Assign later..."
                    isClearable
                    styles={customSelectStyles}
                    isSearchable
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {modalMode === 'edit' ? (
                    <>
                      <Edit2 className="w-5 h-5" />
                      Update Request
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Create Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Request Modal */}
      {showViewModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-gray-700 to-gray-800 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="w-6 h-6 text-white" />
                <h2 className="text-xl font-bold text-white">Request Details</h2>
              </div>
              <button
                onClick={() => {
                  setShowViewModal(false)
                  setSelectedRequest(null)
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
                  <p className="text-lg font-bold text-gray-900">{selectedRequest.rooms?.room_number || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Floor</label>
                  <p className="text-lg font-bold text-gray-900">{selectedRequest.rooms?.floor || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Request Type</label>
                  <p className="text-lg font-bold text-gray-900 capitalize">{selectedRequest.request_type?.replace('_', ' ')}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Category</label>
                  <p className="text-lg font-bold text-gray-900 capitalize">{selectedRequest.category || 'General'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Priority</label>
                  <p className={`text-lg font-bold capitalize ${
                    selectedRequest.priority === 'urgent' ? 'text-red-600' :
                    selectedRequest.priority === 'high' ? 'text-orange-600' :
                    'text-blue-600'
                  }`}>{selectedRequest.priority}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Status</label>
                  <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full border ${getStatusBadge(selectedRequest.status)}`}>
                    {selectedRequest.status}
                  </span>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-semibold text-gray-600">Title</label>
                  <p className="text-lg font-bold text-gray-900">{selectedRequest.title}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-semibold text-gray-600">Description</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedRequest.description}</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowViewModal(false)
                    handleEdit(selectedRequest)
                  }}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Edit Request
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false)
                    setSelectedRequest(null)
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
