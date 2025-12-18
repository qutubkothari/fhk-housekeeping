import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { translations } from '../translations'
import { Plus, Search, Edit2, Trash2, RefreshCw, Clock } from 'lucide-react'

export default function ShiftMaster({ user, lang = 'en' }) {
  const t = (key) => translations[key]?.[lang] || translations[key]?.en || key
  const orgId = user?.org_id

  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('add')
  const [selectedShift, setSelectedShift] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    start_time: '07:00',
    end_time: '15:00',
    color: '#3b82f6',
    is_active: true,
  })

  useEffect(() => {
    if (orgId) fetchShifts()
  }, [orgId])

  const fetchShifts = async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)

    try {
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('org_id', orgId)
        .order('start_time', { ascending: true })

      if (error) throw error
      setShifts(data || [])
    } catch (error) {
      console.error('Error fetching shifts:', error)
      if (!silent) alert(error.message || 'Failed to load shifts')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleAdd = () => {
    setModalMode('add')
    setSelectedShift(null)
    setFormData({
      name: '',
      code: '',
      start_time: '07:00',
      end_time: '15:00',
      color: '#3b82f6',
      is_active: true,
    })
    setShowModal(true)
  }

  const handleEdit = (shift) => {
    setModalMode('edit')
    setSelectedShift(shift)
    setFormData({
      name: shift.name || '',
      code: shift.code || '',
      start_time: (shift.start_time || '07:00').slice(0, 5),
      end_time: (shift.end_time || '15:00').slice(0, 5),
      color: shift.color || '#3b82f6',
      is_active: !!shift.is_active,
    })
    setShowModal(true)
  }

  const handleDelete = async (shift) => {
    if (!confirm(`Are you sure you want to delete "${shift.name}"?`)) return

    try {
      const { error } = await supabase.from('shifts').delete().eq('id', shift.id)
      if (error) throw error
      await fetchShifts(true)
    } catch (error) {
      console.error('Error deleting shift:', error)
      alert(error.message || 'Failed to delete shift')
    }
  }

  const handleSeedPredefinedShifts = async () => {
    if (!confirm('This will add/update 11 predefined shifts. Continue?')) return

    const predefinedShifts = [
      { name: '2 PM - 9 PM', code: 'SHIFT-1', start_time: '14:00', end_time: '21:00', duration_hrs: 7, color: '#3b82f6' },
      { name: '3 PM - 11 PM', code: 'SHIFT-2', start_time: '15:00', end_time: '23:00', duration_hrs: 8, color: '#8b5cf6' },
      { name: '5 PM - 1 AM', code: 'SHIFT-3', start_time: '17:00', end_time: '01:00', duration_hrs: 8, color: '#10b981' },
      { name: '7 AM - 12 PM / 2 PM - 5 PM', code: 'SHIFT-4', start_time: '07:00', end_time: '17:00', duration_hrs: 8, color: '#f59e0b' },
      { name: '7 AM - 12 PM / 3 PM - 6 PM', code: 'SHIFT-5', start_time: '07:00', end_time: '18:00', duration_hrs: 8, color: '#ef4444' },
      { name: '7 AM - 12 PM / 3 PM - 6 PM', code: 'SHIFT-6', start_time: '07:00', end_time: '18:00', duration_hrs: 8, color: '#06b6d4' },
      { name: '7 AM - 2 PM', code: 'SHIFT-7', start_time: '07:00', end_time: '14:00', duration_hrs: 7, color: '#8b5cf6' },
      { name: '7 AM - 3 PM', code: 'SHIFT-8', start_time: '07:00', end_time: '15:00', duration_hrs: 8, color: '#ec4899' },
      { name: '8 AM - 1 PM / 3 PM - 7 PM', code: 'SHIFT-9', start_time: '08:00', end_time: '19:00', duration_hrs: 9, color: '#6366f1' },
      { name: '8 AM - 12 PM / 3 PM - 8 PM', code: 'SHIFT-10', start_time: '08:00', end_time: '20:00', duration_hrs: 9, color: '#14b8a6' },
      { name: '9 AM - 1 PM / 3 PM - 5 PM', code: 'SHIFT-11', start_time: '09:00', end_time: '17:00', duration_hrs: 6, color: '#f97316' },
    ]

    try {
      const shiftsToInsert = predefinedShifts.map(s => ({
        org_id: orgId,
        name: s.name,
        code: s.code,
        start_time: s.start_time,
        end_time: s.end_time,
        color: s.color,
        is_active: true,
      }))

      const { error } = await supabase.from('shifts').upsert(shiftsToInsert, { onConflict: 'org_id,code' })
      if (error) throw error

      alert('Predefined shifts added successfully!')
      await fetchShifts(true)
    } catch (error) {
      console.error('Error seeding shifts:', error)
      alert(error.message || 'Failed to seed shifts')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.code.trim()) {
      alert('Please fill shift name and code')
      return
    }

    try {
      if (modalMode === 'add') {
        const { error } = await supabase
          .from('shifts')
          .insert([
            {
              org_id: orgId,
              name: formData.name.trim(),
              code: formData.code.trim(),
              start_time: formData.start_time,
              end_time: formData.end_time,
              color: formData.color,
              is_active: formData.is_active,
            },
          ])
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('shifts')
          .update({
            name: formData.name.trim(),
            code: formData.code.trim(),
            start_time: formData.start_time,
            end_time: formData.end_time,
            color: formData.color,
            is_active: formData.is_active,
          })
          .eq('id', selectedShift.id)
        if (error) throw error
      }

      setShowModal(false)
      await fetchShifts(true)
    } catch (error) {
      console.error('Error saving shift:', error)
      alert(error.message || 'Failed to save shift')
    }
  }

  const filteredShifts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return shifts
    return shifts.filter((s) => (s.name || '').toLowerCase().includes(q) || (s.code || '').toLowerCase().includes(q))
  }, [shifts, searchTerm])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('shiftMaster') || 'Shift Master'}</h1>
            <p className="text-sm text-gray-600 mt-1">{t('shifts') || 'Shifts'}: {shifts.length}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSeedPredefinedShifts}
              className="px-4 py-2.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Clock className="w-5 h-5" />
              Seed Shifts
            </button>
            <button
              onClick={() => fetchShifts(true)}
              disabled={refreshing}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-60"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              {t('refresh') || 'Refresh'}
            </button>
            <button
              onClick={handleAdd}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="w-5 h-5" />
              {t('addShift') || 'Add Shift'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={t('search') || 'Search'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredShifts.map((s) => (
          <div key={s.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-6 border border-gray-100">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white" style={{ background: s.color || '#3b82f6' }}>
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{s.name}</h3>
                  <div className="text-sm text-gray-600">{s.code}</div>
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${s.is_active ? 'bg-green-500' : 'bg-gray-400'}`} title={s.is_active ? 'Active' : 'Inactive'}></div>
            </div>

            <div className="text-sm text-gray-700 mb-4">
              <span className="font-semibold">{t('startTime') || 'Start'}:</span> {String(s.start_time).slice(0, 5)}
              <span className="mx-2">•</span>
              <span className="font-semibold">{t('endTime') || 'End'}:</span> {String(s.end_time).slice(0, 5)}
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-100">
              <button
                onClick={() => handleEdit(s)}
                className="flex-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                {t('editShift') || 'Edit'}
              </button>
              <button
                onClick={() => handleDelete(s)}
                className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredShifts.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No shifts found</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-2xl">
              <h2 className="text-2xl font-bold">
                {modalMode === 'add' ? (t('addShift') || 'Add Shift') : (t('editShift') || 'Edit Shift')}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('shiftName') || 'Shift Name'} *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('shiftCode') || 'Code'} *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">{t('startTime') || 'Start Time'} *</label>
                    <input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">{t('endTime') || 'End Time'} *</label>
                    <input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Color</label>
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-full h-11 px-2 py-1 border-2 border-gray-200 rounded-lg"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-8">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active</label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg hover:bg-gray-100 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
                >
                  {modalMode === 'add' ? (t('addShift') || 'Add') : (t('editShift') || 'Update')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
