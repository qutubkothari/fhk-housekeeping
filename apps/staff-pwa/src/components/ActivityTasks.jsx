import { useState, useEffect } from 'react'
import { Clock, CheckCircle2, AlertCircle, Play, Check, ChevronRight, Activity as ActivityIcon } from 'lucide-react'
import { translations } from '../translations'

const SUPABASE_URL = 'https://oglmyyyhfwuhyghcbnmi.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nbG15eXloZnd1aHlnaGNibm1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MzIwNTYsImV4cCI6MjA4MDUwODA1Nn0.dFZqm7_CiT3Dmx_Lbbm8Iyk2arsfLmnDd3GCfyGkIxE'

export default function ActivityTasks({ lang, user }) {
  const [roomAssignments, setRoomAssignments] = useState([])
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  const t = (key) => translations[key]?.[lang] || translations[key]?.en || key

  useEffect(() => {
    loadAssignments()
    const interval = setInterval(loadAssignments, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [user])

  const loadAssignments = async () => {
    try {
      // Get room assignments with activity assignments for this user
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/activity_assignments?assigned_to=eq.${user.id}&status=in.(pending,in_progress)&select=*,room_assignments(*,rooms(*)),housekeeping_activities(*)&order=created_at.desc`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        }
      )

      if (!response.ok) throw new Error('Failed to load assignments')
      
      const activityData = await response.json()
      
      // Group by room assignment
      const roomMap = {}
      activityData.forEach(act => {
        const roomAssignment = act.room_assignments
        if (!roomMap[roomAssignment.id]) {
          roomMap[roomAssignment.id] = {
            ...roomAssignment,
            activities: []
          }
        }
        roomMap[roomAssignment.id].activities.push({
          ...act,
          activity: act.housekeeping_activities
        })
      })

      setRoomAssignments(Object.values(roomMap))
    } catch (error) {
      console.error('Error loading assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const startActivity = async (activityAssignment) => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/activity_assignments?id=eq.${activityAssignment.id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            status: 'in_progress',
            started_at: new Date().toISOString()
          })
        }
      )

      if (!response.ok) throw new Error('Failed to start activity')
      
      alert(t('activityStarted'))
      loadAssignments()
    } catch (error) {
      console.error('Error starting activity:', error)
      alert(t('error'))
    }
  }

  const completeActivity = async (activityAssignment) => {
    try {
      const startTime = new Date(activityAssignment.started_at)
      const endTime = new Date()
      const timeTaken = Math.round((endTime - startTime) / 60000) // minutes

      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/activity_assignments?id=eq.${activityAssignment.id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            status: 'completed',
            completed_at: endTime.toISOString(),
            time_taken_minutes: timeTaken
          })
        }
      )

      if (!response.ok) throw new Error('Failed to complete activity')
      
      alert(t('activityCompleted'))
      loadAssignments()
    } catch (error) {
      console.error('Error completing activity:', error)
      alert(t('error'))
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <div className="text-center py-12">{t('loading')}</div>
  }

  // Room detail view
  if (selectedRoom) {
    const pendingCount = selectedRoom.activities.filter(a => a.status === 'pending').length
    const inProgressCount = selectedRoom.activities.filter(a => a.status === 'in_progress').length
    const completedCount = selectedRoom.activities.filter(a => a.status === 'completed').length

    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <button
            onClick={() => setSelectedRoom(null)}
            className="text-blue-600 text-sm mb-2"
          >
            ← {t('back')}
          </button>
          <h2 className="text-xl font-bold text-gray-900">
            {t('room')} {selectedRoom.rooms.room_number}
          </h2>
          <div className="flex items-center gap-4 mt-2 text-sm">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              {pendingCount} {t('pending')}
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              {inProgressCount} {t('inProgress')}
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              {completedCount} {t('completed')}
            </span>
          </div>
          
          {/* Completion percentage */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm mb-1">
              <span>{t('completionPercentage')}</span>
              <span className="font-semibold">{selectedRoom.completion_percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${selectedRoom.completion_percentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Activities List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {selectedRoom.activities
            .sort((a, b) => a.activity.sequence_order - b.activity.sequence_order)
            .map((actAssignment) => {
              const activity = actAssignment.activity
              const isStarted = actAssignment.status !== 'pending'
              const isCompleted = actAssignment.status === 'completed'

              return (
                <div
                  key={actAssignment.id}
                  className="bg-white rounded-lg border-2 border-gray-200 p-4 space-y-3"
                >
                  {/* Activity Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                          #{activity.sequence_order}
                        </span>
                        <h3 className="font-semibold text-gray-900">
                          {activity.name}
                        </h3>
                      </div>
                      {activity.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {activity.description}
                        </p>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${getStatusColor(actAssignment.status)}`}>
                      {t(actAssignment.status)}
                    </span>
                  </div>

                  {/* Time Info */}
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {activity.estimated_minutes} {t('minutes')}
                    </span>
                    {actAssignment.time_taken_minutes && (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        {actAssignment.time_taken_minutes} {t('minutes')} {t('timeTaken')}
                      </span>
                    )}
                  </div>

                  {/* Action Button */}
                  {!isCompleted && (
                    <button
                      onClick={() => isStarted ? completeActivity(actAssignment) : startActivity(actAssignment)}
                      className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors ${
                        isStarted
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isStarted ? (
                        <>
                          <Check className="w-5 h-5" />
                          {t('completeActivity')}
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5" />
                          {t('startActivity')}
                        </>
                      )}
                    </button>
                  )}

                  {isCompleted && actAssignment.completed_at && (
                    <div className="text-sm text-gray-600 text-center">
                      {t('completed')} {new Date(actAssignment.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              )
            })}

          {selectedRoom.completion_percentage === 100 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <p className="font-semibold text-green-900">{t('allActivitiesCompleted')}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Room list view
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-2xl font-bold text-gray-900">{t('myActivities')}</h1>
        <p className="text-sm text-gray-600 mt-1">
          {roomAssignments.length} {t('rooms')} {t('assigned')}
        </p>
      </div>

      {/* Room Cards */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {roomAssignments.length === 0 && (
          <div className="text-center py-12">
            <ActivityIcon className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">{t('noTasks')}</p>
          </div>
        )}

        {roomAssignments.map((roomAssignment) => {
          const room = roomAssignment.rooms
          const pendingCount = roomAssignment.activities.filter(a => a.status === 'pending').length
          const inProgressCount = roomAssignment.activities.filter(a => a.status === 'in_progress').length
          const completedCount = roomAssignment.activities.filter(a => a.status === 'completed').length
          const totalCount = roomAssignment.activities.length

          return (
            <button
              key={roomAssignment.id}
              onClick={() => setSelectedRoom(roomAssignment)}
              className="w-full bg-white rounded-lg border-2 border-gray-200 p-4 text-left hover:border-blue-500 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {t('room')} {room.room_number}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {room.floor && `${t('floor')} ${room.floor}`}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>{completedCount}/{totalCount} {t('activities')}</span>
                  <span className="font-semibold">{roomAssignment.completion_percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${roomAssignment.completion_percentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                {pendingCount > 0 && (
                  <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                    {pendingCount} {t('pending')}
                  </span>
                )}
                {inProgressCount > 0 && (
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                    {inProgressCount} {t('inProgress')}
                  </span>
                )}
                {completedCount === totalCount && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {t('completed')}
                  </span>
                )}
              </div>

              {/* Assignment Type */}
              <div className="mt-2 text-xs text-gray-500">
                {t(roomAssignment.assignment_type)}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
