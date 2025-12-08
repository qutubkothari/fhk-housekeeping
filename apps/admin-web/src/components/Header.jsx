import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Bell, Globe, LogOut, User } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabaseClient'

export default function Header() {
  const { t, i18n } = useTranslation()
  const { user, signOut } = useAuthStore()
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    fetchUserData()
    fetchNotifications()
  }, [user])

  const fetchUserData = async () => {
    if (!user) return
    const { data } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single()
    if (data) setUserName(data.full_name)
  }

  const fetchNotifications = async () => {
    if (!user) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(5)
    if (data) setNotifications(data)
  }

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en'
    i18n.changeLanguage(newLang)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-800">
            {t('welcome')}, {userName || t('user')}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {new Date().toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title={t('language')}
          >
            <Globe className="w-5 h-5 text-gray-600" />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold">{t('notifications')}</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-center text-gray-500">{t('no_notifications')}</p>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      >
                        <p className="font-medium text-sm">
                          {i18n.language === 'ar' && notif.title_ar ? notif.title_ar : notif.title}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {i18n.language === 'ar' && notif.message_ar ? notif.message_ar : notif.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(notif.created_at).toLocaleString(i18n.language)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title={t('logout')}
            >
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
