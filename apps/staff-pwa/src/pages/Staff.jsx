import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Plus, Search, Edit2, Trash2, Eye, RefreshCw, Users as UsersIcon, Mail, Phone, Shield } from 'lucide-react'
import Select from 'react-select'
import { customSelectStyles } from '../utils/selectStyles'
import { translations } from '../translations'

export default function Staff({ user, lang = 'en' }) {
  const t = (key) => translations[key]?.[lang] || key

  const [staff, setStaff] = useState([])
  const [locations, setLocations] = useState([])
  const [shifts, setShifts] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('add')
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'staff',
    job_role: '',
    is_active: true,
    location_id: null,
    shift_id: null,
  })
  const [selectedOperationalActivities, setSelectedOperationalActivities] = useState([]) // array of activity_id

  // System permission roles (used for access control + routing)
  const systemRoles = ['super_admin', 'admin', 'supervisor', 'staff', 'maintenance', 'front_desk', 'inventory', 'laundry']

  // Client-required job roles (stored separately from system role)
  const jobRoles = [
    'Passages East & West Cleaning',
    'Rooms Cleaning',
    'Washroom Cleaning',
    'Lobby Area Cleaning',
    'Supervisor',
    'MST',
    'Linen Attendant',
    'Front Desk',
    'Store',
  ]

  useEffect(() => {
    if (user?.org_id) {
      fetchReferenceData()
      fetchStaff()
    }
  }, [user?.org_id])

  const fetchReferenceData = async () => {
    try {
      const [locRes, shiftRes, actRes] = await Promise.all([
        supabase.from('locations').select('id, name, code').eq('org_id', user.org_id).eq('is_active', true).order('name'),
        supabase.from('shifts').select('id, name, code, start_time, end_time').eq('org_id', user.org_id).eq('is_active', true).order('start_time'),
        supabase.from('housekeeping_activities').select('id, name, code').eq('org_id', user.org_id).eq('is_active', true).order('sequence_order'),
      ])

      if (!locRes.error) setLocations(locRes.data || [])
      if (!shiftRes.error) setShifts(shiftRes.data || [])
      if (!actRes.error) setActivities(actRes.data || [])
    } catch (error) {
      console.error('Error fetching reference data:', error)
    }
  }

  const fetchStaff = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('org_id', user.org_id)
        .order('full_name')

      if (error) throw error
      setStaff(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setModalMode('add')
    setSelectedStaff(null)
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      role: 'staff',
      job_role: '',
      is_active: true,
      location_id: null,
      shift_id: null,
    })
    setSelectedOperationalActivities([])
    setShowModal(true)
  }

  const handleEdit = (member) => {
    setModalMode('edit')
    setSelectedStaff(member)
    setFormData({
      full_name: member.full_name,
      email: member.email,
      phone: member.phone || '',
      role: member.role,
      job_role: member.job_role || '',
      is_active: member.is_active,
      location_id: member.location_id || null,
      shift_id: member.shift_id || null,
    })
    loadOperationalActivitiesForUser(member.id)
    setShowModal(true)
  }

  const loadOperationalActivitiesForUser = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_operational_activities')
        .select('activity_id')
        .eq('user_id', userId)

      if (error) throw error
      setSelectedOperationalActivities((data || []).map((r) => r.activity_id))
    } catch (error) {
      // If table doesn't exist yet or RLS blocks, don't break Staff page
      console.warn('Operational activities mapping not available:', error?.message || error)
      setSelectedOperationalActivities([])
    }
  }

  const handleDelete = async (member) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return

    try {
      const { error } = await supabase.from('users').delete().eq('id', member.id)
      if (error) throw error
      alert('Staff member deleted successfully')
      fetchStaff()
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to delete staff member')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const phoneDigits = String(formData.phone || '').replace(/\D/g, '')
      if (!phoneDigits) {
        alert('Mobile number is required')
        return
      }

      // Keep compatibility with DBs where users.email is still NOT NULL.
      const normalizedEmail = String(formData.email || '').trim()
      const generatedEmail = `user_${phoneDigits}@fhk.local`

      const payload = {
        ...formData,
        phone: phoneDigits,
        phone_number: phoneDigits,
        email: normalizedEmail || generatedEmail,
      }

      if (modalMode === 'add') {
        const { data: inserted, error } = await supabase
          .from('users')
          .insert([{ ...payload, org_id: user.org_id }])
          .select('id')
          .single()
        if (error) throw error
        await saveOperationalActivities(inserted?.id)
        alert('Staff member added successfully')
      } else {
        const { error } = await supabase
          .from('users')
          .update(payload)
          .eq('id', selectedStaff.id)
        if (error) throw error
        await saveOperationalActivities(selectedStaff.id)
        alert('Staff member updated successfully')
      }
      setShowModal(false)
      fetchStaff()
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to save staff member')
    }
  }

  const saveOperationalActivities = async (userId) => {
    if (!userId) return
    try {
      // Remove existing mappings
      const del = await supabase.from('user_operational_activities').delete().eq('user_id', userId)
      if (del.error) throw del.error

      if (selectedOperationalActivities.length === 0) return

      const payload = selectedOperationalActivities.map((activityId) => ({
        org_id: user.org_id,
        user_id: userId,
        activity_id: activityId,
      }))

      const ins = await supabase.from('user_operational_activities').insert(payload)
      if (ins.error) throw ins.error
    } catch (error) {
      // If table isn't present, don't block employee save
      console.warn('Could not save operational activities:', error?.message || error)
    }
  }

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'bg-red-100 text-red-700 border-red-200',
      supervisor: 'bg-purple-100 text-purple-700 border-purple-200',
      staff: 'bg-blue-100 text-blue-700 border-blue-200',
      maintenance: 'bg-orange-100 text-orange-700 border-orange-200',
      front_desk: 'bg-teal-100 text-teal-700 border-teal-200',
    }
    return badges[role] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         String(member.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         String(member.phone_number || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'all' || member.role === filterRole
    return matchesSearch && matchesRole
  })

  const stats = {
    total: staff.length,
    active: staff.filter(s => s.is_active).length,
    staff: staff.filter(s => s.role === 'staff').length,
    supervisors: staff.filter(s => s.role === 'supervisor').length,
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div></div>
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: t('totalStaff'), value: stats.total, color: 'from-blue-500 to-blue-600', icon: UsersIcon },
          { label: t('active'), value: stats.active, color: 'from-green-500 to-green-600', icon: Shield },
          { label: t('staffMembers'), value: stats.staff, color: 'from-purple-500 to-purple-600', icon: UsersIcon },
          { label: t('supervisors'), value: stats.supervisors, color: 'from-orange-500 to-orange-600', icon: Shield },
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
              placeholder={t("search")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <Select
            value={{ value: filterRole, label: filterRole === 'all' ? t('allRoles') : filterRole.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') }}
            onChange={(option) => setFilterRole(option?.value || 'all')}
            options={[
              { value: 'all', label: t('allRoles') },
              ...systemRoles.map((role) => ({
                value: role,
                label: String(role)
                  .replace('_', ' ')
                  .split(' ')
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(' '),
              })),
            ]}
            styles={customSelectStyles}
            isSearchable
            className="min-w-[180px]"
          />
          <button
            onClick={() => fetchStaff()}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
          <button
            onClick={handleAdd}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Staff
          </button>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.map(member => (
          <div key={member.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-6 border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {member.full_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{member.full_name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getRoleBadge(member.role)}`}>
                    {member.role.replace('_', ' ')}
                  </span>
                  {member.job_role ? (
                    <div className="text-xs text-gray-600 mt-1">{member.job_role}</div>
                  ) : null}
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${member.is_active ? 'bg-green-500' : 'bg-gray-400'}`} 
                   title={member.is_active ? 'Active' : 'Inactive'}></div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <span className="truncate">{member.email}</span>
              </div>
              {member.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{member.phone}</span>
                </div>
              )}

              {(member.location_id || member.shift_id) && (
                <div className="text-xs text-gray-600 pt-1">
                  {member.location_id && (
                    <span className="mr-2">
                      <span className="font-semibold">Location:</span>{' '}
                      {locations.find((l) => l.id === member.location_id)?.name || '—'}
                    </span>
                  )}
                  {member.shift_id && (
                    <span>
                      <span className="font-semibold">Shift:</span>{' '}
                      {shifts.find((s) => s.id === member.shift_id)?.name || '—'}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-100">
              <button
                onClick={() => handleEdit(member)}
                className="flex-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => handleDelete(member)}
                className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredStaff.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <UsersIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No staff members found</p>
        </div>
      )}
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-2xl sticky top-0">
              <h2 className="text-2xl font-bold">
                {modalMode === 'add' ? 'Add Staff Member' : 'Edit Staff Member'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email (optional)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">System Role *</label>
                  <Select
                    value={{
                      value: formData.role,
                      label: String(formData.role)
                        .replace('_', ' ')
                        .split(' ')
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(' '),
                    }}
                    onChange={(option) => setFormData({ ...formData, role: option?.value || 'staff' })}
                    options={systemRoles.map((role) => ({
                      value: role,
                      label: String(role)
                        .replace('_', ' ')
                        .split(' ')
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(' '),
                    }))}
                    styles={customSelectStyles}
                    isSearchable
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Job Role</label>
                  <Select
                    value={formData.job_role ? { value: formData.job_role, label: formData.job_role } : null}
                    onChange={(option) => setFormData({ ...formData, job_role: option?.value || '' })}
                    options={jobRoles.map((r) => ({ value: r, label: r }))}
                    styles={customSelectStyles}
                    isClearable
                    isSearchable
                    placeholder="Select job role"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                  <Select
                    value={
                      formData.location_id
                        ? {
                            value: formData.location_id,
                            label: locations.find((l) => l.id === formData.location_id)?.name || 'Selected Location',
                          }
                        : null
                    }
                    onChange={(option) => setFormData({ ...formData, location_id: option?.value || null })}
                    options={locations.map((l) => ({ value: l.id, label: `${l.name} (${l.code})` }))}
                    styles={customSelectStyles}
                    isClearable
                    isSearchable
                    placeholder="Select location"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Shift</label>
                  <Select
                    value={
                      formData.shift_id
                        ? {
                            value: formData.shift_id,
                            label: shifts.find((s) => s.id === formData.shift_id)?.name || 'Selected Shift',
                          }
                        : null
                    }
                    onChange={(option) => setFormData({ ...formData, shift_id: option?.value || null })}
                    options={shifts.map((s) => ({
                      value: s.id,
                      label: `${s.name} (${String(s.start_time).slice(0, 5)}-${String(s.end_time).slice(0, 5)})`,
                    }))}
                    styles={customSelectStyles}
                    isClearable
                    isSearchable
                    placeholder="Select shift"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Operational Area (Activities)</label>
                  <Select
                    value={activities
                      .filter((a) => selectedOperationalActivities.includes(a.id))
                      .map((a) => ({ value: a.id, label: `${a.name} (${a.code})` }))}
                    onChange={(options) => setSelectedOperationalActivities((options || []).map((o) => o.value))}
                    options={activities.map((a) => ({ value: a.id, label: `${a.name} (${a.code})` }))}
                    styles={customSelectStyles}
                    isMulti
                    isSearchable
                    placeholder="Select activities"
                  />
                  <p className="text-xs text-gray-500 mt-1">Used to map employees to their operational activities.</p>
                </div>

                <div className="flex items-center gap-2">
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
                  {modalMode === 'add' ? 'Add Staff' : 'Update Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
