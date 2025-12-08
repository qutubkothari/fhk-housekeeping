import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Building2, Mail, Phone, Globe, Save, Check, AlertCircle } from 'lucide-react'

export default function Settings({ user }) {
  const [loading, setLoading] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [orgData, setOrgData] = useState({
    name: '',
    address: '',
    phone: '',
    email: ''
  })

  useEffect(() => {
    if (user?.org_id) {
      fetchOrganizationData()
    }
  }, [user?.org_id])

  const fetchOrganizationData = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', user.org_id)
        .single()

      if (error) throw error
      if (data) {
        setOrgData({
          name: data.name || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || ''
        })
      }
    } catch (error) {
      console.error('Error fetching organization:', error)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setSaveMessage('')
    try {
      const { error } = await supabase
        .from('organizations')
        .update(orgData)
        .eq('id', user.org_id)

      if (error) throw error
      setSaveMessage('Settings saved successfully!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('Error saving:', error)
      setSaveMessage('Error saving settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage organization settings and preferences</p>
      </div>

      {/* Organization Settings */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Organization Information</h2>
        </div>

        <div className="space-y-6">
          {/* Organization Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Organization Name
            </label>
            <input
              type="text"
              value={orgData.name}
              onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter organization name"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Address
            </label>
            <textarea
              value={orgData.address}
              onChange={(e) => setOrgData({ ...orgData, address: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter full address"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="tel"
                value={orgData.phone}
                onChange={(e) => setOrgData({ ...orgData, phone: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="+966 50 000 0000"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={orgData.email}
                onChange={(e) => setOrgData({ ...orgData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="info@hotel.com"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold flex items-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>

            {saveMessage && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                saveMessage.includes('Error') 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-green-100 text-green-700'
              }`}>
                {saveMessage.includes('Error') ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <Check className="w-5 h-5" />
                )}
                {saveMessage}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">System Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Organization ID</p>
            <p className="font-mono text-sm text-gray-900 mt-1">{user.org_id}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Your Role</p>
            <p className="font-semibold text-gray-900 mt-1 capitalize">{user.role}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">User ID</p>
            <p className="font-mono text-sm text-gray-900 mt-1">{user.id}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Your Name</p>
            <p className="font-semibold text-gray-900 mt-1">{user.full_name}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
