import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/stores/authStore'
import { Plus, Search, Edit2, Trash2, Eye, Filter, Grid, List, RefreshCw } from 'lucide-react'

export default function Rooms() {
  const { t } = useTranslation()
  const { orgId } = useAuthStore()
  
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterFloor, setFilterFloor] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('add') // 'add', 'edit', 'view'
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
    amenities: [],
    notes: ''
  })

  const roomTypes = ['standard', 'deluxe', 'suite', 'executive']
  const statusTypes = ['vacant', 'occupied', 'cleaning', 'maintenance', 'out_of_order']
  const occupancyTypes = ['vacant', 'occupied', 'reserved']
  const bedTypes = ['single', 'twin', 'double', 'queen', 'king']

  useEffect(() => {
    if (orgId) {
      fetchRooms()
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        fetchRooms(true) // true = silent refresh
      }, 30000)
      
      return () => clearInterval(interval)
    }
  }, [orgId])

  const fetchRooms = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true)
      } else {
        setRefreshing(true)
      }
      console.log('Fetching rooms for orgId:', orgId)
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('org_id', orgId)
        .order('room_number', { ascending: true })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      console.log('Fetched rooms:', data)
      setRooms(data || [])
    } catch (error) {
      console.error('Error fetching rooms:', error)
      if (!silent) {
        alert(t('Failed to fetch rooms'))
      }
    } finally {
      if (!silent) {
        setLoading(false)
      } else {
        setRefreshing(false)
      }
    }
  }

  const handleManualRefresh = () => {
    fetchRooms()
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
      amenities: [],
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
      amenities: room.amenities || [],
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
      amenities: room.amenities || [],
      notes: room.notes || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (room) => {
    if (!confirm(t('Are you sure you want to delete this room?'))) {
      return
    }

    try {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', room.id)

      if (error) throw error
      
      alert(t('Room deleted successfully'))
      fetchRooms()
    } catch (error) {
      console.error('Error deleting room:', error)
      alert(t('Failed to delete room'))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (modalMode === 'add') {
        const { error } = await supabase
          .from('rooms')
          .insert([{ ...formData, org_id: orgId }])

        if (error) throw error
        alert(t('Room added successfully'))
      } else if (modalMode === 'edit') {
        const { error } = await supabase
          .from('rooms')
          .update(formData)
          .eq('id', selectedRoom.id)

        if (error) throw error
        alert(t('Room updated successfully'))
      }

      setShowModal(false)
      fetchRooms()
    } catch (error) {
      console.error('Error saving room:', error)
      alert(t('Failed to save room'))
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      vacant: 'bg-green-100 text-green-800',
      occupied: 'bg-blue-100 text-blue-800',
      cleaning: 'bg-yellow-100 text-yellow-800',
      maintenance: 'bg-orange-100 text-orange-800',
      out_of_order: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getOccupancyColor = (status) => {
    const colors = {
      vacant: 'text-green-600',
      occupied: 'text-blue-600',
      reserved: 'text-purple-600'
    }
    return colors[status] || 'text-gray-600'
  }

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.room_number.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFloor = filterFloor === 'all' || room.floor.toString() === filterFloor
    const matchesType = filterType === 'all' || room.room_type === filterType
    const matchesStatus = filterStatus === 'all' || room.status === filterStatus
    return matchesSearch && matchesFloor && matchesType && matchesStatus
  })

  const floors = [...new Set(rooms.map(r => r.floor))].sort()

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('Rooms')}</h1>
          <p className="text-gray-600 mt-1">{t('Manage hotel rooms')}</p>
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
            {t('Add Room')}
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t('Search rooms...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterFloor}
            onChange={(e) => setFilterFloor(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{t('All Floors')}</option>
            {floors.map(floor => (
              <option key={floor} value={floor}>{t('Floor')} {floor}</option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{t('All Types')}</option>
            {roomTypes.map(type => (
              <option key={type} value={type}>{t(type)}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{t('All Status')}</option>
            {statusTypes.map(status => (
              <option key={status} value={status}>{t(status)}</option>
            ))}
          </select>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-center gap-2 ${
                viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-center gap-2 ${
                viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-4">{t('Loading rooms...')}</p>
        </div>
      )}

      {/* Grid View */}
      {!loading && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRooms.map(room => (
            <div key={room.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{room.room_number}</h3>
                  <p className="text-sm text-gray-600">{t('Floor')} {room.floor}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(room.status)}`}>
                  {t(room.status)}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('Type')}:</span>
                  <span className="font-medium">{t(room.room_type)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('Occupancy')}:</span>
                  <span className={`font-medium ${getOccupancyColor(room.occupancy_status)}`}>
                    {t(room.occupancy_status)}
                  </span>
                </div>
                {room.bed_type && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('Bed')}:</span>
                    <span className="font-medium">{t(room.bed_type)}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <button
                  onClick={() => handleView(room)}
                  className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center justify-center gap-1"
                >
                  <Eye className="w-4 h-4" />
                  {t('View')}
                </button>
                <button
                  onClick={() => handleEdit(room)}
                  className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center justify-center gap-1"
                >
                  <Edit2 className="w-4 h-4" />
                  {t('Edit')}
                </button>
                <button
                  onClick={() => handleDelete(room)}
                  className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {!loading && viewMode === 'list' && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('Room')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('Floor')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('Type')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('Status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('Occupancy')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('Bed Type')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('Actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRooms.map(room => (
                <tr key={room.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{room.room_number}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{room.floor}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize">{t(room.room_type)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(room.status)}`}>
                      {t(room.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${getOccupancyColor(room.occupancy_status)}`}>
                      {t(room.occupancy_status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize">{room.bed_type ? t(room.bed_type) : '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleView(room)}
                        className="text-gray-600 hover:text-gray-900"
                        title={t('View')}
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleEdit(room)}
                        className="text-blue-600 hover:text-blue-900"
                        title={t('Edit')}
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(room)}
                        className="text-red-600 hover:text-red-900"
                        title={t('Delete')}
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
      )}

      {/* Empty State */}
      {!loading && filteredRooms.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-600">{t('No rooms found')}</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">
                {modalMode === 'add' && t('Add Room')}
                {modalMode === 'edit' && t('Edit Room')}
                {modalMode === 'view' && t('Room Details')}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('Room Number')} *
                  </label>
                  <input
                    type="text"
                    value={formData.room_number}
                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                    disabled={modalMode === 'view'}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('Floor')} *
                  </label>
                  <input
                    type="number"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    disabled={modalMode === 'view'}
                    required
                    min="1"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('Room Type')} *
                  </label>
                  <select
                    value={formData.room_type}
                    onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                    disabled={modalMode === 'view'}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    {roomTypes.map(type => (
                      <option key={type} value={type}>{t(type)}</option>
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
                    {statusTypes.map(status => (
                      <option key={status} value={status}>{t(status)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('Occupancy Status')} *
                  </label>
                  <select
                    value={formData.occupancy_status}
                    onChange={(e) => setFormData({ ...formData, occupancy_status: e.target.value })}
                    disabled={modalMode === 'view'}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    {occupancyTypes.map(status => (
                      <option key={status} value={status}>{t(status)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('Bed Type')}
                  </label>
                  <select
                    value={formData.bed_type}
                    onChange={(e) => setFormData({ ...formData, bed_type: e.target.value })}
                    disabled={modalMode === 'view'}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    {bedTypes.map(type => (
                      <option key={type} value={type}>{t(type)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('Max Occupancy')}
                  </label>
                  <input
                    type="number"
                    value={formData.max_occupancy}
                    onChange={(e) => setFormData({ ...formData, max_occupancy: parseInt(e.target.value) })}
                    disabled={modalMode === 'view'}
                    min="1"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('Rate per Night')}
                  </label>
                  <input
                    type="number"
                    value={formData.rate_per_night}
                    onChange={(e) => setFormData({ ...formData, rate_per_night: parseFloat(e.target.value) })}
                    disabled={modalMode === 'view'}
                    min="0"
                    step="0.01"
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
                    {modalMode === 'add' ? t('Add Room') : t('Update Room')}
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
