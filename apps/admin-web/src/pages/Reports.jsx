import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/stores/authStore'
import { 
  BarChart3, TrendingUp, Users, Home, Package, Shirt, 
  Wrench, Calendar, Download, RefreshCw, Filter, Clock,
  CheckCircle, XCircle, AlertTriangle, Activity
} from 'lucide-react'

export default function Reports() {
  const { t } = useTranslation()
  const { orgId } = useAuthStore()

  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState('7days')
  
  // Report Data
  const [overviewStats, setOverviewStats] = useState(null)
  const [housekeepingData, setHousekeepingData] = useState([])
  const [inventoryData, setInventoryData] = useState([])
  const [linenData, setLinenData] = useState([])
  const [serviceRequestData, setServiceRequestData] = useState([])

  useEffect(() => {
    fetchReportData()
  }, [orgId, dateRange, activeTab])

  const getDateRangeFilter = () => {
    const ranges = {
      '7days': 7,
      '30days': 30,
      '90days': 90,
      'all': null
    }
    const days = ranges[dateRange]
    if (!days) return null
    
    const date = new Date()
    date.setDate(date.getDate() - days)
    return date.toISOString()
  }

  const fetchReportData = async () => {
    setLoading(true)
    try {
      switch (activeTab) {
        case 'overview':
          await fetchOverviewStats()
          break
        case 'housekeeping':
          await fetchHousekeepingReport()
          break
        case 'inventory':
          await fetchInventoryReport()
          break
        case 'linen':
          await fetchLinenReport()
          break
        case 'service':
          await fetchServiceRequestReport()
          break
      }
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchOverviewStats = async () => {
    const { data, error } = await supabase.rpc('get_dashboard_stats', {
      p_org_id: orgId
    })
    if (!error) setOverviewStats(data)
  }

  const fetchHousekeepingReport = async () => {
    const dateFilter = getDateRangeFilter()
    let query = supabase
      .from('v_daily_housekeeping_stats')
      .select('*')
      .eq('org_id', orgId)
      .order('scheduled_date', { ascending: false })

    if (dateFilter) {
      query = query.gte('scheduled_date', dateFilter)
    }

    const { data, error } = await query
    if (!error) setHousekeepingData(data || [])
  }

  const fetchInventoryReport = async () => {
    const { data, error } = await supabase
      .from('v_low_stock_items')
      .select('*')
      .eq('org_id', orgId)
      .order('shortage', { ascending: false })

    if (!error) setInventoryData(data || [])
  }

  const fetchLinenReport = async () => {
    const { data, error } = await supabase
      .from('v_linen_stock_status')
      .select('*')
      .eq('org_id', orgId)
      .order('stock_status', { ascending: false })

    if (!error) setLinenData(data || [])
  }

  const fetchServiceRequestReport = async () => {
    const dateFilter = getDateRangeFilter()
    let query = supabase
      .from('service_requests')
      .select(`
        *,
        room:rooms(room_number),
        reporter:reported_by(full_name),
        assignee:assigned_to(full_name)
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })

    if (dateFilter) {
      query = query.gte('created_at', dateFilter)
    }

    const { data, error } = await query
    if (!error) setServiceRequestData(data || [])
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'housekeeping', label: 'Housekeeping', icon: Users },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'linen', label: 'Linen', icon: Shirt },
    { id: 'service', label: 'Service Requests', icon: Wrench }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('reports')}</h1>
          <p className="text-gray-600 mt-1">Analytics and performance reports</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date Range Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>

          <button
            onClick={fetchReportData}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>

          <button
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Download className="w-5 h-5" />
            Export
          </button>
        </div>
      </div>

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
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Loading report data...</div>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && overviewStats && (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-600 font-medium">Total Rooms</p>
                          <p className="text-3xl font-bold text-blue-900 mt-2">{overviewStats.rooms?.total || 0}</p>
                        </div>
                        <Home className="w-10 h-10 text-blue-600 opacity-50" />
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-600 font-medium">Tasks Completed</p>
                          <p className="text-3xl font-bold text-green-900 mt-2">{overviewStats.tasks_today?.completed || 0}</p>
                        </div>
                        <CheckCircle className="w-10 h-10 text-green-600 opacity-50" />
                      </div>
                    </div>

                    <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-orange-600 font-medium">Open Requests</p>
                          <p className="text-3xl font-bold text-orange-900 mt-2">{overviewStats.service_requests?.open || 0}</p>
                        </div>
                        <Wrench className="w-10 h-10 text-orange-600 opacity-50" />
                      </div>
                    </div>

                    <div className="bg-red-50 rounded-lg p-6 border border-red-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-red-600 font-medium">Low Stock Items</p>
                          <p className="text-3xl font-bold text-red-900 mt-2">{overviewStats.inventory?.low_stock_items || 0}</p>
                        </div>
                        <AlertTriangle className="w-10 h-10 text-red-600 opacity-50" />
                      </div>
                    </div>
                  </div>

                  {/* Detailed Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Room Status */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Home className="w-5 h-5 text-blue-600" />
                        Room Status Breakdown
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Occupied</span>
                          <span className="font-semibold text-blue-600">{overviewStats.rooms?.occupied || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Vacant</span>
                          <span className="font-semibold text-green-600">{overviewStats.rooms?.vacant || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Cleaning</span>
                          <span className="font-semibold text-yellow-600">{overviewStats.rooms?.cleaning || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Maintenance</span>
                          <span className="font-semibold text-red-600">{overviewStats.rooms?.maintenance || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Linen Status */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Shirt className="w-5 h-5 text-purple-600" />
                        Linen Status
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Clean Stock</span>
                          <span className="font-semibold text-green-600">{overviewStats.linen?.clean || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Soiled</span>
                          <span className="font-semibold text-yellow-600">{overviewStats.linen?.soiled || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">In Laundry</span>
                          <span className="font-semibold text-blue-600">{overviewStats.linen?.in_laundry || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Housekeeping Tab */}
              {activeTab === 'housekeeping' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Staff Performance Report</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff Member</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">In Progress</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Duration</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {housekeepingData.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                              No housekeeping data available
                            </td>
                          </tr>
                        ) : (
                          housekeepingData.map((row, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm text-gray-900">{row.full_name}</td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {new Date(row.scheduled_date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <span className="text-green-600 font-medium">{row.completed_tasks || 0}</span>
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <span className="text-yellow-600 font-medium">{row.pending_tasks || 0}</span>
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <span className="text-blue-600 font-medium">{row.in_progress_tasks || 0}</span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {row.avg_duration ? `${Math.round(row.avg_duration)} min` : '-'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Inventory Tab */}
              {activeTab === 'inventory' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Low Stock Items Report</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Code</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reorder Level</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shortage</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {inventoryData.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                              No low stock items - Great job!
                            </td>
                          </tr>
                        ) : (
                          inventoryData.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.item_code}</td>
                              <td className="px-6 py-4 text-sm text-gray-900">{item.item_name_en}</td>
                              <td className="px-6 py-4 text-sm text-gray-500">{item.category}</td>
                              <td className="px-6 py-4 text-sm">
                                <span className="text-red-600 font-medium">{item.current_stock} {item.unit}</span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">{item.reorder_level} {item.unit}</td>
                              <td className="px-6 py-4 text-sm">
                                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                                  {item.shortage} {item.unit}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Linen Tab */}
              {activeTab === 'linen' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Linen Stock Status Report</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Stock</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clean</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Soiled</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">In Laundry</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Par Level</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {linenData.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                              No linen items found
                            </td>
                          </tr>
                        ) : (
                          linenData.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.item_name_en}</td>
                              <td className="px-6 py-4 text-sm text-gray-500">{item.linen_type}</td>
                              <td className="px-6 py-4 text-sm text-gray-900">{item.total_stock}</td>
                              <td className="px-6 py-4 text-sm text-green-600 font-medium">{item.clean_stock}</td>
                              <td className="px-6 py-4 text-sm text-yellow-600">{item.soiled_stock}</td>
                              <td className="px-6 py-4 text-sm text-blue-600">{item.in_laundry}</td>
                              <td className="px-6 py-4 text-sm text-gray-900">{item.par_level}</td>
                              <td className="px-6 py-4 text-sm">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  item.stock_status === 'critical' ? 'bg-red-100 text-red-800' :
                                  item.stock_status === 'low' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {item.stock_status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Service Requests Tab */}
              {activeTab === 'service' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Service Requests Report</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                      <p className="text-sm text-yellow-600">Open</p>
                      <p className="text-2xl font-bold text-yellow-900">
                        {serviceRequestData.filter(r => r.status === 'open').length}
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <p className="text-sm text-blue-600">In Progress</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {serviceRequestData.filter(r => r.status === 'in_progress').length}
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <p className="text-sm text-green-600">Resolved</p>
                      <p className="text-2xl font-bold text-green-900">
                        {serviceRequestData.filter(r => r.status === 'resolved').length}
                      </p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <p className="text-sm text-red-600">Urgent</p>
                      <p className="text-2xl font-bold text-red-900">
                        {serviceRequestData.filter(r => r.priority === 'urgent').length}
                      </p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {serviceRequestData.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                              No service requests found
                            </td>
                          </tr>
                        ) : (
                          serviceRequestData.slice(0, 20).map((request) => (
                            <tr key={request.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm text-gray-900">{request.title}</td>
                              <td className="px-6 py-4 text-sm text-gray-500">{request.room?.room_number}</td>
                              <td className="px-6 py-4 text-sm">
                                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                                  {request.request_type.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  request.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                  request.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                  request.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {request.priority}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  request.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                  request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {request.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {new Date(request.created_at).toLocaleDateString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
