import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/stores/authStore'
import { 
  Building2, User, Bell, Globe, Clock, DollarSign, 
  Save, RefreshCw, Mail, Phone, Lock, Key, Shield,
  MapPin, Calendar, Settings as SettingsIcon, Check
} from 'lucide-react'

export default function Settings() {
  const { t } = useTranslation()
  const { orgId, user } = useAuthStore()

  const [activeTab, setActiveTab] = useState('organization')
  const [loading, setLoading] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  // Organization Data
  const [orgData, setOrgData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    settings: {
      currency: 'SAR',
      timezone: 'Asia/Riyadh',
      default_language: 'ar',
      business_hours: {
        start: '06:00',
        end: '23:00'
      }
    }
  })

  // User Profile Data
  const [profileData, setProfileData] = useState({
    full_name: '',
    full_name_ar: '',
    email: '',
    phone: '',
    preferred_language: 'ar'
  })

  // Password Change
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })

  useEffect(() => {
    fetchOrganizationData()
    fetchUserProfile()
  }, [orgId, user])

  const fetchOrganizationData = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single()

      if (error) throw error
      if (data) {
        setOrgData({
          name: data.name || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          settings: data.settings || {
            currency: 'SAR',
            timezone: 'Asia/Riyadh',
            default_language: 'ar',
            business_hours: { start: '06:00', end: '23:00' }
          }
        })
      }
    } catch (error) {
      console.error('Error fetching organization:', error)
    }
  }

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      if (data) {
        setProfileData({
          full_name: data.full_name || '',
          full_name_ar: data.full_name_ar || '',
          email: data.email || '',
          phone: data.phone || '',
          preferred_language: data.preferred_language || 'ar'
        })
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const saveOrganization = async () => {
    setLoading(true)
    setSaveMessage('')
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: orgData.name,
          address: orgData.address,
          phone: orgData.phone,
          email: orgData.email,
          settings: orgData.settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', orgId)

      if (error) throw error
      
      setSaveMessage('Organization settings saved successfully!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('Error saving organization:', error)
      alert('Failed to save organization settings')
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    setLoading(true)
    setSaveMessage('')
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: profileData.full_name,
          full_name_ar: profileData.full_name_ar,
          phone: profileData.phone,
          preferred_language: profileData.preferred_language,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error
      
      setSaveMessage('Profile updated successfully!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save profile')
    } finally {
      setLoading(false)
    }
  }

  const changePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      alert('New passwords do not match!')
      return
    }

    if (passwordData.new_password.length < 8) {
      alert('Password must be at least 8 characters long')
      return
    }

    setLoading(true)
    setSaveMessage('')
    try {
      // Update password using Supabase function
      const { error } = await supabase.rpc('change_user_password', {
        p_user_id: user.id,
        p_old_password: passwordData.current_password,
        p_new_password: passwordData.new_password
      })

      if (error) throw error
      
      setSaveMessage('Password changed successfully!')
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      })
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('Error changing password:', error)
      alert('Failed to change password. Please check your current password.')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'organization', label: 'Organization', icon: Building2 },
    { id: 'profile', label: 'User Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: SettingsIcon }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('settings')}</h1>
        <p className="text-gray-600 mt-1">Manage system settings and preferences</p>
      </div>

      {/* Success Message */}
      {saveMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-green-600" />
          <span className="text-green-800">{saveMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-1 p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Organization Tab */}
          {activeTab === 'organization' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-lg font-semibold mb-4">Organization Information</h3>
                <div className="space-y-4">
                  {/* Organization Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Organization Name *
                      </div>
                    </label>
                    <input
                      type="text"
                      value={orgData.name}
                      onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Hotel Name"
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Address
                      </div>
                    </label>
                    <textarea
                      value={orgData.address}
                      onChange={(e) => setOrgData({ ...orgData, address: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Street, City, Country"
                    />
                  </div>

                  {/* Phone & Email */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Phone
                        </div>
                      </label>
                      <input
                        type="tel"
                        value={orgData.phone}
                        onChange={(e) => setOrgData({ ...orgData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="+966 50 123 4567"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Email
                        </div>
                      </label>
                      <input
                        type="email"
                        value={orgData.email}
                        onChange={(e) => setOrgData({ ...orgData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="contact@hotel.com"
                      />
                    </div>
                  </div>

                  {/* System Settings */}
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-4">System Settings</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* Currency */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Currency
                          </div>
                        </label>
                        <select
                          value={orgData.settings.currency}
                          onChange={(e) => setOrgData({
                            ...orgData,
                            settings: { ...orgData.settings, currency: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="SAR">SAR - Saudi Riyal</option>
                          <option value="USD">USD - US Dollar</option>
                          <option value="EUR">EUR - Euro</option>
                          <option value="AED">AED - UAE Dirham</option>
                        </select>
                      </div>

                      {/* Timezone */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Timezone
                          </div>
                        </label>
                        <select
                          value={orgData.settings.timezone}
                          onChange={(e) => setOrgData({
                            ...orgData,
                            settings: { ...orgData.settings, timezone: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Asia/Riyadh">Asia/Riyadh (GMT+3)</option>
                          <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                          <option value="Europe/London">Europe/London (GMT+0)</option>
                          <option value="America/New_York">America/New_York (GMT-5)</option>
                        </select>
                      </div>

                      {/* Default Language */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            Default Language
                          </div>
                        </label>
                        <select
                          value={orgData.settings.default_language}
                          onChange={(e) => setOrgData({
                            ...orgData,
                            settings: { ...orgData.settings, default_language: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="ar">Arabic</option>
                          <option value="en">English</option>
                        </select>
                      </div>

                      {/* Business Hours */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Business Hours
                          </div>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={orgData.settings.business_hours.start}
                            onChange={(e) => setOrgData({
                              ...orgData,
                              settings: {
                                ...orgData.settings,
                                business_hours: {
                                  ...orgData.settings.business_hours,
                                  start: e.target.value
                                }
                              }
                            })}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-gray-500">to</span>
                          <input
                            type="time"
                            value={orgData.settings.business_hours.end}
                            onChange={(e) => setOrgData({
                              ...orgData,
                              settings: {
                                ...orgData.settings,
                                business_hours: {
                                  ...orgData.settings.business_hours,
                                  end: e.target.value
                                }
                              }
                            })}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-4">
                    <button
                      onClick={saveOrganization}
                      disabled={loading}
                      className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <Save className="w-5 h-5" />
                      )}
                      Save Organization Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* User Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                <div className="space-y-4">
                  {/* Full Names */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name (English) *
                      </label>
                      <input
                        type="text"
                        value={profileData.full_name}
                        onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name (Arabic)
                      </label>
                      <input
                        type="text"
                        value={profileData.full_name_ar}
                        onChange={(e) => setProfileData({ ...profileData, full_name_ar: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="جون دو"
                      />
                    </div>
                  </div>

                  {/* Email (Read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email
                      </div>
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Phone Number
                      </div>
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="+966 50 123 4567"
                    />
                  </div>

                  {/* Preferred Language */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Preferred Language
                      </div>
                    </label>
                    <select
                      value={profileData.preferred_language}
                      onChange={(e) => setProfileData({ ...profileData, preferred_language: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ar">Arabic</option>
                      <option value="en">English</option>
                    </select>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-4">
                    <button
                      onClick={saveProfile}
                      disabled={loading}
                      className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <Save className="w-5 h-5" />
                      )}
                      Save Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-lg font-semibold mb-4">Change Password</h3>
                <div className="space-y-4">
                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Current Password
                      </div>
                    </label>
                    <input
                      type="password"
                      value={passwordData.current_password}
                      onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter current password"
                    />
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        New Password
                      </div>
                    </label>
                    <input
                      type="password"
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter new password (min 8 characters)"
                    />
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        Confirm New Password
                      </div>
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Confirm new password"
                    />
                  </div>

                  {/* Password Requirements */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Password Requirements:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• At least 8 characters long</li>
                      <li>• Contains uppercase and lowercase letters (recommended)</li>
                      <li>• Contains numbers (recommended)</li>
                      <li>• Contains special characters (recommended)</li>
                    </ul>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-4">
                    <button
                      onClick={changePassword}
                      disabled={loading}
                      className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <Save className="w-5 h-5" />
                      )}
                      Change Password
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
                <div className="space-y-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start gap-3">
                      <Bell className="w-5 h-5 text-gray-600 mt-1" />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-2">System Notifications</h4>
                        <div className="space-y-3">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              defaultChecked
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Low stock alerts</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              defaultChecked
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Task assignments</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              defaultChecked
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Service request updates</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              defaultChecked
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Daily summary reports</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> Notification preferences are stored locally. 
                      Email and SMS notifications will be available in a future update.
                    </p>
                  </div>
                </div>
              </div>

              {/* Display Preferences */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Display Preferences</h3>
                <div className="space-y-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <div className="space-y-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Show room images in grid view</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Auto-refresh data every 30 seconds</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Show Arabic translations</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
