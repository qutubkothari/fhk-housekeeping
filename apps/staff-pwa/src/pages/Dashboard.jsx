import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { DoorOpen, ClipboardCheck, Package, AlertCircle, Shirt, Wrench, TrendingUp, Users } from 'lucide-react'
import { translations } from '../translations'

export default function Dashboard({ user, lang = 'en' }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const t = (key) => translations[key]?.[lang] || translations[key]?.en || key

  useEffect(() => {
    fetchDashboardStats()
  }, [user?.org_id])

  const fetchDashboardStats = async () => {
    if (!user?.org_id) return

    try {
      // Fetch rooms data
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('status')
        .eq('org_id', user.org_id)

      if (roomsError) throw roomsError

      // Count room statuses
      const roomStats = {
        total: rooms?.length || 0,
        vacant: rooms?.filter(r => r.status === 'vacant').length || 0,
        occupied: rooms?.filter(r => r.status === 'occupied').length || 0,
        cleaning: rooms?.filter(r => r.status === 'cleaning').length || 0,
        maintenance: rooms?.filter(r => r.status === 'maintenance').length || 0,
      }

      // Fetch activity assignments for today (new flow)
      const today = new Date().toISOString().split('T')[0]

      let tasks = []
      const { data: tasksData, error: tasksError } = await supabase
        .from('activity_assignments')
        .select('status, created_at')
        .eq('org_id', user.org_id)
        .gte('created_at', today)

      if (tasksError) {
        console.warn('Dashboard: activity_assignments unavailable:', tasksError)
      } else {
        tasks = tasksData || []
      }

      const taskStats = {
        completed: tasks.filter(t => t.status === 'completed').length,
        pending: tasks.filter(t => ['pending', 'assigned', 'in_progress'].includes(t.status)).length,
      }

      // Fetch service requests (optional table in some installs)
      let requests = []
      const { data: requestsData, error: requestsError } = await supabase
        .from('service_requests')
        .select('status, priority')
        .eq('org_id', user.org_id)
        .in('status', ['pending', 'in_progress'])

      if (requestsError) {
        console.warn('Dashboard: service_requests unavailable:', requestsError)
      } else {
        requests = requestsData || []
      }

      const requestStats = {
        open: requests.length,
        urgent: requests.filter(r => r.priority === 'high').length,
      }

      setStats({
        rooms: roomStats,
        tasks_today: taskStats,
        service_requests: requestStats,
        inventory: { low_stock_items: 0 }, // Placeholder
        linen: { clean: 0, soiled: 0, in_laundry: 0 } // Placeholder
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
      </div>
    )
  }

  const statCards = [
    {
      title: t('totalRooms'),
      value: stats?.rooms?.total || 0,
      subtitle: `${stats?.rooms?.vacant || 0} ${t('vacant')}`,
      icon: DoorOpen,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: t('tasksToday'),
      value: stats?.tasks_today?.completed || 0,
      subtitle: `${stats?.tasks_today?.pending || 0} ${t('pending')}`,
      icon: ClipboardCheck,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: t('serviceRequests'),
      value: stats?.service_requests?.open || 0,
      subtitle: `${stats?.service_requests?.urgent || 0} ${t('urgent')}`,
      icon: Wrench,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    },
    {
      title: t('lowStockItems'),
      value: stats?.inventory?.low_stock_items || 0,
      subtitle: t('inventoryAlert'),
      icon: Package,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600'
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-2">{t('welcomeBack')}, {user?.full_name}!</h1>
        <p className="text-blue-100">{t('happeningToday')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
              <p className={`text-4xl font-bold ${stat.textColor} mb-2`}>{stat.value}</p>
              <p className="text-xs text-gray-400">{stat.subtitle}</p>
            </div>
            <div className={`h-1 bg-gradient-to-r ${stat.color}`}></div>
          </div>
        ))}
      </div>

      {/* Room Status Overview */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">{t('roomStatusOverview')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: t('total'), value: stats?.rooms?.total || 0, color: 'from-gray-500 to-gray-600', bg: 'bg-gray-50' },
            { label: t('occupied'), value: stats?.rooms?.occupied || 0, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50' },
            { label: t('vacant'), value: stats?.rooms?.vacant || 0, color: 'from-green-500 to-green-600', bg: 'bg-green-50' },
            { label: t('cleaning'), value: stats?.rooms?.cleaning || 0, color: 'from-yellow-500 to-yellow-600', bg: 'bg-yellow-50' },
            { label: t('maintenance'), value: stats?.rooms?.maintenance || 0, color: 'from-red-500 to-red-600', bg: 'bg-red-50' },
          ].map((item, index) => (
            <div key={index} className={`text-center p-6 ${item.bg} rounded-xl border-2 border-transparent hover:border-gray-300 transition-all`}>
              <p className={`text-4xl font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent mb-2`}>
                {item.value}
              </p>
              <p className="text-sm font-medium text-gray-600">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Linen & Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg">
              <Shirt className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">{t('linenManagement')}</h2>
          </div>
          <div className="space-y-4">
            {[
              { label: t('clean'), value: stats?.linen?.clean || 0, color: 'text-green-600', bg: 'bg-green-50' },
              { label: t('soiled'), value: stats?.linen?.soiled || 0, color: 'text-yellow-600', bg: 'bg-yellow-50' },
              { label: t('inLaundry'), value: stats?.linen?.in_laundry || 0, color: 'text-blue-600', bg: 'bg-blue-50' },
            ].map((item, index) => (
              <div key={index} className={`flex justify-between items-center p-4 ${item.bg} rounded-lg`}>
                <span className="font-medium text-gray-700">{item.label}</span>
                <span className={`text-2xl font-bold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">{t('alerts')}</h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-red-800">{t('lowStockItems')}</p>
                  <p className="text-sm text-red-600 mt-1">
                    {stats?.inventory?.low_stock_items || 0} items need reordering
                  </p>
                </div>
                <Package className="w-8 h-8 text-red-500" />
              </div>
            </div>
            <div className="p-4 bg-orange-50 border-l-4 border-orange-500 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-orange-800">{t('urgent')} {t('serviceRequests')}</p>
                  <p className="text-sm text-orange-600 mt-1">
                    {stats?.service_requests?.urgent || 0} high priority tasks
                  </p>
                </div>
                <Wrench className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
