import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Plus, Search, RefreshCw, Edit2, Trash2, Save, X, Clock, ListOrdered } from 'lucide-react'
import { translations } from '../translations'

export default function ActivityMaster({ user, lang = 'en' }) {
  const t = (key) => translations[key]?.[lang] || key
  const orgId = user?.org_id

  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('add')
  const [selectedActivity, setSelectedActivity] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    estimated_minutes: 30,
    sequence_order: 1,
    is_mandatory: true,
    is_active: true
  })

  useEffect(() => {
    fetchActivities()
  }, [orgId])

  const fetchActivities = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('housekeeping_activities')
        .select('*')
        .eq('org_id', orgId)
        .order('sequence_order', { ascending: true })

      if (error) throw error
      setActivities(data || [])
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    console.log('🔵 handleAdd clicked!')
    console.log('Current showModal:', showModal)
    setModalMode('add')
    setSelectedActivity(null)
    setFormData({
      name: '',
      code: '',
      description: '',
      estimated_minutes: 30,
      sequence_order: activities.length + 1,
      is_mandatory: true,
      is_active: true
    })
    setShowModal(true)
    console.log('🔵 setShowModal(true) called')
  }

  const handleEdit = (activity) => {
    setModalMode('edit')
    setSelectedActivity(activity)
    setFormData({
      name: activity.name,
      code: activity.code,
      description: activity.description || '',
      estimated_minutes: activity.estimated_minutes,
      sequence_order: activity.sequence_order,
      is_mandatory: activity.is_mandatory,
      is_active: activity.is_active
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (modalMode === 'add') {
        const { error } = await supabase
          .from('housekeeping_activities')
          .insert([{ ...formData, org_id: orgId }])

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('housekeeping_activities')
          .update(formData)
          .eq('id', selectedActivity.id)

        if (error) throw error
      }

      setShowModal(false)
      fetchActivities()
    } catch (error) {
      console.error('Error saving activity:', error)
      alert(error.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm(t('deleteActivity') + '?')) return

    try {
      const { error } = await supabase
        .from('housekeeping_activities')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchActivities()
    } catch (error) {
      console.error('Error deleting activity:', error)
      alert(error.message)
    }
  }

  const filteredActivities = activities.filter(activity =>
    activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('activityMaster')}</h1>
          <p className="text-sm text-gray-600 mt-1">
            {t('activities')}: {activities.length}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchActivities}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={t('refresh')}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t('addActivity')}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t('search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Activities Table */}
      {loading ? (
        <div className="text-center py-12">{t('loading')}</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {t('sequenceOrder')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {t('activityCode')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {t('activityName')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {t('estimatedTime')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {t('type')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {t('status')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredActivities.map((activity) => (
                <tr key={activity.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <ListOrdered className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {activity.sequence_order}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-mono bg-gray-100 text-gray-800 rounded">
                      {activity.code}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {activity.name}
                    </div>
                    {activity.description && (
                      <div className="text-sm text-gray-500 mt-1">
                        {activity.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      {activity.estimated_minutes} {t('minutes')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded ${
                      activity.is_mandatory 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {activity.is_mandatory ? t('mandatory') : t('optional')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded ${
                      activity.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {activity.is_active ? t('active') : t('inactive')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(activity)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title={t('edit')}
                      >
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(activity.id)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title={t('delete')}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredActivities.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    {t('noData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {modalMode === 'add' ? t('addActivity') : t('editActivity')}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('activityName')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('activityCode')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('description')}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('estimatedTime')} ({t('minutes')}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.estimated_minutes}
                    onChange={(e) => setFormData({ ...formData, estimated_minutes: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('sequenceOrder')} *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.sequence_order}
                    onChange={(e) => setFormData({ ...formData, sequence_order: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_mandatory}
                    onChange={(e) => setFormData({ ...formData, is_mandatory: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{t('mandatory')}</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{t('active')}</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Save className="w-5 h-5" />
                  {t('save')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <X className="w-5 h-5" />
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
