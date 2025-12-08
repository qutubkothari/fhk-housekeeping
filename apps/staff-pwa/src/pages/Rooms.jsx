import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Plus, Search, Edit2, Trash2, Eye, Grid, List, RefreshCw, BedDouble, DoorOpen } from 'lucide-react'
import Select from 'react-select'
import { customSelectStyles } from '../utils/selectStyles'

export default function Rooms({ user }) {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterFloor, setFilterFloor] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('add')
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [formData, setFormData] = useState({
    room_number: '',
    floor: '',
    room_type: 'standard',
    status: 'vacant',
    occupancy_status: 'vacant',
    bed_type: 'twin',
    max_occupancy: 2,
    rate_per_night: 0,
    notes: ''
  })

  const roomTypes = ['standard', 'deluxe', 'suite', 'executive']
  const statusTypes = ['vacant', 'occupied', 'cleaning', 'maintenance', 'out_of_order']
  const occupancyTypes = ['vacant', 'occupied', 'reserved']
  const bedTypes = ['single', 'twin', 'double', 'queen', 'king']

  useEffect(() => {
    if (user?.org_id) {
      fetchRooms()
      const interval = setInterval(() => fetchRooms(true), 30000)
      return () => clearInterval(interval)
    }
  }, [user?.org_id])

  const fetchRooms = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      else setRefreshing(true)

      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('org_id', user.org_id)
        .order('room_number', { ascending: true })

      if (error) throw error
      setRooms(data || [])
    } catch (error) {
      console.error('Error fetching rooms:', error)
    } finally {
      if (!silent) setLoading(false)
      else setRefreshing(false)
    }
  }

  const handleAdd = () => {
    setModalMode('add')
    setSelectedRoom(null)
    setFormData({
      room_number: '',
      floor: '',
      room_type: 'standard',
      status: 'vacant',
      occupancy_status: 'vacant',
      bed_type: 'twin',
      max_occupancy: 2,
      rate_per_night: 0,
      notes: ''
    })
    setShowModal(true)
  }

  const handleEdit = (room) => {
    setModalMode('edit')
    setSelectedRoom(room)
    setFormData({
      room_number: room.room_number,
      floor: room.floor,
      room_type: room.room_type,
      status: room.status,
      occupancy_status: room.occupancy_status,
      bed_type: room.bed_type || 'twin',
      max_occupancy: room.max_occupancy || 2,
      rate_per_night: room.rate_per_night || 0,
      notes: room.notes || ''
    })
    setShowModal(true)
  }

  const handleView = (room) => {
    setModalMode('view')
    setSelectedRoom(room)
    setFormData({
      room_number: room.room_number,
      floor: room.floor,
      room_type: room.room_type,
      status: room.status,
      occupancy_status: room.occupancy_status,
      bed_type: room.bed_type || 'twin',
      max_occupancy: room.max_occupancy || 2,
      rate_per_night: room.rate_per_night || 0,
      notes: room.notes || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (room) => {
    if (!confirm('Are you sure you want to delete this room?')) return

    try {
      const { error } = await supabase.from('rooms').delete().eq('id', room.id)
      if (error) throw error
      alert('Room deleted successfully')
      fetchRooms()
    } catch (error) {
      console.error('Error deleting room:', error)
      alert('Failed to delete room')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      // Validate required fields
      if (!formData.room_number || !formData.floor) {
        alert('Please fill in all required fields')
        return
      }

      if (modalMode === 'add') {
        const { error } = await supabase
          .from('rooms')
          .insert([{ ...formData, org_id: user.org_id }])
        if (error) {
          console.error('Supabase error:', error)
          throw error
        }
        alert('Room added successfully')
      } else if (modalMode === 'edit') {
        const { error } = await supabase
          .from('rooms')
          .update(formData)
          .eq('id', selectedRoom.id)
        if (error) {
          console.error('Supabase error:', error)
          throw error
        }
        alert('Room updated successfully')
      }
      setShowModal(false)
      fetchRooms()
    } catch (error) {
      console.error('Error saving room:', error)
      alert(`Failed to save room: ${error.message || 'Unknown error'}`)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      vacant: 'from-green-500 to-green-600',
      occupied: 'from-blue-500 to-blue-600',
      cleaning: 'from-yellow-500 to-yellow-600',
      maintenance: 'from-orange-500 to-orange-600',
      out_of_order: 'from-red-500 to-red-600'
    }
    return colors[status] || 'from-gray-500 to-gray-600'
  }

  const getStatusBadgeColor = (status) => {
    const colors = {
      vacant: 'bg-green-100 text-green-700 border-green-200',
      occupied: 'bg-blue-100 text-blue-700 border-blue-200',
      cleaning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      maintenance: 'bg-orange-100 text-orange-700 border-orange-200',
      out_of_order: 'bg-red-100 text-red-700 border-red-200'
    }
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.room_number.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFloor = filterFloor === 'all' || room.floor.toString() === filterFloor
    const matchesType = filterType === 'all' || room.room_type === filterType
    const matchesStatus = filterStatus === 'all' || room.status === filterStatus
    return matchesSearch && matchesFloor && matchesType && matchesStatus
  })

  const floors = [...new Set(rooms.map(r => r.floor))].sort()
  const statusCounts = {
    vacant: rooms.filter(r => r.status === 'vacant').length,
    occupied: rooms.filter(r => r.status === 'occupied').length,
    cleaning: rooms.filter(r => r.status === 'cleaning').length,
    maintenance: rooms.filter(r => r.status === 'maintenance').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Vacant', value: statusCounts.vacant, color: 'from-green-500 to-green-600', icon: DoorOpen },
          { label: 'Occupied', value: statusCounts.occupied, color: 'from-blue-500 to-blue-600', icon: BedDouble },
          { label: 'Cleaning', value: statusCounts.cleaning, color: 'from-yellow-500 to-yellow-600', icon: DoorOpen },
          { label: 'Maintenance', value: statusCounts.maintenance, color: 'from-orange-500 to-orange-600', icon: BedDouble },
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-transparent hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className={`text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 bg-gradient-to-br ${stat.color} rounded-lg`}>
                <stat.icon className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search rooms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            <Select
              value={{ value: filterFloor, label: filterFloor === 'all' ? 'All Floors' : `Floor ${filterFloor}` }}
              onChange={(option) => setFilterFloor(option?.value || 'all')}
              options={[
                { value: 'all', label: 'All Floors' },
                ...floors.map(floor => ({ value: floor, label: `Floor ${floor}` }))
              ]}
              styles={customSelectStyles}
              isSearchable
              className="min-w-[160px]"
            />

            <Select
              value={{ value: filterType, label: filterType === 'all' ? 'All Types' : filterType.charAt(0).toUpperCase() + filterType.slice(1) }}
              onChange={(option) => setFilterType(option?.value || 'all')}
              options={[
                { value: 'all', label: 'All Types' },
                ...roomTypes.map(type => ({ value: type, label: type.charAt(0).toUpperCase() + type.slice(1) }))
              ]}
              styles={customSelectStyles}
              isSearchable
              className="min-w-[160px]"
            />

            <Select
              value={{ value: filterStatus, label: filterStatus === 'all' ? 'All Status' : filterStatus.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') }}
              onChange={(option) => setFilterStatus(option?.value || 'all')}
              options={[
                { value: 'all', label: 'All Status' },
                ...statusTypes.map(status => ({ value: status, label: status.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') }))
              ]}
              styles={customSelectStyles}
              isSearchable
              className="min-w-[160px]"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => fetchRooms()}
              disabled={refreshing}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={handleAdd}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg flex items-center gap-2 transition-all shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              Add Room
            </button>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRooms.map(room => (
            <div key={room.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
              <div className={`h-2 bg-gradient-to-r ${getStatusColor(room.status)}`}></div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{room.room_number}</h3>
                    <p className="text-sm text-gray-500">Floor {room.floor}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeColor(room.status)}`}>
                    {room.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-semibold text-gray-900 capitalize">{room.room_type}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Occupancy:</span>
                    <span className="font-semibold text-gray-900 capitalize">{room.occupancy_status}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Bed:</span>
                    <span className="font-semibold text-gray-900 capitalize">{room.bed_type}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleView(room)}
                    className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => handleEdit(room)}
                    className="flex-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(room)}
                    className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Room</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Floor</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Occupancy</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Bed Type</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRooms.map(room => (
                  <tr key={room.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{room.room_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{room.floor}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 capitalize">{room.room_type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusBadgeColor(room.status)}`}>
                        {room.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900 capitalize">{room.occupancy_status}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 capitalize">{room.bed_type || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleView(room)} className="text-gray-600 hover:text-gray-900 transition-colors">
                          <Eye className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleEdit(room)} className="text-blue-600 hover:text-blue-900 transition-colors">
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDelete(room)} className="text-red-600 hover:text-red-900 transition-colors">
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
      )}

      {/* Empty State */}
      {filteredRooms.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <DoorOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No rooms found</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-2xl">
              <h2 className="text-2xl font-bold">
                {modalMode === 'add' && 'Add New Room'}
                {modalMode === 'edit' && 'Edit Room'}
                {modalMode === 'view' && 'Room Details'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Room Number *</label>
                  <input
                    type="text"
                    value={formData.room_number}
                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                    disabled={modalMode === 'view'}
                    required
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Floor *</label>
                  <input
                    type="number"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    disabled={modalMode === 'view'}
                    required
                    min="1"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Room Type *</label>
                  <Select
                    value={{ value: formData.room_type, label: formData.room_type.charAt(0).toUpperCase() + formData.room_type.slice(1) }}
                    onChange={(option) => setFormData({ ...formData, room_type: option?.value || 'standard' })}
                    options={roomTypes.map(type => ({ value: type, label: type.charAt(0).toUpperCase() + type.slice(1) }))}
                    isDisabled={modalMode === 'view'}
                    styles={customSelectStyles}
                    isSearchable
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status *</label>
                  <Select
                    value={{ value: formData.status, label: formData.status.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') }}
                    onChange={(option) => setFormData({ ...formData, status: option?.value || 'clean' })}
                    options={statusTypes.map(status => ({ value: status, label: status.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') }))}
                    isDisabled={modalMode === 'view'}
                    styles={customSelectStyles}
                    isSearchable
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Occupancy Status *</label>
                  <Select
                    value={{ value: formData.occupancy_status, label: formData.occupancy_status.charAt(0).toUpperCase() + formData.occupancy_status.slice(1) }}
                    onChange={(option) => setFormData({ ...formData, occupancy_status: option?.value || 'vacant' })}
                    options={occupancyTypes.map(status => ({ value: status, label: status.charAt(0).toUpperCase() + status.slice(1) }))}
                    isDisabled={modalMode === 'view'}
                    styles={customSelectStyles}
                    isSearchable
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Bed Type</label>
                  <Select
                    value={{ value: formData.bed_type || 'single', label: (formData.bed_type || 'single').charAt(0).toUpperCase() + (formData.bed_type || 'single').slice(1) }}
                    onChange={(option) => setFormData({ ...formData, bed_type: option?.value || 'single' })}
                    options={bedTypes.map(type => ({ value: type, label: type.charAt(0).toUpperCase() + type.slice(1) }))}
                    isDisabled={modalMode === 'view'}
                    styles={customSelectStyles}
                    isSearchable
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Max Occupancy</label>
                  <input
                    type="number"
                    value={formData.max_occupancy}
                    onChange={(e) => setFormData({ ...formData, max_occupancy: parseInt(e.target.value) })}
                    disabled={modalMode === 'view'}
                    min="1"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Rate per Night</label>
                  <input
                    type="number"
                    value={formData.rate_per_night}
                    onChange={(e) => setFormData({ ...formData, rate_per_night: parseFloat(e.target.value) })}
                    disabled={modalMode === 'view'}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 transition-all"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    disabled={modalMode === 'view'}
                    rows="3"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 border-2 border-gray-300 rounded-lg hover:bg-gray-100 font-medium transition-colors"
                >
                  {modalMode === 'view' ? 'Close' : 'Cancel'}
                </button>
                {modalMode !== 'view' && (
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
                  >
                    {modalMode === 'add' ? 'Add Room' : 'Update Room'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
