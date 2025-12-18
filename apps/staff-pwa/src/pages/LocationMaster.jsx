import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { MapPin, Plus, Edit2, Trash2, Save, X, Building2, Map } from 'lucide-react'
import { translations } from '../translations'

export default function LocationMaster({ user, lang = 'en' }) {
  const t = translations[lang]
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingLocation, setEditingLocation] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    location_type: 'floor',
    parent_location_id: null,
    description: '',
    is_active: true
  })

  const locationTypes = [
    { value: 'floor', label: 'Floor' },
    { value: 'wing', label: 'Wing' },
    { value: 'section', label: 'Section' },
    { value: 'area', label: 'Area' }
  ]

  useEffect(() => {
    loadLocations()
  }, [user])

  const loadLocations = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('locations')
        .select(`
          *,
          parent:parent_location_id(name)
        `)
        .eq('org_id', user.org_id)
        .order('name')

      if (error) throw error
      setLocations(data || [])
    } catch (error) {
      console.error('Error loading locations:', error)
      alert('Failed to load locations: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setFormData({
      name: '',
      code: '',
      location_type: 'floor',
      parent_location_id: null,
      description: '',
      is_active: true
    })
    setShowAddModal(true)
  }

  const handleEdit = (location) => {
    setEditingLocation(location)
    setFormData({
      name: location.name,
      code: location.code,
      location_type: location.location_type,
      parent_location_id: location.parent_location_id,
      description: location.description || '',
      is_active: location.is_active
    })
    setShowEditModal(true)
  }

  const handleSubmitAdd = async (e) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.code.trim()) {
      alert('Name and Code are required')
      return
    }

    try {
      const { error } = await supabase
        .from('locations')
        .insert([{
          ...formData,
          org_id: user.org_id
        }])

      if (error) throw error
      setShowAddModal(false)
      loadLocations()
      alert('Location added successfully!')
    } catch (error) {
      console.error('Error adding location:', error)
      alert('Failed to add location: ' + error.message)
    }
  }

  const handleSubmitEdit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.code.trim()) {
      alert('Name and Code are required')
      return
    }

    try {
      const { error } = await supabase
        .from('locations')
        .update(formData)
        .eq('id', editingLocation.id)

      if (error) throw error
      setShowEditModal(false)
      setEditingLocation(null)
      loadLocations()
      alert('Location updated successfully!')
    } catch (error) {
      console.error('Error updating location:', error)
      alert('Failed to update location: ' + error.message)
    }
  }

  const handleDelete = async (location) => {
    if (!confirm(`Are you sure you want to delete "${location.name}"?`)) return

    try {
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', location.id)

      if (error) throw error
      loadLocations()
      alert('Location deleted successfully!')
    } catch (error) {
      console.error('Error deleting location:', error)
      alert('Failed to delete location: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Location Master</h1>
              <p className="text-sm text-gray-600">Manage hotel locations and hierarchy</p>
            </div>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Location
          </button>
        </div>
      </div>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map((location) => (
          <div
            key={location.id}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  {location.location_type === 'floor' ? (
                    <Building2 className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Map className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{location.name}</h3>
                  <p className="text-xs text-gray-500">Code: {location.code}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(location)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(location)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500">Type:</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full capitalize">
                  {location.location_type}
                </span>
              </div>
              
              {location.parent && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500">Parent:</span>
                  <span className="text-xs text-gray-700">{location.parent.name}</span>
                </div>
              )}

              {location.description && (
                <p className="text-xs text-gray-600 mt-2">{location.description}</p>
              )}

              <div className="flex items-center gap-2 pt-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  location.is_active 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {location.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {locations.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No locations found</p>
          <p className="text-sm text-gray-500 mt-1">Click "Add Location" to create one</p>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-blue-600 text-white p-6 rounded-t-xl">
              <h2 className="text-xl font-bold">Add New Location</h2>
            </div>
            <form onSubmit={handleSubmitAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Ground Floor, East Wing"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location Code *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., GF, EW"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location Type *
                </label>
                <select
                  value={formData.location_type}
                  onChange={(e) => setFormData({ ...formData, location_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {locationTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parent Location
                </label>
                <select
                  value={formData.parent_location_id || ''}
                  onChange={(e) => setFormData({ ...formData, parent_location_id: e.target.value || null })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">None (Top Level)</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Optional description..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active_add"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="is_active_add" className="text-sm font-medium text-gray-700">
                  Active
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-blue-600 text-white p-6 rounded-t-xl">
              <h2 className="text-xl font-bold">Edit Location</h2>
            </div>
            <form onSubmit={handleSubmitEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location Code *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location Type *
                </label>
                <select
                  value={formData.location_type}
                  onChange={(e) => setFormData({ ...formData, location_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {locationTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parent Location
                </label>
                <select
                  value={formData.parent_location_id || ''}
                  onChange={(e) => setFormData({ ...formData, parent_location_id: e.target.value || null })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">None (Top Level)</option>
                  {locations.filter(loc => loc.id !== editingLocation.id).map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active_edit"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="is_active_edit" className="text-sm font-medium text-gray-700">
                  Active
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingLocation(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Update Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
