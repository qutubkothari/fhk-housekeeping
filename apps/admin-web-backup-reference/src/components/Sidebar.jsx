import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  Activity,
  Package,
  ShoppingCart,
  DoorOpen,
  ClipboardList,
  Package as InventoryIcon,
  Shirt,
  Wrench,
  Users,
  FileText,
  Settings,
} from 'lucide-react'

export default function Sidebar() {
  const { t } = useTranslation()

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: t('dashboard') },
    { path: '/monitor', icon: Activity, label: 'Live Monitor' },
    { path: '/assets', icon: Package, label: 'Assets' },
    { path: '/staff-carts', icon: ShoppingCart, label: 'Staff Carts' },
    { path: '/rooms', icon: DoorOpen, label: t('rooms') },
    { path: '/housekeeping', icon: ClipboardList, label: t('housekeeping') },
    { path: '/inventory', icon: InventoryIcon, label: t('inventory') },
    { path: '/linen', icon: Shirt, label: t('linen') },
    { path: '/service-requests', icon: Wrench, label: t('service_requests') },
    { path: '/staff', icon: Users, label: t('staff') },
    { path: '/reports', icon: FileText, label: t('reports') },
    { path: '/settings', icon: Settings, label: t('settings') },
  ]

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-primary-600">FHK</h1>
        <p className="text-sm text-gray-600 mt-1">{t('housekeeping')}</p>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
