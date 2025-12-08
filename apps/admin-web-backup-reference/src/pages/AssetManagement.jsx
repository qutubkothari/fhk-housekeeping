import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Package, Plus, X, Search, CheckCircle2, AlertCircle } from 'lucide-react'

export default function AssetManagement() {
  const [assets, setAssets] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [selectedRoom, setSelectedRoom] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('all') // all, available, assigned, maintenance

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: assetsData, error: assetsError } = await supabase
        .from('assets')
        .select(`
          *,
          rooms (room_number, floor, building)
        `)
        .order('asset_code')

      if (assetsError) throw assetsError

      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .eq('is_active', true)
        .order('room_number')

      if (roomsError) throw roomsError

      setAssets(assetsData || [])
      setRooms(roomsData || [])
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignAsset = async () => {
    if (!selectedAsset || !selectedRoom) return

    try {
      const { error } = await supabase
        .from('assets')
        .update({
          status: 'assigned',
          current_room_id: selectedRoom,
          assigned_at: new Date().toISOString()
        })
        .eq('id', selectedAsset.id)

      if (error) throw error

      setShowAssignModal(false)
      setSelectedAsset(null)
      setSelectedRoom('')
      loadData()
    } catch (err) {
      console.error('Error assigning asset:', err)
      alert('Failed to assign asset')
    }
  }

  const handleUnassignAsset = async (assetId) => {
    if (!confirm('Remove this asset from its room?')) return

    try {
      const { error } = await supabase
        .from('assets')
        .update({
          status: 'available',
          current_room_id: null,
          assigned_at: null
        })
        .eq('id', assetId)

      if (error) throw error
      loadData()
    } catch (err) {
      console.error('Error unassigning asset:', err)
      alert('Failed to unassign asset')
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      available: 'bg-green-100 text-green-800',
      assigned: 'bg-blue-100 text-blue-800',
      maintenance: 'bg-orange-100 text-orange-800',
      retired: 'bg-gray-100 text-gray-800'
    }
    return styles[status] || styles.available
  }

  const getAssetIcon = (type) => {
    const icons = {
      ac: '❄️',
      fridge: '🧊',
      iron: '🔥',
      tv: '📺',
      kettle: '☕',
      microwave: '🍽️',
      heater: '🔥',
      other: '📦'
    }
    return icons[type] || '📦'
  }

  const filteredAssets = assets
    .filter(asset => {
      if (filter !== 'all' && asset.status !== filter) return false
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          asset.asset_code.toLowerCase().includes(query) ||
          asset.asset_type.toLowerCase().includes(query) ||
          (asset.brand && asset.brand.toLowerCase().includes(query)) ||
          (asset.rooms && asset.rooms.room_number.toLowerCase().includes(query))
        )
      }
      return true
    })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asset Management</h1>
          <p className="text-gray-600 mt-1">Track AC, fridges, irons, and equipment</p>
        </div>
        <button
          onClick={() => {/* TODO: Add new asset modal */}}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Asset
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Assets</p>
              <p className="text-3xl font-bold text-gray-900">{assets.length}</p>
            </div>
            <Package className="w-10 h-10 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-3xl font-bold text-green-600">
                {assets.filter(a => a.status === 'available').length}
              </p>
            </div>
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Assigned</p>
              <p className="text-3xl font-bold text-blue-600">
                {assets.filter(a => a.status === 'assigned').length}
              </p>
            </div>
            <CheckCircle2 className="w-10 h-10 text-blue-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Maintenance</p>
              <p className="text-3xl font-bold text-orange-600">
                {assets.filter(a => a.status === 'maintenance').length}
              </p>
            </div>
            <AlertCircle className="w-10 h-10 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            {['all', 'available', 'assigned', 'maintenance'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium capitalize ${
                  filter === status
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asset
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Brand/Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAssets.map((asset) => (
                <tr key={asset.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{getAssetIcon(asset.asset_type)}</span>
                      <div className="font-medium text-gray-900">{asset.asset_code}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 capitalize">{asset.asset_type}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{asset.brand || '-'}</div>
                    <div className="text-sm text-gray-500">{asset.model || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(asset.status)}`}>
                      {asset.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {asset.rooms ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          Room {asset.rooms.room_number}
                        </div>
                        <div className="text-sm text-gray-500">
                          Floor {asset.rooms.floor}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Not assigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {asset.status === 'available' ? (
                      <button
                        onClick={() => {
                          setSelectedAsset(asset)
                          setShowAssignModal(true)
                        }}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Assign to Room
                      </button>
                    ) : asset.status === 'assigned' ? (
                      <button
                        onClick={() => handleUnassignAsset(asset.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Unassign
                      </button>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Assign Asset to Room</h3>
              <button
                onClick={() => {
                  setShowAssignModal(false)
                  setSelectedAsset(null)
                  setSelectedRoom('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asset
                </label>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-2xl">{getAssetIcon(selectedAsset?.asset_type)}</span>
                  <div>
                    <div className="font-medium text-gray-900">{selectedAsset?.asset_code}</div>
                    <div className="text-sm text-gray-500 capitalize">{selectedAsset?.asset_type}</div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Room
                </label>
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Choose a room...</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      Room {room.room_number} - Floor {room.floor}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowAssignModal(false)
                    setSelectedAsset(null)
                    setSelectedRoom('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignAsset}
                  disabled={!selectedRoom}
                  className={`flex-1 px-4 py-2 rounded-lg text-white ${
                    selectedRoom
                      ? 'bg-primary-600 hover:bg-primary-700'
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  Assign Asset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
