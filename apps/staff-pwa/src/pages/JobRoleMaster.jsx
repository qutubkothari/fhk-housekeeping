import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { translations } from '../translations'
import { Plus, Search, Edit2, Trash2, RefreshCw, Briefcase } from 'lucide-react'

export default function JobRoleMaster({ user, lang = 'en' }) {
  const t = (key) => translations[key]?.[lang] || translations[key]?.en || key
  const orgId = user?.org_id

  const [jobRoles, setJobRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('add')
  const [selectedJobRole, setSelectedJobRole] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    department: '',
    is_active: true,
  })

  useEffect(() => {
    if (orgId) fetchJobRoles()
  }, [orgId])

  const fetchJobRoles = async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)

    try {
      const { data, error } = await supabase
        .from('job_roles')
        .select('*')
        .eq('org_id', orgId)
        .order('name', { ascending: true })

      if (error) throw error
      setJobRoles(data || [])
    } catch (error) {
      console.error('Error fetching job roles:', error)
      if (!silent) alert(error.message || 'Failed to load job roles')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleAdd = () => {
    setModalMode('add')
    setSelectedJobRole(null)
    setFormData({
      name: '',
      code: '',
      description: '',
      department: '',
      is_active: true,
    })
    setShowModal(true)
  }

  const handleEdit = (jobRole) => {
    setModalMode('edit')
    setSelectedJobRole(jobRole)
    setFormData({
      name: jobRole.name || '',
      code: jobRole.code || '',
      description: jobRole.description || '',
      department: jobRole.department || '',
      is_active: !!jobRole.is_active,
    })
    setShowModal(true)
  }

  const handleDelete = async (jobRole) => {
    if (!confirm(`Are you sure you want to delete "${jobRole.name}"?`)) return

    try {
      const { error } = await supabase.from('job_roles').delete().eq('id', jobRole.id)
      if (error) throw error
      await fetchJobRoles(true)
    } catch (error) {
      console.error('Error deleting job role:', error)
      alert(error.message || 'Failed to delete job role')
    }
  }

  const handleSeedPredefinedRoles = async () => {
    if (!confirm('This will add predefined job roles. Continue?')) return

    const predefinedRoles = [
      { name: 'Room Attendant', code: 'ROOM-ATT', description: 'Responsible for cleaning guest rooms', department: 'Housekeeping' },
      { name: 'Public Area Attendant', code: 'PUB-ATT', description: 'Maintains cleanliness of public areas', department: 'Housekeeping' },
      { name: 'Laundry Attendant', code: 'LAUN-ATT', description: 'Handles laundry operations', department: 'Housekeeping' },
      { name: 'Housekeeping Supervisor', code: 'HK-SUP', description: 'Supervises housekeeping staff', department: 'Housekeeping' },
      { name: 'Linen Room Attendant', code: 'LINEN-ATT', description: 'Manages linen inventory and distribution', department: 'Housekeeping' },
      { name: 'Maintenance Technician', code: 'MAINT-TECH', description: 'Handles maintenance and repairs', department: 'Maintenance' },
      { name: 'Front Desk Agent', code: 'FD-AGENT', description: 'Handles guest check-in/check-out', department: 'Front Office' },
      { name: 'Store Keeper', code: 'STORE-KEEP', description: 'Manages inventory and supplies', department: 'Stores' },
    ]

    try {
      const rolesToInsert = predefinedRoles.map(r => ({
        org_id: orgId,
        name: r.name,
        code: r.code,
        description: r.description,
        department: r.department,
        is_active: true,
      }))

      const { error } = await supabase.from('job_roles').upsert(rolesToInsert, { onConflict: 'org_id,code' })
      if (error) throw error

      alert('Predefined job roles added successfully!')
      await fetchJobRoles(true)
    } catch (error) {
      console.error('Error seeding job roles:', error)
      alert(error.message || 'Failed to seed job roles')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.code.trim()) {
      alert('Please fill job role name and code')
      return
    }

    try {
      if (modalMode === 'add') {
        const { error } = await supabase
          .from('job_roles')
          .insert([
            {
              org_id: orgId,
              name: formData.name.trim(),
              code: formData.code.trim(),
              description: formData.description.trim() || null,
              department: formData.department.trim() || null,
              is_active: formData.is_active,
            },
          ])
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('job_roles')
          .update({
            name: formData.name.trim(),
            code: formData.code.trim(),
            description: formData.description.trim() || null,
            department: formData.department.trim() || null,
            is_active: formData.is_active,
          })
          .eq('id', selectedJobRole.id)
        if (error) throw error
      }

      setShowModal(false)
      await fetchJobRoles(true)
    } catch (error) {
      console.error('Error saving job role:', error)
      alert(error.message || 'Failed to save job role')
    }
  }

  const filteredJobRoles = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return jobRoles
    return jobRoles.filter(
      (r) =>
        (r.name || '').toLowerCase().includes(q) ||
        (r.code || '').toLowerCase().includes(q) ||
        (r.department || '').toLowerCase().includes(q)
    )
  }, [jobRoles, searchTerm])

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
            <h1 className="text-2xl font-bold text-gray-900">
              {lang === 'ar' ? 'إدارة الوظائف' : 'Job Role Master'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {lang === 'ar' ? 'إدارة أدوار الوظائف والأقسام' : 'Manage job roles and departments'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchJobRoles(true)}
              disabled={refreshing}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title={lang === 'ar' ? 'تحديث' : 'Refresh'}
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleSeedPredefinedRoles}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <Briefcase className="w-4 h-4" />
              <span className="hidden sm:inline">{lang === 'ar' ? 'إضافة الأدوار المعرّفة' : 'Seed Roles'}</span>
            </button>
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg flex items-center gap-2 transition-all shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">{lang === 'ar' ? 'إضافة دور' : 'Add Role'}</span>
            </button>
          </div>
        </div>

        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={lang === 'ar' ? 'ابحث عن الأدوار...' : 'Search job roles...'}
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-blue-600 to-purple-600">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  {lang === 'ar' ? 'الاسم' : 'Name'}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  {lang === 'ar' ? 'الرمز' : 'Code'}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  {lang === 'ar' ? 'القسم' : 'Department'}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  {lang === 'ar' ? 'الوصف' : 'Description'}
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-white uppercase tracking-wider">
                  {lang === 'ar' ? 'الحالة' : 'Status'}
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-white uppercase tracking-wider">
                  {lang === 'ar' ? 'الإجراءات' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredJobRoles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Briefcase className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p>{lang === 'ar' ? 'لا توجد أدوار وظيفية' : 'No job roles found'}</p>
                  </td>
                </tr>
              ) : (
                filteredJobRoles.map((role, index) => (
                  <tr
                    key={role.id}
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-gray-900">{role.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-mono bg-gray-100 text-gray-700 rounded">
                        {role.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{role.department || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{role.description || '—'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center px-3 py-1.5 rounded-lg font-semibold text-xs border ${
                          role.is_active
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-gray-100 text-gray-700 border-gray-200'
                        }`}
                      >
                        {role.is_active
                          ? lang === 'ar'
                            ? 'نشط'
                            : 'Active'
                          : lang === 'ar'
                          ? 'غير نشط'
                          : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(role)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title={lang === 'ar' ? 'تعديل' : 'Edit'}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(role)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title={lang === 'ar' ? 'حذف' : 'Delete'}
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

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
              <h3 className="text-xl font-bold">
                {modalMode === 'add'
                  ? lang === 'ar'
                    ? 'إضافة دور وظيفي'
                    : 'Add Job Role'
                  : lang === 'ar'
                  ? 'تعديل دور وظيفي'
                  : 'Edit Job Role'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {lang === 'ar' ? 'الاسم' : 'Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={lang === 'ar' ? 'مثال: خادمة الغرف' : 'e.g., Room Attendant'}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {lang === 'ar' ? 'الرمز' : 'Code'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder={lang === 'ar' ? 'مثال: ROOM-ATT' : 'e.g., ROOM-ATT'}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {lang === 'ar' ? 'القسم' : 'Department'}
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder={lang === 'ar' ? 'مثال: التدبير المنزلي' : 'e.g., Housekeeping'}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {lang === 'ar' ? 'الوصف' : 'Description'}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={lang === 'ar' ? 'وصف الدور الوظيفي...' : 'Job role description...'}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm font-semibold text-gray-700">
                  {lang === 'ar' ? 'نشط' : 'Active'}
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all"
                >
                  {modalMode === 'add'
                    ? lang === 'ar'
                      ? 'إضافة'
                      : 'Add'
                    : lang === 'ar'
                    ? 'حفظ'
                    : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
