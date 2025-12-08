import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { 
  BarChart3, TrendingUp, Package, Shirt, Wrench, Clock,
  CheckCircle, AlertTriangle, Activity, RefreshCw, Download
} from 'lucide-react'
import Select from 'react-select'
import { customSelectStyles } from '../utils/selectStyles'

export default function Reports({ user }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState('7days')
  
  const [overviewStats, setOverviewStats] = useState({
    rooms: { total: 0, occupied: 0, vacant: 0, cleaning: 0, maintenance: 0 },
    tasks: { total: 0, completed: 0, pending: 0, in_progress: 0 },
    requests: { total: 0, resolved: 0, pending: 0, in_progress: 0 },
    inventory: { total: 0, low_stock: 0, out_of_stock: 0 }
  })

  useEffect(() => {
    if (user?.org_id) {
      fetchOverviewStats()
    }
  }, [user?.org_id, dateRange])

  const getDateFilter = () => {
    const days = { '7days': 7, '30days': 30, '90days': 90, 'all': null }[dateRange]
    if (!days) return null
    const date = new Date()
    date.setDate(date.getDate() - days)
    return date.toISOString()
  }

  const fetchOverviewStats = async () => {
    setLoading(true)
    try {
      const dateFilter = getDateFilter()

      // Rooms stats
      const { data: rooms } = await supabase
        .from('rooms')
        .select('status')
        .eq('org_id', user.org_id)

      // Tasks stats
      let taskQuery = supabase
        .from('housekeeping_tasks')
        .select('status')
        .eq('org_id', user.org_id)
      if (dateFilter) taskQuery = taskQuery.gte('created_at', dateFilter)
      const { data: tasks } = await taskQuery

      // Service requests stats
      let requestQuery = supabase
        .from('service_requests')
        .select('status')
        .eq('org_id', user.org_id)
      if (dateFilter) requestQuery = requestQuery.gte('created_at', dateFilter)
      const { data: requests } = await requestQuery

      // Inventory stats
      const { data: inventory } = await supabase
        .from('inventory_items')
        .select('current_stock, reorder_level')
        .eq('org_id', user.org_id)

      setOverviewStats({
        rooms: {
          total: rooms?.length || 0,
          occupied: rooms?.filter(r => r.status === 'occupied').length || 0,
          vacant: rooms?.filter(r => r.status === 'vacant').length || 0,
          cleaning: rooms?.filter(r => r.status === 'cleaning').length || 0,
          maintenance: rooms?.filter(r => r.status === 'maintenance').length || 0,
        },
        tasks: {
          total: tasks?.length || 0,
          completed: tasks?.filter(t => t.status === 'completed').length || 0,
          pending: tasks?.filter(t => t.status === 'pending').length || 0,
          in_progress: tasks?.filter(t => t.status === 'in_progress').length || 0,
        },
        requests: {
          total: requests?.length || 0,
          resolved: requests?.filter(r => r.status === 'resolved').length || 0,
          pending: requests?.filter(r => r.status === 'pending').length || 0,
          in_progress: requests?.filter(r => r.status === 'in_progress').length || 0,
        },
        inventory: {
          total: inventory?.length || 0,
          low_stock: inventory?.filter(i => i.current_stock <= i.reorder_level).length || 0,
          out_of_stock: inventory?.filter(i => i.current_stock === 0).length || 0,
        }
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
  ]

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div></div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Performance metrics and insights</p>
        </div>
        <div className="flex gap-3">
          <Select
            value={{ value: dateRange, label: dateRange === '7days' ? 'Last 7 Days' : dateRange === '30days' ? 'Last 30 Days' : dateRange === '90days' ? 'Last 90 Days' : 'All Time' }}
            onChange={(option) => setDateRange(option?.value || '30days')}
            options={[
              { value: '7days', label: 'Last 7 Days' },
              { value: '30days', label: 'Last 30 Days' },
              { value: '90days', label: 'Last 90 Days' },
              { value: 'all', label: 'All Time' }
            ]}
            styles={customSelectStyles}
            isSearchable={false}
            className="min-w-[160px]"
          />
          <button
            onClick={fetchOverviewStats}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg flex items-center gap-2 hover:shadow-lg transition-all"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Overview Section */}
      <div className="space-y-6">
        {/* Rooms Overview */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Rooms Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Total', value: overviewStats.rooms.total, color: 'from-gray-500 to-gray-600', icon: Activity },
              { label: 'Vacant', value: overviewStats.rooms.vacant, color: 'from-green-500 to-green-600', icon: CheckCircle },
              { label: 'Occupied', value: overviewStats.rooms.occupied, color: 'from-blue-500 to-blue-600', icon: Activity },
              { label: 'Cleaning', value: overviewStats.rooms.cleaning, color: 'from-yellow-500 to-yellow-600', icon: Clock },
              { label: 'Maintenance', value: overviewStats.rooms.maintenance, color: 'from-orange-500 to-orange-600', icon: Wrench },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className={`w-20 h-20 mx-auto mb-2 bg-gradient-to-br ${stat.color} rounded-full flex items-center justify-center`}>
                  <stat.icon className="w-10 h-10 text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Housekeeping Overview */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Housekeeping Tasks</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Tasks', value: overviewStats.tasks.total, color: 'from-purple-500 to-purple-600' },
              { label: 'Completed', value: overviewStats.tasks.completed, color: 'from-green-500 to-green-600' },
              { label: 'In Progress', value: overviewStats.tasks.in_progress, color: 'from-blue-500 to-blue-600' },
              { label: 'Pending', value: overviewStats.tasks.pending, color: 'from-yellow-500 to-yellow-600' },
            ].map((stat, i) => (
              <div key={i} className="p-4 border-2 border-gray-200 rounded-lg">
                <p className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1`}>
                  {stat.value}
                </p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Service Requests Overview */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Service Requests</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Requests', value: overviewStats.requests.total, color: 'from-indigo-500 to-indigo-600' },
              { label: 'Resolved', value: overviewStats.requests.resolved, color: 'from-green-500 to-green-600' },
              { label: 'In Progress', value: overviewStats.requests.in_progress, color: 'from-blue-500 to-blue-600' },
              { label: 'Pending', value: overviewStats.requests.pending, color: 'from-red-500 to-red-600' },
            ].map((stat, i) => (
              <div key={i} className="p-4 border-2 border-gray-200 rounded-lg">
                <p className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1`}>
                  {stat.value}
                </p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory Overview */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Inventory Status</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Items', value: overviewStats.inventory.total, color: 'from-blue-500 to-blue-600', icon: Package },
              { label: 'Low Stock', value: overviewStats.inventory.low_stock, color: 'from-yellow-500 to-yellow-600', icon: AlertTriangle },
              { label: 'Out of Stock', value: overviewStats.inventory.out_of_stock, color: 'from-red-500 to-red-600', icon: AlertTriangle },
            ].map((stat, i) => (
              <div key={i} className="p-6 border-2 border-gray-200 rounded-lg text-center">
                <div className={`w-16 h-16 mx-auto mb-3 bg-gradient-to-br ${stat.color} rounded-full flex items-center justify-center`}>
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <p className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1`}>
                  {stat.value}
                </p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
