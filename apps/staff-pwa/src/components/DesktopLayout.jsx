import React, { useState, useEffect } from 'react'
import { 
  LayoutDashboard, 
  BedDouble, 
  Users, 
  ClipboardList, 
  Wrench,
  Package,
  Shirt,
  FileText,
  Settings,
  Monitor,
  Calendar,
  BarChart3,
  Menu,
  X,
  LogOut,
  Languages
} from 'lucide-react'
import { translations } from '../translations'

const DesktopLayout = ({ user, children, currentPage, onNavigate, onSignOut, lang, onLangChange }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
  const t = (key) => translations[key]?.[lang] || translations[key]?.en || key

  const toggleLanguage = () => {
    const newLang = lang === 'en' ? 'ar' : 'en'
    onLangChange(newLang)
    document.body.dir = newLang === 'ar' ? 'rtl' : 'ltr'
  }

  // Define menu items based on role
  const getMenuItems = () => {
    const allMenuItems = [
      { id: 'dashboard', label: lang === 'ar' ? 'لوحة التحكم' : 'Dashboard', icon: LayoutDashboard, roles: ['super_admin'] },
      { id: 'rooms', label: lang === 'ar' ? 'الغرف' : 'Rooms', icon: BedDouble, roles: ['super_admin'] },
      { id: 'staff', label: lang === 'ar' ? 'إدارة الموظفين' : 'Staff Management', icon: Users, roles: ['super_admin'] },
      { id: 'housekeeping', label: lang === 'ar' ? 'التدبير المنزلي' : 'Housekeeping', icon: ClipboardList, roles: ['super_admin'] },
      { id: 'maintenance', label: t('maintenance'), icon: Wrench, roles: ['super_admin'] },
      { id: 'inventory', label: lang === 'ar' ? 'المخزون' : 'Inventory', icon: Package, roles: ['super_admin', 'inventory'] },
      { id: 'linen', label: lang === 'ar' ? 'الغسيل والبياضات' : 'Linen & Laundry', icon: Shirt, roles: ['super_admin', 'laundry'] },
      { id: 'reports', label: lang === 'ar' ? 'التقارير' : 'Reports', icon: FileText, roles: ['super_admin'] },
      { id: 'realtime', label: lang === 'ar' ? 'المراقبة الفورية' : 'Real-Time Monitor', icon: Monitor, roles: ['super_admin'] },
      { id: 'assignments', label: lang === 'ar' ? 'تعيينات الموظفين' : 'Staff Assignments', icon: Calendar, roles: ['super_admin'] },
      { id: 'analytics', label: lang === 'ar' ? 'التحليلات' : 'Analytics', icon: BarChart3, roles: ['super_admin'] },
      { id: 'settings', label: lang === 'ar' ? 'الإعدادات' : 'Settings', icon: Settings, roles: ['super_admin'] },
    ]

    return allMenuItems.filter(item => item.roles.includes(user.role))
  }

  const menuItems = getMenuItems()
  
  // Check if user has access to current page and redirect if needed
  useEffect(() => {
    const hasAccess = menuItems.some(item => item.id === currentPage)
    if (!hasAccess && menuItems.length > 0) {
      onNavigate(menuItems[0].id)
    }
  }, [currentPage, menuItems, onNavigate])

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-all duration-300 flex flex-col shadow-2xl`}>
        {/* Logo & Toggle */}
        <div className="p-4 flex items-center justify-between border-b border-slate-700">
          {sidebarOpen && (
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                FHK Hotels
              </h1>
              <p className="text-xs text-slate-400">Management System</p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* User Info */}
        <div className={`p-4 border-b border-slate-700 ${!sidebarOpen && 'flex justify-center'}`}>
          <div className={`flex items-center gap-3 ${!sidebarOpen && 'flex-col'}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{user.full_name}</p>
                <p className="text-xs text-slate-400 capitalize">{user.role.replace('_', ' ')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id
            
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-all ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                } ${!sidebarOpen && 'justify-center'}`}
              >
                <Icon size={20} />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* Sign Out Button */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={onSignOut}
            className={`w-full flex items-center gap-3 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors ${!sidebarOpen && 'justify-center'}`}
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="text-sm font-medium">{t('signOut')}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 capitalize">
                  {menuItems.find(item => item.id === currentPage)?.label || 'Dashboard'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Language Toggle */}
                <button
                  onClick={toggleLanguage}
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors flex items-center gap-2 text-gray-700"
                  title={lang === 'ar' ? 'Switch to English' : 'Switch to Arabic'}
                >
                  <Languages size={18} />
                  <span className="text-sm font-medium">{lang === 'ar' ? 'EN' : 'AR'}</span>
                </button>
                
                <span className={`px-4 py-2 rounded-full text-xs font-semibold ${
                  user.role === 'super_admin' ? 'bg-indigo-100 text-indigo-700' :
                  user.role === 'inventory' ? 'bg-green-100 text-green-700' :
                  'bg-pink-100 text-pink-700'
                }`}>
                  {user.role === 'super_admin' ? (lang === 'ar' ? 'مدير' : 'Administrator') : 
                   user.role === 'inventory' ? (lang === 'ar' ? 'مدير المخزون' : 'Inventory Manager') : 
                   (lang === 'ar' ? 'مدير الغسيل' : 'Laundry Manager')}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}

export default DesktopLayout
