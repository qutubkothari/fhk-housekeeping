import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabaseClient'
import { DoorOpen, ClipboardCheck, Package, AlertCircle, Shirt, Wrench } from 'lucide-react'

export default function Dashboard() {
  const { t } = useTranslation()
  const { orgId } = useAuthStore()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [orgId])

  const fetchDashboardStats = async () => {
    if (!orgId) return

    try {
      const { data, error } = await supabase.rpc('get_dashboard_stats', {
        p_org_id: orgId,
      })

      if (error) throw error
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const statCards = [
    {
      title: t('rooms'),
      value: stats?.rooms?.total || 0,
      subtitle: `${stats?.rooms?.vacant || 0} ${t('vacant')}`,
      icon: DoorOpen,
      color: 'bg-blue-500',
    },
    {
      title: t('tasks') + ' ' + t('today'),
      value: stats?.tasks_today?.completed || 0,
      subtitle: `${stats?.tasks_today?.pending || 0} ${t('pending')}`,
      icon: ClipboardCheck,
      color: 'bg-green-500',
    },
    {
      title: t('service_requests'),
      value: stats?.service_requests?.open || 0,
      subtitle: `${stats?.service_requests?.urgent || 0} ${t('urgent')}`,
      icon: Wrench,
      color: 'bg-orange-500',
    },
    {
      title: t('low_stock_alert'),
      value: stats?.inventory?.low_stock_items || 0,
      subtitle: t('inventory_management'),
      icon: Package,
      color: 'bg-red-500',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('dashboard')}</h1>
        <p className="text-gray-600 mt-2">{t('overview')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="card hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-2">{stat.subtitle}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Room Status Overview */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">{t('room_status')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: t('total'), value: stats?.rooms?.total || 0, color: 'text-gray-700' },
            { label: t('occupied'), value: stats?.rooms?.occupied || 0, color: 'text-blue-600' },
            { label: t('vacant'), value: stats?.rooms?.vacant || 0, color: 'text-green-600' },
            { label: t('cleaning'), value: stats?.rooms?.cleaning || 0, color: 'text-yellow-600' },
            { label: t('maintenance'), value: stats?.rooms?.maintenance || 0, color: 'text-red-600' },
          ].map((item, index) => (
            <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
              <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-sm text-gray-600 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Linen Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Shirt className="w-5 h-5 text-primary-600" />
            <h2 className="text-xl font-semibold">{t('linen_management')}</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">{t('clean')}</span>
              <span className="font-semibold text-green-600">{stats?.linen?.clean || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">{t('soiled')}</span>
              <span className="font-semibold text-yellow-600">{stats?.linen?.soiled || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">{t('in_laundry')}</span>
              <span className="font-semibold text-blue-600">{stats?.linen?.in_laundry || 0}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <h2 className="text-xl font-semibold">{t('low_stock_alert')}</h2>
          </div>
          <p className="text-gray-600">
            {stats?.inventory?.low_stock_items || 0} {t('items')} {t('reorder_now')}
          </p>
        </div>
      </div>
    </div>
  )
}
