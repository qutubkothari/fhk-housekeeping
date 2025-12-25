import { useState, useEffect } from 'react'
import { Home, Square, User, LogOut, X, Check, Clock, CheckCircle2, AlertCircle, Users, ClipboardList, BarChart3, Settings, DoorOpen, Bell, Package, ChevronRight } from 'lucide-react'
import DesktopLayout from './components/DesktopLayout'
import Dashboard from './pages/Dashboard'
import Rooms from './pages/Rooms'
import Housekeeping from './pages/Housekeeping'
import ServiceRequests from './pages/ServiceRequests'
import Staff from './pages/Staff'
import ActivityTasks from './components/ActivityTasks'
import Inventory from './pages/Inventory'
import Linen from './pages/Linen'
import Reports from './pages/Reports'
import RealTimeMonitor from './pages/RealTimeMonitor'
import SettingsPage from './pages/Settings'
import StaffAssignments from './pages/StaffAssignments'
import Analytics from './pages/Analytics'
import ActivityMaster from './pages/ActivityMaster'
import BulkAssignment from './pages/BulkAssignment'
import LocationMaster from './pages/LocationMaster'
import ShiftMaster from './pages/ShiftMaster'
import VendorManagement from './pages/VendorManagement'
import Procurement from './pages/Procurement'
import { translations } from './translations'

const SUPABASE_URL = 'https://oglmyyyhfwuhyghcbnmi.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nbG15eXloZnd1aHlnaGNibm1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MzIwNTYsImV4cCI6MjA4MDUwODA1Nn0.dFZqm7_CiT3Dmx_Lbbm8Iyk2arsfLmnDd3GCfyGkIxE'

const ISSUE_OPTIONS_KEYS = {
  'acIssues': ['notCooling', 'notHeating', 'makingNoise', 'remoteNotWorking', 'leakingWater'],
  'bedIssues': ['sheetsDirty', 'mattressStained', 'pillowsMissing', 'bedFrameBroken', 'beddingTorn'],
  'bathroomIssues': ['toiletNotFlushing', 'sinkClogged', 'showerNotWorking', 'noHotWater', 'tilesBroken', 'toiletSeatBroken'],
  'furnitureIssues': ['chairBroken', 'tableDamaged', 'wardrobeDoorBroken', 'drawerStuck', 'mirrorCracked'],
  'electricalIssues': ['lightsNotWorking', 'tvNotWorking', 'powerOutletBroken', 'switchBroken'],
  'cleanlinessIssues': ['carpetStained', 'wallsDirty', 'windowsDirty', 'floorNeedsDeepClean'],
  'other': ['itemsMissing', 'odorProblem', 'pestProblem', 'generalMaintenanceNeeded']
}

function App() {
  console.log('🚀 APP VERSION 2.0 - WITH ADMIN ADD/ASSIGN BUTTONS LOADED!')
  const [user, setUser] = useState(null)
  const [page, setPage] = useState('rooms')
  const [currentPage, setCurrentPage] = useState('') // Desktop navigation state - set by role
  const [lang, setLang] = useState('en') // Language state
  const [rooms, setRooms] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showIssuesModal, setShowIssuesModal] = useState(false)
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false)
  const [selectedIssues, setSelectedIssues] = useState([])
  const [maintenanceWork, setMaintenanceWork] = useState({
    status: 'pending', // fixed, pending, partial
    workDone: '',
    consumablesUsed: '',
    replacements: '',
    notes: ''
  })
  const [currentTask, setCurrentTask] = useState(null)
  
  // Supervisor/Manager states
  const [staffList, setStaffList] = useState([])
  
  // Translation helper
  const t = (key) => translations[key]?.[lang] || translations[key]?.en || key
  const [assignTaskModal, setAssignTaskModal] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [performanceData, setPerformanceData] = useState([])
  const [showStaffDetail, setShowStaffDetail] = useState(false)
  
  // Front Desk states
  const [guestRequests, setGuestRequests] = useState([])
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [roomStatus, setRoomStatus] = useState([])
  
  // Admin states
  const [users, setUsers] = useState([])
  const [showUserModal, setShowUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [systemSettings, setSystemSettings] = useState({})
  const [analytics, setAnalytics] = useState(null)

  useEffect(() => {
    // Check if user just signed out - keep them signed out
    if (localStorage.getItem('fhk_signed_out')) {
      return // Don't load any user, stay signed out
    }

    const storedUser = localStorage.getItem('fhk_user')
    if (storedUser) {
      const userData = JSON.parse(storedUser)
      setUser(userData)
      // Avoid legacy task loading for non-maintenance users in the unified app.
      if (userData?.role === 'maintenance') {
        loadRooms(userData.id)
      } else {
        setLoading(false)
      }
      checkActiveSession(userData.id)
    } else {
      // Production: do NOT auto-login. Show the unified login screen.
      // Dev only: keep a convenience test user for local testing.
      if (import.meta?.env?.DEV) {
        const testUser = {
          id: '30cefa4c-00c5-4305-9ffc-5442ad0b0a3a',
          full_name: 'Fatima Ali',
          email: 'fatima@demohotel.com',
          role: 'staff',
          org_id: 'c7b3d8e0-5d4e-4b5a-8f3c-9e6d5f4c3b2a'
        }
        setUser(testUser)
        if (testUser?.role === 'maintenance') {
          loadRooms(testUser.id)
        } else {
          setLoading(false)
        }
        checkActiveSession(testUser.id)
      }
    }
  }, [])

  const api = async (endpoint, options = {}) => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
      ...options,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        ...options.headers
      }
    })
    if (!res.ok) {
      const errorText = await res.text()
      let message = errorText
      try {
        const parsed = JSON.parse(errorText)
        message = parsed.message || parsed.error || errorText
      } catch (err) {
        // ignore parse errors and use raw text
      }
      throw new Error(`API Error ${res.status}: ${message}`)
    }
    return res.json()
  }

  const normalizePhoneDigits = (value) => {
    if (!value) return ''
    return String(value).replace(/\D/g, '')
  }

  const loadRooms = async (userId) => {
    try {
      console.log('🔍 loadRooms called with userId:', userId)
      console.log('👤 Current user:', user)
      
      // Check user role to determine which tasks to load
      const isMaintenance = user?.role === 'maintenance'
      console.log('🔧 Is maintenance role:', isMaintenance)
      
      if (isMaintenance) {
        // Load maintenance issues from service_requests table
        const query = `service_requests?assigned_to=eq.${userId}&status=in.("pending","assigned","in_progress")&request_type=eq.maintenance&select=id,org_id,status,priority,title,category,description,rooms(id,room_number,floor,status)&order=priority.desc`
        console.log('📡 Maintenance query:', query)
        const tasks = await api(query)
        console.log('✅ Maintenance tasks loaded:', tasks)
        setRooms(tasks)
      } else {
        // Load housekeeping tasks
        const query = `housekeeping_tasks?assigned_to=eq.${userId}&status=in.("pending","in_progress")&select=id,org_id,status,priority,rooms(id,room_number,floor,status)&order=priority.desc`
        console.log('📡 Housekeeping query:', query)
        const tasks = await api(query)
        console.log('✅ Housekeeping tasks loaded:', tasks)
        setRooms(tasks)
      }
    } catch (err) {
      console.error('❌ Load tasks error:', err)
    } finally {
      setLoading(false)
    }
  }

  const checkActiveSession = async (userId) => {
    try {
      const sessions = await api(`work_sessions?staff_id=eq.${userId}&status=eq.in_progress&limit=1`)
      if (sessions.length > 0) setActiveSession(sessions[0])
    } catch (err) {
      console.error('Check session error:', err)
    }
  }

  const startWork = async (task) => {
    try {
      console.log('▶️ startWork called with task:', task)
      const isMaintenance = user?.role === 'maintenance'
      const sessionType = isMaintenance ? 'maintenance' : 'housekeeping'
      
      // First, close any existing active sessions for this staff member
      console.log('🔍 Checking for existing sessions...')
      const existingSessions = await api(`work_sessions?staff_id=eq.${user.id}&status=eq.in_progress`)
      console.log('📋 Existing sessions:', existingSessions)
      
      if (existingSessions.length > 0) {
        const confirmClose = window.confirm('You have an active session. Close it and start new task?')
        if (!confirmClose) return
        
        console.log('🧹 Closing existing sessions...')
        for (const session of existingSessions) {
          await api(`work_sessions?id=eq.${session.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
              stopped_at: new Date().toISOString(),
              status: 'completed'
            })
          })
        }
      }
      
      const sessionData = {
        org_id: task.org_id || user.org_id,
        room_id: task.rooms.id,
        staff_id: user.id,
        session_type: sessionType,
        started_at: new Date().toISOString(),
        status: 'in_progress'
      }
      
      // For maintenance, use service_request_id, for housekeeping use task_id
      if (isMaintenance) {
        sessionData.service_request_id = task.id
      } else {
        sessionData.task_id = task.id
      }
      
      console.log('💾 Creating work session with data:', sessionData)
      const session = await api('work_sessions', {
        method: 'POST',
        body: JSON.stringify(sessionData)
      })
      console.log('✅ Work session created:', session)

      const updateTable = isMaintenance ? 'service_requests' : 'activity_assignments'
      await api(`${updateTable}?id=eq.${task.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
      })

      await api(`rooms?id=eq.${task.rooms.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: isMaintenance ? 'maintenance' : 'cleaning' })
      })

      setActiveSession(session[0])
      setCurrentTask(task)
      setRooms(prev => prev.map(t => t.id === task.id ? { ...t, status: 'in_progress' } : t))
      
      // Show different modals based on role
      if (isMaintenance) {
        setMaintenanceWork({
          status: 'pending',
          workDone: '',
          consumablesUsed: '',
          replacements: '',
          notes: ''
        })
        setShowMaintenanceModal(true)
      } else {
        setSelectedIssues([])
        setShowIssuesModal(true)
      }
    } catch (err) {
      alert('Failed to start: ' + err.message)
    }
  }

  const saveIssues = async () => {
    if (!activeSession) return
    try {
      const isMaintenance = user?.role === 'maintenance'
      const taskId = isMaintenance ? activeSession.service_request_id : activeSession.task_id
      const updateTable = isMaintenance ? 'service_requests' : 'activity_assignments'
      const issueColumn = isMaintenance ? 'identified_issues' : 'issues_reported'
      
      await api(`${updateTable}?id=eq.${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          [issueColumn]: selectedIssues
        })
      })
      setShowIssuesModal(false)
      alert('Issues saved!')
    } catch (err) {
      alert('Failed to save issues: ' + err.message)
    }
  }

  const stopWork = async () => {
    if (!activeSession) return
    try {
      const now = new Date().toISOString()
      const isMaintenance = user?.role === 'maintenance'

      await api(`work_sessions?id=eq.${activeSession.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          stopped_at: now,
          status: 'completed'
        })
      })

      const taskId = isMaintenance ? activeSession.service_request_id : activeSession.task_id
      const updateTable = isMaintenance ? 'service_requests' : 'activity_assignments'
      await api(`${updateTable}?id=eq.${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'completed',
          completed_at: now
        })
      })

      await api(`rooms?id=eq.${activeSession.room_id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'vacant' })
      })

      setActiveSession(null)
      loadRooms(user.id)
    } catch (err) {
      alert('Failed to stop: ' + err.message)
    }
  }

  const toggleIssue = (issue) => {
    setSelectedIssues(prev => 
      prev.includes(issue) 
        ? prev.filter(i => i !== issue)
        : [...prev, issue]
    )
  }

  const signOut = () => {
    localStorage.removeItem('fhk_user')
    localStorage.setItem('fhk_signed_out', 'true')
    // Redirect to unified login
    window.location.href = '/unified/'
  }

  // Supervisor functions
  const loadStaffPerformance = async () => {
    try {
      const staff = await api(`users?org_id=eq.${user.org_id}&role=in.("staff","maintenance")&select=*`)
      setStaffList(staff)
      
      // Mock performance data - in real app, calculate from work_sessions
      const performance = staff.map(s => ({
        ...s,
        tasksCompleted: Math.floor(Math.random() * 20) + 5,
        avgTime: Math.floor(Math.random() * 30) + 15,
        rating: (Math.random() * 2 + 3).toFixed(1)
      }))
      setPerformanceData(performance)
    } catch (err) {
      console.error('Failed to load staff:', err)
    }
  }

  const assignTask = async (staffId, taskData) => {
    try {
      await api('housekeeping_tasks', {
        method: 'POST',
        body: JSON.stringify({
          org_id: user.org_id,
          assigned_to: staffId,
          ...taskData,
          status: 'assigned'
        })
      })
      alert('Task assigned successfully!')
      loadRooms(user.id)
    } catch (err) {
      alert('Failed to assign task: ' + err.message)
    }
  }

  // Front Desk functions
  const loadRoomStatus = async () => {
    try {
      const allRooms = await api(`rooms?org_id=eq.${user.org_id}&select=*&order=room_number`)
      setRoomStatus(allRooms)
    } catch (err) {
      console.error('Failed to load rooms:', err)
    }
  }

  const createServiceRequest = async (requestData) => {
    try {
      await api('service_requests', {
        method: 'POST',
        body: JSON.stringify({
          org_id: user.org_id,
          reported_by: user.id,
          status: 'pending',
          request_type: 'maintenance',
          ...requestData
        })
      })
      alert('Service request created!')
      setShowRequestModal(false)
    } catch (err) {
      alert('Failed to create request: ' + err.message)
    }
  }

  // Admin functions
  const loadUsers = async () => {
    try {
      const allUsers = await api(`users?org_id=eq.${user.org_id}&select=*&order=full_name`)
      setUsers(allUsers)
    } catch (err) {
      console.error('Failed to load users:', err)
    }
  }

  const loadAnalytics = async () => {
    try {
      // Mock analytics - in real app, aggregate from database
      setAnalytics({
        totalRooms: 150,
        occupiedRooms: 112,
        cleanRooms: 98,
        maintenanceRooms: 8,
        activeStaff: 12,
        pendingTasks: 24,
        completedToday: 86,
        avgCleaningTime: 22
      })
    } catch (err) {
      console.error('Failed to load analytics:', err)
    }
  }

  const saveUser = async (userData) => {
    try {
      if (editingUser) {
        await api(`users?id=eq.${editingUser.id}`, {
          method: 'PATCH',
          body: JSON.stringify(userData)
        })
        alert('User updated!')
      } else {
        await api('users', {
          method: 'POST',
          body: JSON.stringify({
            org_id: user.org_id,
            ...userData
          })
        })
        alert('User created!')
      }
      setShowUserModal(false)
      loadUsers()
    } catch (err) {
      alert('Failed to save user: ' + err.message)
    }
  }

  // Load data based on role
  useEffect(() => {
    if (!user) return
    
    // Set default page based on role
    if (user.role === 'admin' || user.role === 'super_admin') {
      if (!currentPage) setCurrentPage('dashboard')
    } else if (user.role === 'inventory') {
      if (!currentPage) setCurrentPage('inventory')
    } else if (user.role === 'laundry') {
      if (!currentPage) setCurrentPage('linen')
    }
    
    // Desktop users - load initial data
    if (['admin', 'super_admin', 'inventory', 'laundry'].includes(user.role)) {
      if (user.role === 'admin' || user.role === 'super_admin') {
        loadRoomStatus()
        loadUsers()
        loadAnalytics()
      }
    } 
    // Mobile users
    else if (user.role === 'supervisor') {
      loadStaffPerformance()
      loadRoomStatus()
    }
  }, [user?.role])

  // Unified login page
  if (!user) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Home className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold mb-2">FHK Hotel</h1>
          <p className="text-blue-100">Management System</p>
        </div>

        {/* Login Form */}
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
          <p className="text-gray-600 mb-6">Sign in to access your dashboard</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number</label>
              <input
                type="tel"
                id="login-mobile"
                placeholder="Enter mobile number"
                className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input
                type="password"
                id="login-password"
                placeholder="Any password for demo"
                className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">Demo mode: Enter any password</p>
            </div>

            <button
              onClick={async () => {
                const mobileRaw = document.getElementById('login-mobile')?.value
                const password = document.getElementById('login-password')?.value

                const mobileDigits = normalizePhoneDigits(mobileRaw)
                if (!mobileDigits) {
                  alert('Please enter a mobile number')
                  return
                }
                if (!password) {
                  alert('Please enter a password')
                  return
                }

                // 1) Preferred: Database lookup by phone (normalized client-side)
                try {
                  const orFilter = encodeURIComponent(`(phone.eq.${mobileDigits},phone_number.eq.${mobileDigits})`)
                  const results = await api(
                    `users?select=id,org_id,full_name,full_name_ar,role,email,phone,phone_number,is_active&is_active=eq.true&or=${orFilter}&limit=1`
                  )
                  const matched = Array.isArray(results) ? results[0] : null

                  if (matched?.id) {
                    const loginUser = {
                      id: matched.id,
                      full_name: matched.full_name,
                      email: matched.email,
                      phone: matched.phone || matched.phone_number,
                      role: matched.role,
                      org_id: matched.org_id,
                    }
                    localStorage.setItem('fhk_user', JSON.stringify(loginUser))
                    localStorage.removeItem('fhk_signed_out')
                    window.location.reload()
                    return
                  }
                } catch (err) {
                  console.warn('Phone login DB lookup failed; falling back to demo users:', err?.message || err)
                }

                // 2) Fallback: demo users keyed by mobile digits
                const demoUsersByMobile = {
                  // NOTE: digits-only; spaces/+ are ignored during matching
                  '966501111111': {
                    id: 'inv-user-001',
                    full_name: 'Hassan Inventory',
                    email: 'inventory@demohotel.com',
                    phone: '+966 50 111 1111',
                    role: 'inventory',
                    org_id: '00000000-0000-0000-0000-000000000001',
                  },
                  '966508901234': {
                    id: '746b68a7-7247-4f6e-8825-c4cf297be2fc',
                    full_name: 'Mariam Ahmed',
                    email: 'laundry@demohotel.com',
                    phone: '+966 50 890 1234',
                    role: 'laundry',
                    org_id: '00000000-0000-0000-0000-000000000001',
                  },
                  '966506789012': {
                    id: 'f04c4e03-182a-413f-9295-fbe6014b2830',
                    full_name: 'Ali Hassan',
                    email: 'maintenance@demohotel.com',
                    phone: '+966 50 678 9012',
                    role: 'maintenance',
                    org_id: '00000000-0000-0000-0000-000000000001',
                  },
                  '966505678901': {
                    id: '7510deff-26e3-4578-8a41-90cd477222c7',
                    full_name: 'Khalid Al-Rashid',
                    email: 'supervisor@demohotel.com',
                    phone: '+966 50 567 8901',
                    role: 'supervisor',
                    org_id: '00000000-0000-0000-0000-000000000001',
                  },
                  '966502345678': {
                    id: '30cefa4c-00c5-4305-9ffc-5442ad0b0a3a',
                    full_name: 'Fatima Ali',
                    email: 'fatima@demohotel.com',
                    phone: '+966 50 234 5678',
                    role: 'staff',
                    org_id: '00000000-0000-0000-0000-000000000001',
                  },
                  '966503456789': {
                    id: '00000000-0000-0000-0000-000000000003',
                    full_name: 'Ahmed Hassan',
                    email: 'ahmed@demohotel.com',
                    phone: '+966 50 345 6789',
                    role: 'staff',
                    org_id: '00000000-0000-0000-0000-000000000001',
                  },
                  '966504567890': {
                    id: '5ac38ad5-5ad3-4b59-b8dd-94c1f1f2e9c0',
                    full_name: 'Sara Abdullah',
                    email: 'sara@demohotel.com',
                    phone: '+966 50 456 7890',
                    role: 'staff',
                    org_id: '00000000-0000-0000-0000-000000000001',
                  },
                }

                const demoUser = demoUsersByMobile[mobileDigits]
                if (demoUser) {
                  localStorage.setItem('fhk_user', JSON.stringify(demoUser))
                  localStorage.removeItem('fhk_signed_out')
                  window.location.reload()
                  return
                }

                alert(
                  'Invalid credentials. Try one of these mobile numbers:\n' +
                    '+966 50 567 8901 (Supervisor)\n' +
                    '+966 50 234 5678 (Staff)\n' +
                    '+966 50 345 6789 (Staff)\n' +
                    '+966 50 678 9012 (Maintenance)\n' +
                    '+966 50 890 1234 (Laundry)\n' +
                    '+966 50 111 1111 (Inventory)'
                )
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 text-lg"
            >
              Sign In
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center mb-3">Demo Mobile Numbers (Desktop Dashboard Users):</p>
            <div className="grid grid-cols-3 gap-2 text-xs mb-3">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <div className="font-semibold text-indigo-900">Super Admin</div>
                <div className="text-indigo-600">+966 50 123 4567</div>
                <div className="text-indigo-500 text-[10px] mt-1">Full Access Dashboard</div>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <div className="font-semibold text-green-900">Inventory</div>
                <div className="text-green-600">+966 50 111 1111</div>
                <div className="text-green-500 text-[10px] mt-1">Inventory Module</div>
              </div>
              <div className="p-2 bg-pink-50 rounded-lg">
                <div className="font-semibold text-pink-900">Laundry</div>
                <div className="text-pink-600">+966 50 890 1234</div>
                <div className="text-pink-500 text-[10px] mt-1">Linen Module</div>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center mb-3 mt-4">Demo Mobile Numbers (Mobile Field Staff Users):</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2 bg-purple-50 rounded-lg">
                <div className="font-semibold text-purple-900">Supervisor</div>
                <div className="text-purple-600">+966 50 567 8901</div>
                <div className="text-purple-500 text-[10px] mt-1">Mobile Manager</div>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <div className="font-semibold text-blue-900">Housekeeping</div>
                <div className="text-blue-600">+966 50 234 5678</div>
                <div className="text-blue-500 text-[10px] mt-1">Mobile Tasks</div>
              </div>
              <div className="p-2 bg-orange-50 rounded-lg">
                <div className="font-semibold text-orange-900">Maintenance</div>
                <div className="text-orange-600">+966 50 678 9012</div>
                <div className="text-orange-500 text-[10px] mt-1">Mobile Tech</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Desktop Dashboard Layout for admin, super_admin, inventory, laundry
  if (['admin', 'super_admin', 'inventory', 'laundry'].includes(user?.role)) {
    // Define access control
    const hasAccess = (page) => {
      const accessRules = {
        'dashboard': ['admin', 'super_admin'],
        'rooms': ['admin', 'super_admin'],
        'housekeeping': ['admin', 'super_admin'],
        'maintenance': ['admin', 'super_admin'],
        'staff': ['admin', 'super_admin'],
        'inventory': ['admin', 'super_admin', 'inventory'],
        'linen': ['admin', 'super_admin', 'laundry'],
        'reports': ['admin', 'super_admin'],
        'realtime': ['admin', 'super_admin'],
        'assignments': ['admin', 'super_admin'],
        'analytics': ['admin', 'super_admin'],
        'activity-master': ['admin', 'super_admin'],
        'bulk-assignment': ['admin', 'super_admin'],
        'location-master': ['admin', 'super_admin'],
        'shift-master': ['admin', 'super_admin'],
        'vendor-management': ['admin', 'super_admin'],
        'procurement': ['admin', 'super_admin'],
        'settings': ['admin', 'super_admin'],
      }
      return accessRules[page]?.includes(user.role) || false
    }

    // Access denied page
    const AccessDenied = () => (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to view this page</p>
        </div>
      </div>
    )

    return (
      <DesktopLayout
        user={user}
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onSignOut={signOut}
        lang={lang}
        onLangChange={setLang}
      >
        {currentPage === 'dashboard' && (hasAccess('dashboard') ? <Dashboard user={user} lang={lang} /> : <AccessDenied />)}
        {currentPage === 'rooms' && (hasAccess('rooms') ? <Rooms user={user} lang={lang} /> : <AccessDenied />)}
        {currentPage === 'housekeeping' && (hasAccess('housekeeping') ? <Housekeeping user={user} lang={lang} /> : <AccessDenied />)}
        {currentPage === 'maintenance' && (hasAccess('maintenance') ? <ServiceRequests user={user} lang={lang} /> : <AccessDenied />)}
        {currentPage === 'staff' && (hasAccess('staff') ? <Staff user={user} lang={lang} /> : <AccessDenied />)}
        {currentPage === 'inventory' && (hasAccess('inventory') ? <Inventory user={user} lang={lang} /> : <AccessDenied />)}
        {currentPage === 'linen' && (hasAccess('linen') ? <Linen user={user} lang={lang} /> : <AccessDenied />)}
        {currentPage === 'reports' && (hasAccess('reports') ? <Reports user={user} lang={lang} /> : <AccessDenied />)}
        {currentPage === 'realtime' && (hasAccess('realtime') ? <RealTimeMonitor user={user} lang={lang} /> : <AccessDenied />)}
        {currentPage === 'assignments' && (hasAccess('assignments') ? <StaffAssignments user={user} lang={lang} /> : <AccessDenied />)}
        {currentPage === 'analytics' && (hasAccess('analytics') ? <Analytics user={user} lang={lang} /> : <AccessDenied />)}
        {currentPage === 'activity-master' && (hasAccess('activity-master') ? <ActivityMaster user={user} lang={lang} /> : <AccessDenied />)}
        {currentPage === 'bulk-assignment' && (hasAccess('bulk-assignment') ? <BulkAssignment user={user} lang={lang} /> : <AccessDenied />)}
        {currentPage === 'location-master' && (hasAccess('location-master') ? <LocationMaster user={user} lang={lang} /> : <AccessDenied />)}
        {currentPage === 'shift-master' && (hasAccess('shift-master') ? <ShiftMaster user={user} lang={lang} /> : <AccessDenied />)}
        {currentPage === 'vendor-management' && (hasAccess('vendor-management') ? <VendorManagement user={user} lang={lang} /> : <AccessDenied />)}
        {currentPage === 'procurement' && (hasAccess('procurement') ? <Procurement user={user} lang={lang} /> : <AccessDenied />)}
        {currentPage === 'settings' && (hasAccess('settings') ? <SettingsPage user={user} lang={lang} /> : <AccessDenied />)}
        {!['dashboard', 'rooms', 'housekeeping', 'maintenance', 'staff', 'inventory', 'linen', 'reports', 'realtime', 'assignments', 'analytics', 'activity-master', 'bulk-assignment', 'location-master', 'vendor-management', 'procurement', 'settings'].includes(currentPage) && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-6xl mb-4">🚧</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Page Coming Soon</h2>
              <p className="text-gray-600">This module is being implemented</p>
            </div>
          </div>
        )}
      </DesktopLayout>
    )
  }

  // Mobile Interface for supervisor, staff, maintenance
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Professional Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {user.role === 'staff' ? 'FHK Housekeeping' :
                 user.role === 'maintenance' ? 'FHK Maintenance' :
                 user.role === 'supervisor' ? 'FHK Supervisor' :
                 user.role === 'front_desk' ? 'FHK Front Desk' :
                 user.role === 'admin' ? 'FHK Admin' :
                 'FHK Management'}
              </h1>
              <p className="text-sm text-gray-600">{user.full_name}</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Language Toggle for Mobile */}
              <button
                onClick={() => {
                  const newLang = lang === 'en' ? 'ar' : 'en'
                  setLang(newLang)
                  document.body.dir = newLang === 'ar' ? 'rtl' : 'ltr'
                }}
                className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-xs font-medium text-gray-700"
                title={lang === 'ar' ? 'Switch to English' : 'Switch to Arabic'}
              >
                {lang === 'ar' ? 'EN' : 'AR'}
              </button>
              
              <span className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${
                user.role === 'staff' ? 'bg-blue-100 text-blue-700' :
                user.role === 'maintenance' ? 'bg-orange-100 text-orange-700' :
                user.role === 'supervisor' ? 'bg-purple-100 text-purple-700' :
                user.role === 'front_desk' ? 'bg-teal-100 text-teal-700' :
                user.role === 'admin' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {user.role === 'front_desk' ? 'Front Desk' : user.role}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Active Session Banner */}
      {activeSession && (
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg">
          <div className="px-4 py-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className="font-semibold">{t('inProgress')}</div>
                <div className="text-sm text-emerald-100">{t('reportOrRequest')}</div>
              </div>
              <button
                onClick={stopWork}
                className="bg-white text-emerald-600 hover:bg-emerald-50 px-5 py-2.5 rounded-lg font-semibold shadow-md transition-all duration-200 flex items-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                {t('completeTask')}
              </button>
            </div>
            <button
              onClick={() => {
                const isMaintenance = user.role === 'maintenance'
                if (isMaintenance) {
                  // Find the current task from rooms
                  const activeTaskId = activeSession.service_request_id
                  const task = rooms.find(t => t.id === activeTaskId)
                  if (task) {
                    setCurrentTask(task)
                    setShowMaintenanceModal(true)
                  } else {
                    alert('Could not find task details')
                  }
                } else {
                  setShowIssuesModal(true)
                }
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-medium transition-all duration-200 border-2 border-emerald-400"
            >
              {user.role === 'maintenance' ? t('description') : t('reportIssue')}
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="px-4 py-6 pb-24">
        {/* Staff (Housekeeping) - New flow: activity-based assignments */}
        {user.role === 'staff' && page === 'rooms' && (
          <div className="max-w-4xl mx-auto">
            <ActivityTasks lang={lang} user={user} />
          </div>
        )}

        {/* Maintenance - Show service requests list */}
        {user.role === 'maintenance' && page === 'rooms' && (
          <div className="max-w-4xl mx-auto">
            <ServiceRequests user={user} lang={lang} />
          </div>
        )}

        {/* Supervisor - Room assignments + Bulk Assignment */}
        {user.role === 'supervisor' && page === 'rooms' && (
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{lang === 'ar' ? 'المشرف' : 'Supervisor'}</h2>
                <p className="text-gray-600">{lang === 'ar' ? 'تعيينات الغرف ونسبة الإنجاز' : 'Room assignments and completion'}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage('assignments')}
                  className="bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
                >
                  {lang === 'ar' ? 'التعيينات' : 'Assignments'}
                </button>
                <button
                  onClick={() => setPage('bulk-assignment')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
                >
                  {lang === 'ar' ? 'تعيين جماعي' : 'Bulk Assignment'}
                </button>
              </div>
            </div>
            <Rooms user={user} lang={lang} />
          </div>
        )}

        {user.role === 'supervisor' && page === 'assignments' && (
          <div className="max-w-6xl mx-auto">
            <div className="mb-4">
              <button
                onClick={() => setPage('rooms')}
                className="text-purple-700 font-semibold"
              >
                {lang === 'ar' ? 'رجوع' : 'Back'}
              </button>
            </div>
            <StaffAssignments user={user} lang={lang} />
          </div>
        )}

        {user.role === 'supervisor' && page === 'bulk-assignment' && (
          <div className="max-w-6xl mx-auto">
            <div className="mb-4">
              <button
                onClick={() => setPage('rooms')}
                className="text-purple-700 font-semibold"
              >
                {lang === 'ar' ? 'رجوع' : 'Back'}
              </button>
            </div>
            <BulkAssignment user={user} lang={lang} />
          </div>
        )}

        {/* Front Desk Interface */}
        {user.role === 'front_desk' && page === 'rooms' && (
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Front Desk</h2>
              <p className="text-gray-600">Manage guest services and room status</p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <button className="bg-gradient-to-br from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white p-6 rounded-2xl shadow-lg transition-all">
                <DoorOpen className="w-8 h-8 mb-2" />
                <div className="font-bold">Check In</div>
              </button>
              <button className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-6 rounded-2xl shadow-lg transition-all">
                <DoorOpen className="w-8 h-8 mb-2" />
                <div className="font-bold">Check Out</div>
              </button>
              <button 
                onClick={() => setShowRequestModal(true)}
                className="bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white p-6 rounded-2xl shadow-lg transition-all"
              >
                <Bell className="w-8 h-8 mb-2" />
                <div className="font-bold">Service Request</div>
              </button>
              <button className="bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white p-6 rounded-2xl shadow-lg transition-all">
                <Package className="w-8 h-8 mb-2" />
                <div className="font-bold">Guest Items</div>
              </button>
            </div>

            {/* Room Status Board */}
            <div className="bg-white rounded-2xl shadow-card p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Room Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-8 gap-3">
                {roomStatus.slice(0, 40).map(room => (
                  <div 
                    key={room.id}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-105 ${
                      room.status === 'vacant' ? 'bg-emerald-50 border-emerald-200' :
                      room.status === 'occupied' ? 'bg-blue-50 border-blue-200' :
                      room.status === 'cleaning' ? 'bg-yellow-50 border-yellow-200' :
                      room.status === 'maintenance' ? 'bg-orange-50 border-orange-200' :
                      'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="font-bold text-gray-900 text-center">{room.room_number}</div>
                    <div className={`text-xs text-center mt-1 capitalize ${
                      room.status === 'vacant' ? 'text-emerald-600' :
                      room.status === 'occupied' ? 'text-blue-600' :
                      room.status === 'cleaning' ? 'text-yellow-600' :
                      room.status === 'maintenance' ? 'text-orange-600' :
                      'text-gray-600'
                    }`}>
                      {room.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Front Desk Interface - Full Admin Features */}
        {user.role === 'front_desk' && page === 'rooms' && (
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h2>
              <p className="text-gray-600">System management and analytics</p>
            </div>

            {/* Analytics Overview */}
            {analytics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-2xl p-6 shadow-card">
                  <div className="text-2xl font-bold text-gray-900">{analytics.totalRooms}</div>
                  <div className="text-gray-600 text-sm mt-1">Total Rooms</div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-card">
                  <div className="text-2xl font-bold text-blue-600">{analytics.occupiedRooms}</div>
                  <div className="text-gray-600 text-sm mt-1">Occupied</div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-card">
                  <div className="text-2xl font-bold text-emerald-600">{analytics.completedToday}</div>
                  <div className="text-gray-600 text-sm mt-1">Cleaned Today</div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-card">
                  <div className="text-2xl font-bold text-orange-600">{analytics.activeStaff}</div>
                  <div className="text-gray-600 text-sm mt-1">Active Staff</div>
                </div>
              </div>
            )}

            {/* User Management */}
            <div className="bg-white rounded-2xl shadow-card p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">User Management</h3>
                <button 
                  onClick={() => {
                    setEditingUser(null)
                    setShowUserModal(true)
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
                >
                  + Add User
                </button>
              </div>
              <div className="space-y-2">
                {users.slice(0, 10).map(u => (
                  <div key={u.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold">
                        {u.full_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{u.full_name}</div>
                        <div className="text-sm text-gray-500">{u.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium capitalize">
                        {u.role}
                      </span>
                      <button 
                        onClick={() => {
                          setEditingUser(u)
                          setShowUserModal(true)
                        }}
                        className="text-red-600 hover:text-red-700 font-semibold text-sm"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* System Settings */}
            <div className="bg-white rounded-2xl shadow-card p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">System Settings</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="font-semibold text-gray-900">Property Settings</div>
                      <div className="text-sm text-gray-500">Configure rooms, floors, and property details</div>
                    </div>
                  </div>
                  <div className="text-gray-400">→</div>
                </button>
                <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="font-semibold text-gray-900">Analytics & Reports</div>
                      <div className="text-sm text-gray-500">View detailed performance metrics</div>
                    </div>
                  </div>
                  <div className="text-gray-400">→</div>
                </button>
                <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="font-semibold text-gray-900">Inventory Management</div>
                      <div className="text-sm text-gray-500">Track consumables and supplies</div>
                    </div>
                  </div>
                  <div className="text-gray-400">→</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {page === 'profile' && (
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('profile')}</h2>
              <p className="text-gray-600">{lang === 'ar' ? 'معلومات حسابك' : 'Your account information'}</p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-card">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">{user.full_name}</div>
                  <div className="text-sm text-gray-500 capitalize">{user.role}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                    <span className="text-gray-600">📧</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 uppercase tracking-wide">{t('email')}</div>
                    <div className="font-medium text-gray-900">{user.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                    <span className="text-gray-600">👤</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 uppercase tracking-wide">{lang === 'ar' ? 'الدور' : 'Role'}</div>
                    <div className="font-medium text-gray-900 capitalize">{user.role}</div>
                  </div>
                </div>

                <button
                  onClick={signOut}
                  className="w-full mt-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3"
                >
                  <LogOut className="w-5 h-5" />
                  {t('signOut')}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-inset-bottom shadow-2xl">
        <div className="flex items-center h-20 px-2">
          <button
            onClick={() => setPage('rooms')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-xl transition-all duration-200 ${
              page === 'rooms' 
                ? 'bg-primary-50 text-primary-700' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Home className={`w-6 h-6 ${page === 'rooms' ? 'stroke-[2.5]' : ''}`} />
            <span className={`text-xs font-medium ${page === 'rooms' ? 'font-semibold' : ''}`}>
              {user.role === 'maintenance' ? (lang === 'ar' ? 'المشاكل' : 'Issues') : (lang === 'ar' ? 'الغرف' : 'Rooms')}
            </span>
          </button>
          <button
            onClick={() => setPage('profile')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-xl transition-all duration-200 ${
              page === 'profile' 
                ? 'bg-primary-50 text-primary-700' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <User className={`w-6 h-6 ${page === 'profile' ? 'stroke-[2.5]' : ''}`} />
            <span className={`text-xs font-medium ${page === 'profile' ? 'font-semibold' : ''}`}>{t('profile')}</span>
          </button>
        </div>
      </nav>

      {/* Issues Modal */}
      {showIssuesModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">{lang === 'ar' ? 'الإبلاغ عن مشاكل' : 'Report Issues'}</h2>
                  <p className="text-primary-100 text-sm mt-1">{lang === 'ar' ? 'حدد جميع المشاكل الموجودة في الغرفة' : 'Select all issues found in the room'}</p>
                </div>
                <button 
                  onClick={() => setShowIssuesModal(false)} 
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-220px)]">
              <div className="space-y-4">
                {Object.entries(ISSUE_OPTIONS_KEYS).map(([categoryKey, issueKeys]) => (
                  <div key={categoryKey} className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                    <h3 className="font-bold text-lg mb-4 text-primary-900 flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                        <span className="text-primary-600">⚠️</span>
                      </div>
                      {t(categoryKey)}
                    </h3>
                    <div className="space-y-2">
                      {issueKeys.map(issueKey => (
                        <label 
                          key={issueKey} 
                          className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white rounded-xl transition-colors group"
                        >
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={selectedIssues.includes(issueKey)}
                              onChange={() => toggleIssue(issueKey)}
                              className="w-5 h-5 text-primary-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 cursor-pointer"
                            />
                          </div>
                          <span className="flex-1 text-gray-700 group-hover:text-gray-900">{t(issueKey)}</span>
                          {selectedIssues.includes(issueKey) && (
                            <Check className="w-5 h-5 text-emerald-600" />
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-600">{lang === 'ar' ? 'المشاكل المحددة:' : 'Issues selected:'}</span>
                <span className="text-lg font-bold text-primary-600">{selectedIssues.length}</span>
              </div>
              <button
                onClick={saveIssues}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 text-lg"
              >
                {lang === 'ar' ? 'حفظ المشاكل' : 'Save Issues'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Work Modal */}
      {showMaintenanceModal && currentTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-orange-700 text-white p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Maintenance Work</h2>
                  <p className="text-orange-100 text-sm mt-1">Room {currentTask.rooms?.room_number} - {currentTask.title}</p>
                </div>
                <button 
                  onClick={() => setShowMaintenanceModal(false)} 
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-220px)] space-y-6">
              {/* Reported Issue */}
              <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-5">
                <h3 className="font-bold text-orange-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Reported Issue
                </h3>
                <p className="text-orange-800 font-medium">{currentTask.category} - {currentTask.title}</p>
                <p className="text-orange-700 text-sm mt-2">{currentTask.description}</p>
              </div>

              {/* Work Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">{lang === 'ar' ? 'حالة العمل *' : 'Work Status *'}</label>
                <div className="grid grid-cols-3 gap-3">
                  {['fixed', 'pending', 'partial'].map(status => (
                    <button
                      key={status}
                      onClick={() => setMaintenanceWork(prev => ({ ...prev, status }))}
                      className={`p-4 rounded-xl border-2 font-semibold capitalize transition-all ${
                        maintenanceWork.status === status
                          ? 'bg-orange-600 text-white border-orange-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400'
                      }`}
                    >
                      {status === 'fixed' ? (lang === 'ar' ? 'تم الإصلاح' : 'Fixed') : 
                       status === 'pending' ? (lang === 'ar' ? 'معلق' : 'Pending') : 
                       (lang === 'ar' ? 'جزئي' : 'Partial')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Work Done */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{lang === 'ar' ? 'العمل المنجز *' : 'Work Done *'}</label>
                <textarea
                  value={maintenanceWork.workDone}
                  onChange={(e) => setMaintenanceWork(prev => ({ ...prev, workDone: e.target.value }))}
                  placeholder={lang === 'ar' ? 'اوصف ما قمت بإصلاحه أو محاولة إصلاحه...' : 'Describe what you fixed or attempted...'}
                  className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 min-h-[100px]"
                />
              </div>

              {/* Consumables Used */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{lang === 'ar' ? 'المستهلكات المستخدمة' : 'Consumables Used'}</label>
                <textarea
                  value={maintenanceWork.consumablesUsed}
                  onChange={(e) => setMaintenanceWork(prev => ({ ...prev, consumablesUsed: e.target.value }))}
                  placeholder={lang === 'ar' ? 'مثل: مسامير، غراء، شريط، مواد تنظيف...' : 'E.g., Screws, glue, tape, cleaning materials...'}
                  className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                />
              </div>

              {/* Replacements */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{lang === 'ar' ? 'القطع/الأشياء المستبدلة' : 'Parts/Items Replaced'}</label>
                <textarea
                  value={maintenanceWork.replacements}
                  onChange={(e) => setMaintenanceWork(prev => ({ ...prev, replacements: e.target.value }))}
                  placeholder={lang === 'ar' ? 'مثل: فلتر المكيف، لمبة، صنبور...' : 'E.g., AC filter, light bulb, faucet cartridge...'}
                  className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                />
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{lang === 'ar' ? 'ملاحظات إضافية' : 'Additional Notes'}</label>
                <textarea
                  value={maintenanceWork.notes}
                  onChange={(e) => setMaintenanceWork(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder={lang === 'ar' ? 'أي معلومات أخرى ذات صلة...' : 'Any other relevant information...'}
                  className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
              <button
                onClick={() => {
                  if (!maintenanceWork.workDone) {
                    alert(lang === 'ar' ? 'يرجى وصف العمل المنجز' : 'Please describe the work done')
                    return
                  }
                  setShowMaintenanceModal(false)
                  alert(lang === 'ar' ? 'تم حفظ تفاصيل العمل!' : 'Work details saved!')
                }}
                className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 text-lg"
              >
                {lang === 'ar' ? 'حفظ تفاصيل العمل' : 'Save Work Details'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Front Desk - Service Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Create Service Request</h2>
                  <p className="text-teal-100 text-sm mt-1">Submit a maintenance or service request</p>
                </div>
                <button 
                  onClick={() => setShowRequestModal(false)} 
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Room Number *</label>
                <input
                  type="text"
                  placeholder="e.g., 101, 205..."
                  className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                <select className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-200">
                  <option>AC/Heating</option>
                  <option>Plumbing</option>
                  <option>Electrical</option>
                  <option>Furniture</option>
                  <option>Bathroom</option>
                  <option>Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                <textarea
                  placeholder="Describe the issue..."
                  className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-200 min-h-[120px]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                <div className="flex gap-3">
                  <button className="flex-1 p-3 border-2 border-gray-300 rounded-xl hover:border-teal-500 hover:bg-teal-50 transition-colors">
                    <div className="font-semibold">Low</div>
                  </button>
                  <button className="flex-1 p-3 border-2 border-teal-500 bg-teal-50 rounded-xl">
                    <div className="font-semibold text-teal-700">Medium</div>
                  </button>
                  <button className="flex-1 p-3 border-2 border-gray-300 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-colors">
                    <div className="font-semibold">High</div>
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 p-6 flex gap-3">
              <button
                onClick={() => setShowRequestModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Service request created!')
                  setShowRequestModal(false)
                }}
                className="flex-1 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin - User Management Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{editingUser ? 'Edit User' : 'Add New User'}</h2>
                  <p className="text-red-100 text-sm mt-1">User account management</p>
                </div>
                <button 
                  onClick={() => {
                    setShowUserModal(false)
                    setEditingUser(null)
                  }} 
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  defaultValue={editingUser?.full_name}
                  placeholder="Enter full name"
                  className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  defaultValue={editingUser?.email}
                  placeholder="user@hotel.com"
                  className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Role *</label>
                <select 
                  defaultValue={editingUser?.role}
                  className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200"
                >
                  <option value="staff">Housekeeping Staff</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="front_desk">Front Desk</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              {!editingUser && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Password *</label>
                  <input
                    type="password"
                    placeholder="Enter password"
                    className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  defaultValue={editingUser?.phone}
                  placeholder="+1234567890"
                  className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200"
                />
              </div>
            </div>

            <div className="border-t border-gray-200 p-6 flex gap-3">
              <button
                onClick={() => {
                  setShowUserModal(false)
                  setEditingUser(null)
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert(editingUser ? 'User updated!' : 'User created!')
                  setShowUserModal(false)
                  setEditingUser(null)
                }}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
              >
                {editingUser ? 'Update User' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Detail Modal */}
      {showStaffDetail && selectedStaff && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
                    {selectedStaff.full_name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedStaff.full_name}</h2>
                    <p className="text-purple-100 capitalize">{selectedStaff.role}</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setShowStaffDetail(false)
                    setSelectedStaff(null)
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Performance Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600">{selectedStaff.tasksCompleted || 0}</div>
                  <div className="text-sm text-gray-600 mt-1">Tasks Completed</div>
                </div>
                <div className="bg-orange-50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-orange-600">{selectedStaff.avgTime || 0}m</div>
                  <div className="text-sm text-gray-600 mt-1">Avg Time</div>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-emerald-600">{selectedStaff.rating || 'N/A'}</div>
                  <div className="text-sm text-gray-600 mt-1">Rating</div>
                </div>
              </div>

              {/* Assigned Tasks */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Square className="w-5 h-5" />
                  Assigned Tasks
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {rooms.filter(task => task.assigned_to === selectedStaff.id).length > 0 ? (
                    rooms.filter(task => task.assigned_to === selectedStaff.id).map(task => (
                      <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <DoorOpen className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">Room {task.rooms?.room_number || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{task.title || 'Housekeeping'}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                            task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                            task.priority === 'high' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {task.status || task.priority}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Square className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No tasks assigned yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Contact Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="font-medium">Email:</span>
                    <span>{selectedStaff.email}</span>
                  </div>
                  {selectedStaff.phone_number && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="font-medium">Phone:</span>
                      <span>{selectedStaff.phone_number}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowStaffDetail(false)
                    setAssignTaskModal(true)
                  }}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                >
                  Assign New Task
                </button>
                <button
                  onClick={() => setShowStaffDetail(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Supervisor Task Assignment Modal */}
      {assignTaskModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Assign Task</h2>
                <button 
                  onClick={() => {
                    setAssignTaskModal(false)
                    setSelectedStaff(null)
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Select Staff */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Assign To Staff *</label>
                <div className="grid grid-cols-2 gap-3">
                  {staffList.map(staff => (
                    <button
                      key={staff.id}
                      onClick={() => setSelectedStaff(staff)}
                      className={`p-4 border-2 rounded-xl transition-all ${
                        selectedStaff?.id === staff.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {staff.full_name.charAt(0)}
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-gray-900">{staff.full_name}</div>
                          <div className="text-xs text-gray-500 capitalize">{staff.role}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Select Room */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Select Room *</label>
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 rounded-xl">
                  {roomStatus && roomStatus.length > 0 ? (
                    roomStatus.slice(0, 40).map(room => (
                      <button
                        key={room.id}
                        onClick={() => setCurrentTask({ ...currentTask, room_id: room.id, room_number: room.room_number })}
                        className={`p-3 border-2 rounded-lg transition-all ${
                          currentTask?.room_id === room.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="font-bold text-gray-900">{room.room_number}</div>
                        <div className="text-xs text-gray-500 capitalize">{room.status}</div>
                      </button>
                    ))
                  ) : (
                    <div className="col-span-4 text-center text-gray-500 py-4">No rooms available</div>
                  )}
                </div>
              </div>

              {/* Task Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Task Type *</label>
                <div className="grid grid-cols-2 gap-3">
                  {['cleaning', 'deep_cleaning', 'inspection', 'turndown'].map(type => (
                    <button
                      key={type}
                      onClick={() => setCurrentTask({ ...currentTask, task_type: type })}
                      className={`p-4 border-2 rounded-xl transition-all capitalize ${
                        currentTask?.task_type === type
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      {type.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Priority *</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: 'low', color: 'gray', label: 'Low' },
                    { value: 'normal', color: 'blue', label: 'Normal' },
                    { value: 'high', color: 'orange', label: 'High' },
                    { value: 'urgent', color: 'red', label: 'Urgent' }
                  ].map(priority => (
                    <button
                      key={priority.value}
                      onClick={() => setCurrentTask({ ...currentTask, priority: priority.value })}
                      className={`p-3 border-2 rounded-lg transition-all ${
                        currentTask?.priority === priority.value
                          ? `border-${priority.color}-500 bg-${priority.color}-50`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold text-gray-900">{priority.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  placeholder="Add any special instructions..."
                  onChange={(e) => setCurrentTask({ ...currentTask, notes: e.target.value })}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 resize-none"
                  rows="3"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setAssignTaskModal(false)
                    setSelectedStaff(null)
                    setCurrentTask(null)
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!selectedStaff || !currentTask?.room_id) {
                      alert('Please select staff and room')
                      return
                    }
                    try {
                      await assignTask(selectedStaff.id, {
                        room_id: currentTask.room_id,
                        task_type: currentTask.task_type || 'cleaning',
                        priority: currentTask.priority || 'normal',
                        notes: currentTask.notes || '',
                        scheduled_date: new Date().toISOString().split('T')[0]
                      })
                      alert(`Task assigned to ${selectedStaff.full_name}`)
                      setAssignTaskModal(false)
                      setSelectedStaff(null)
                      setCurrentTask(null)
                      loadRooms(user.id)
                    } catch (err) {
                      alert('Failed to assign task')
                    }
                  }}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                >
                  Assign Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
