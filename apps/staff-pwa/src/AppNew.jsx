import { useState, useEffect } from 'react'
import { Home, Square, User, LogOut, X, Check } from 'lucide-react'

const SUPABASE_URL = 'https://oglmyyyhfwuhyghcbnmi.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nbG15eXloZnd1aHlnaGNibm1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MzIwNTYsImV4cCI6MjA4MDUwODA1Nn0.dFZqm7_CiT3Dmx_Lbbm8Iyk2arsfLmnDd3GCfyGkIxE'

const ISSUE_OPTIONS = {
  'AC Issues': ['Not cooling', 'Not heating', 'Making noise', 'Remote not working', 'Leaking water'],
  'Bed Issues': ['Sheets dirty', 'Mattress stained', 'Pillows missing', 'Bed frame broken', 'Bedding torn'],
  'Bathroom Issues': ['Toilet not flushing', 'Sink clogged', 'Shower not working', 'No hot water', 'Tiles broken', 'Toilet seat broken'],
  'Furniture Issues': ['Chair broken', 'Table damaged', 'Wardrobe door broken', 'Drawer stuck', 'Mirror cracked'],
  'Electrical Issues': ['Lights not working', 'TV not working', 'Power outlet broken', 'Switch broken'],
  'Cleanliness Issues': ['Carpet stained', 'Walls dirty', 'Windows dirty', 'Floor needs deep clean'],
  'Other': ['Items missing', 'Odor problem', 'Pest problem', 'General maintenance needed']
}

function App() {
  const [user, setUser] = useState(null)
  const [page, setPage] = useState('rooms')
  const [rooms, setRooms] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showIssuesModal, setShowIssuesModal] = useState(false)
  const [selectedIssues, setSelectedIssues] = useState([])
  const [currentTask, setCurrentTask] = useState(null)

  useEffect(() => {
    const storedUser = localStorage.getItem('fhk_user')
    if (storedUser) {
      const userData = JSON.parse(storedUser)
      setUser(userData)
      loadRooms(userData.id)
      checkActiveSession(userData.id)
    } else {
      window.location.href = '/'
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
    if (!res.ok) throw new Error(`API Error: ${res.status}`)
    return res.json()
  }

  const loadRooms = async (userId) => {
    try {
      const tasks = await api(`housekeeping_tasks?assigned_to=eq.${userId}&status=in.("pending","in_progress")&select=id,status,priority,rooms(id,room_number,floor,status)&order=priority.desc`)
      setRooms(tasks)
    } catch (err) {
      console.error('Load rooms error:', err)
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
      const session = await api('work_sessions', {
        method: 'POST',
        body: JSON.stringify({
          org_id: user.org_id,
          room_id: task.rooms.id,
          staff_id: user.id,
          session_type: 'housekeeping',
          task_id: task.id,
          started_at: new Date().toISOString(),
          status: 'in_progress'
        })
      })

      await api(`housekeeping_tasks?id=eq.${task.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
      })

      await api(`rooms?id=eq.${task.rooms.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'cleaning' })
      })

      setActiveSession(session[0])
      setCurrentTask(task)
      setSelectedIssues([])
      setShowIssuesModal(true)
      loadRooms(user.id)
    } catch (err) {
      alert('Failed to start: ' + err.message)
    }
  }

  const saveIssues = async () => {
    if (!activeSession) return
    try {
      await api(`housekeeping_tasks?id=eq.${activeSession.task_id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          identified_issues: selectedIssues
        })
      })
      setShowIssuesModal(false)
      alert('Issues saved!')
    } catch (err) {
      alert('Failed to save issues: ' + err.message)
    }
  }

  const toggleIssue = (issue) => {
    setSelectedIssues(prev => 
      prev.includes(issue) 
        ? prev.filter(i => i !== issue)
        : [...prev, issue]
    )
  }

  const stopWork = async () => {
    if (!activeSession) return
    try {
      const now = new Date().toISOString()

      await api(`work_sessions?id=eq.${activeSession.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          stopped_at: now,
          status: 'completed'
        })
      })

      await api(`housekeeping_tasks?id=eq.${activeSession.task_id}`, {
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

  const signOut = () => {
    localStorage.removeItem('fhk_user')
    window.location.href = '/'
  }

  if (!user) return <div className="flex items-center justify-center min-h-screen">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4">
        <h1 className="text-xl font-bold">FHK Staff - {user.full_name}</h1>
      </div>

      {/* Active Session Banner */}
      {activeSession && (
        <div className="bg-green-500 text-white p-4">
          <div className="flex justify-between items-center mb-2">
            <div>
              <div className="font-bold">Work in Progress</div>
              <div className="text-sm">Add issues or click STOP when done</div>
            </div>
            <button
              onClick={stopWork}
              className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-bold flex items-center gap-2"
            >
              <Square className="w-5 h-5" />
              STOP
            </button>
          </div>
          <button
            onClick={() => setShowIssuesModal(true)}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-lg font-semibold"
          >
            Report Issues
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="p-4">
        {page === 'rooms' && (
          <div>
            <h2 className="text-lg font-bold mb-4">My Rooms</h2>
            {loading ? (
              <div>Loading rooms...</div>
            ) : rooms.length === 0 ? (
              <div className="text-center text-gray-500 py-12">No rooms assigned</div>
            ) : (
              <div className="space-y-3">
                {rooms.map(task => {
                  const room = task.rooms
                  const isActive = activeSession?.task_id === task.id
                  const canStart = !activeSession && task.status === 'pending'

                  return (
                    <div key={task.id} className={`bg-white rounded-lg p-4 shadow ${isActive ? 'ring-2 ring-green-500' : ''}`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">Room {room.room_number}</div>
                          <div className="text-sm text-gray-600">Floor {room.floor}</div>
                          <div className={`text-sm font-medium mt-1 ${task.status === 'in_progress' ? 'text-green-600' : 'text-gray-600'}`}>
                            {task.status === 'in_progress' ? 'In Progress' : 'Pending'}
                          </div>
                        </div>
                        {canStart && (
                          <button
                            onClick={() => startWork(task)}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold"
                          >
                            START
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {page === 'profile' && (
          <div>
            <h2 className="text-lg font-bold mb-4">Profile</h2>
            <div className="bg-white rounded-lg p-6 shadow">
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">Name</div>
                  <div className="font-semibold">{user.full_name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Email</div>
                  <div className="font-semibold">{user.email}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Role</div>
                  <div className="font-semibold capitalize">{user.role}</div>
                </div>
                <button
                  onClick={signOut}
                  className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t">
        <div className="flex justify-around items-center h-16">
          <button
            onClick={() => setPage('rooms')}
            className={`flex flex-col items-center justify-center flex-1 h-full ${page === 'rooms' ? 'text-blue-600' : 'text-gray-500'}`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs mt-1">Rooms</span>
          </button>
          <button
            onClick={() => setPage('profile')}
            className={`flex flex-col items-center justify-center flex-1 h-full ${page === 'profile' ? 'text-blue-600' : 'text-gray-500'}`}
          >
            <User className="w-6 h-6" />
            <span className="text-xs mt-1">Profile</span>
          </button>
        </div>
      </nav>

      {/* Issues Modal */}
      {showIssuesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Report Issues Found</h2>
              <button onClick={() => setShowIssuesModal(false)} className="text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {Object.entries(ISSUE_OPTIONS).map(([category, issues]) => (
                <div key={category} className="border rounded-lg p-4">
                  <h3 className="font-bold text-lg mb-3 text-blue-600">{category}</h3>
                  <div className="space-y-2">
                    {issues.map(issue => (
                      <label key={issue} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={selectedIssues.includes(issue)}
                          onChange={() => toggleIssue(issue)}
                          className="w-5 h-5 text-blue-600"
                        />
                        <span className="flex-1">{issue}</span>
                        {selectedIssues.includes(issue) && <Check className="w-5 h-5 text-green-600" />}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="sticky bottom-0 bg-white border-t p-4">
              <div className="mb-3 text-sm text-gray-600">
                {selectedIssues.length} issue(s) selected
              </div>
              <button
                onClick={saveIssues}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold"
              >
                SAVE ISSUES
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
