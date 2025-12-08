import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { 
  TrendingUp, TrendingDown, BarChart3, PieChart, Activity,
  Users, Clock, CheckCircle, AlertCircle, Award, Target
} from 'lucide-react'
import Select from 'react-select'
import { customSelectStyles } from '../utils/selectStyles'

export default function Analytics({ user }) {
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30days')
  const [analytics, setAnalytics] = useState({
    performance: {
      avgCompletionTime: 0,
      tasksCompleted: 0,
      efficiency: 0,
      quality: 0
    },
    staffMetrics: [],
    roomMetrics: {
      avgCleaningTime: 0,
      mostCleaned: [],
      avgTurnaround: 0
    },
    trends: {
      tasksThisWeek: 0,
      tasksLastWeek: 0,
      requestsThisWeek: 0,
      requestsLastWeek: 0
    }
  })

  useEffect(() => {
    if (user?.org_id) {
      fetchAnalytics()
    }
  }, [user?.org_id, dateRange])

  const getDateFilter = () => {
    const days = { '7days': 7, '30days': 30, '90days': 90 }[dateRange] || 30
    const date = new Date()
    date.setDate(date.getDate() - days)
    return date.toISOString()
  }

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const dateFilter = getDateFilter()

      // Fetch completed tasks with duration
      const { data: tasks } = await supabase
        .from('housekeeping_tasks')
        .select(`
          *,
          rooms (room_number, room_type),
          assigned_user:assigned_to (full_name)
        `)
        .eq('org_id', user.org_id)
        .eq('status', 'completed')
        .gte('completed_at', dateFilter)

      // Fetch service requests
      const { data: requests } = await supabase
        .from('service_requests')
        .select('*')
        .eq('org_id', user.org_id)
        .gte('created_at', dateFilter)

      // Calculate performance metrics
      const avgCompletionTime = tasks?.length 
        ? tasks.reduce((sum, t) => {
            if (t.started_at && t.completed_at) {
              const duration = (new Date(t.completed_at) - new Date(t.started_at)) / 1000 / 60
              return sum + duration
            }
            return sum
          }, 0) / tasks.length
        : 0

      // Calculate staff performance
      const staffPerformance = {}
      tasks?.forEach(task => {
        if (task.assigned_to) {
          if (!staffPerformance[task.assigned_to]) {
            staffPerformance[task.assigned_to] = {
              name: task.assigned_user?.full_name || 'Unknown',
              tasksCompleted: 0,
              totalTime: 0,
              avgTime: 0
            }
          }
          staffPerformance[task.assigned_to].tasksCompleted++
          if (task.started_at && task.completed_at) {
            const duration = (new Date(task.completed_at) - new Date(task.started_at)) / 1000 / 60
            staffPerformance[task.assigned_to].totalTime += duration
          }
        }
      })

      const staffMetrics = Object.values(staffPerformance).map(staff => ({
        ...staff,
        avgTime: staff.totalTime / staff.tasksCompleted
      })).sort((a, b) => b.tasksCompleted - a.tasksCompleted)

      // Calculate room metrics
      const roomCounts = {}
      tasks?.forEach(task => {
        const roomNum = task.rooms?.room_number
        if (roomNum) {
          roomCounts[roomNum] = (roomCounts[roomNum] || 0) + 1
        }
      })

      const mostCleaned = Object.entries(roomCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([room, count]) => ({ room, count }))

      // Calculate weekly trends
      const now = new Date()
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

      const tasksThisWeek = tasks?.filter(t => new Date(t.completed_at) >= lastWeek).length || 0
      const tasksLastWeek = tasks?.filter(t => {
        const date = new Date(t.completed_at)
        return date >= twoWeeksAgo && date < lastWeek
      }).length || 0

      const requestsThisWeek = requests?.filter(r => new Date(r.created_at) >= lastWeek).length || 0
      const requestsLastWeek = requests?.filter(r => {
        const date = new Date(r.created_at)
        return date >= twoWeeksAgo && date < lastWeek
      }).length || 0

      setAnalytics({
        performance: {
          avgCompletionTime: Math.round(avgCompletionTime),
          tasksCompleted: tasks?.length || 0,
          efficiency: tasks?.length ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0,
          quality: 95 // Placeholder
        },
        staffMetrics,
        roomMetrics: {
          avgCleaningTime: Math.round(avgCompletionTime),
          mostCleaned,
          avgTurnaround: Math.round(avgCompletionTime + 15)
        },
        trends: {
          tasksThisWeek,
          tasksLastWeek,
          requestsThisWeek,
          requestsLastWeek
        }
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (current, previous) => {
    if (current > previous) return <TrendingUp className="w-5 h-5 text-green-600" />
    if (current < previous) return <TrendingDown className="w-5 h-5 text-red-600" />
    return <Activity className="w-5 h-5 text-gray-600" />
  }

  const getTrendPercentage = (current, previous) => {
    if (previous === 0) return current > 0 ? '+100%' : '0%'
    const change = ((current - previous) / previous) * 100
    return `${change > 0 ? '+' : ''}${Math.round(change)}%`
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div></div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Performance insights and trends</p>
        </div>
        <Select
          value={{ value: dateRange, label: dateRange === '7days' ? 'Last 7 Days' : dateRange === '30days' ? 'Last 30 Days' : 'Last 90 Days' }}
          onChange={(option) => setDateRange(option?.value || '30days')}
          options={[
            { value: '7days', label: 'Last 7 Days' },
            { value: '30days', label: 'Last 30 Days' },
            { value: '90days', label: 'Last 90 Days' }
          ]}
          styles={customSelectStyles}
          isSearchable={false}
          className="min-w-[160px]"
        />
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Tasks Completed', value: analytics.performance.tasksCompleted, color: 'from-blue-500 to-blue-600', icon: CheckCircle },
          { label: 'Avg Completion Time', value: `${analytics.performance.avgCompletionTime}m`, color: 'from-purple-500 to-purple-600', icon: Clock },
          { label: 'Efficiency Rate', value: `${analytics.performance.efficiency}%`, color: 'from-green-500 to-green-600', icon: Target },
          { label: 'Quality Score', value: `${analytics.performance.quality}%`, color: 'from-orange-500 to-orange-600', icon: Award },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className={`text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>{stat.value}</p>
              </div>
              <div className={`p-3 bg-gradient-to-br ${stat.color} rounded-lg`}>
                <stat.icon className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Trends */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Weekly Trends</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-2 border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Housekeeping Tasks</h3>
              {getTrendIcon(analytics.trends.tasksThisWeek, analytics.trends.tasksLastWeek)}
            </div>
            <div className="flex items-end gap-4">
              <div className="text-4xl font-bold text-blue-600">{analytics.trends.tasksThisWeek}</div>
              <div className="text-sm text-gray-600 mb-2">
                {getTrendPercentage(analytics.trends.tasksThisWeek, analytics.trends.tasksLastWeek)} vs last week
              </div>
            </div>
          </div>
          
          <div className="border-2 border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Service Requests</h3>
              {getTrendIcon(analytics.trends.requestsThisWeek, analytics.trends.requestsLastWeek)}
            </div>
            <div className="flex items-end gap-4">
              <div className="text-4xl font-bold text-purple-600">{analytics.trends.requestsThisWeek}</div>
              <div className="text-sm text-gray-600 mb-2">
                {getTrendPercentage(analytics.trends.requestsThisWeek, analytics.trends.requestsLastWeek)} vs last week
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Performance */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Top Performers</h2>
        {analytics.staffMetrics.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No staff performance data available</div>
        ) : (
          <div className="space-y-3">
            {analytics.staffMetrics.slice(0, 5).map((staff, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{staff.name}</h3>
                    <p className="text-sm text-gray-600">{staff.tasksCompleted} tasks completed</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{Math.round(staff.avgTime)}m</div>
                  <div className="text-sm text-gray-600">Avg time</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Most Cleaned Rooms */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Most Cleaned Rooms</h2>
        {analytics.roomMetrics.mostCleaned.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No room data available</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {analytics.roomMetrics.mostCleaned.map((room, i) => (
              <div key={i} className="text-center p-4 border-2 border-gray-200 rounded-lg">
                <div className="text-3xl font-bold text-gray-900 mb-2">{room.room}</div>
                <div className="text-sm text-gray-600">{room.count} times</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
