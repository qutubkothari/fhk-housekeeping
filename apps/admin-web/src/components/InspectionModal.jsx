import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/stores/authStore'
import { CheckCircle, XCircle, AlertCircle, Clock, Save } from 'lucide-react'

export default function InspectionModal({ task, onClose, onComplete }) {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [checklist, setChecklist] = useState([])
  const [notes, setNotes] = useState('')
  const [inspectionResult, setInspectionResult] = useState('passed') // 'passed' or 'failed'

  useEffect(() => {
    loadChecklistTemplate()
  }, [task])

  const loadChecklistTemplate = async () => {
    try {
      // Load checklist template based on task type
      const { data, error } = await supabase
        .from('inspection_checklist_templates')
        .select('checklist_items')
        .eq('task_type', task.task_type.replace('_cleaning', ''))
        .eq('is_active', true)
        .single()

      if (error) throw error

      if (data && data.checklist_items) {
        const items = data.checklist_items.items.map(item => ({
          ...item,
          checked: false
        }))
        setChecklist(items)
      }
    } catch (error) {
      console.error('Error loading checklist:', error)
      // Load default checklist
      setChecklist([
        { id: 'bed', label_en: 'Bed properly made', label_ar: 'السرير مرتب بشكل صحيح', required: true, checked: false },
        { id: 'bathroom', label_en: 'Bathroom cleaned', label_ar: 'الحمام نظيف', required: true, checked: false },
        { id: 'floor', label_en: 'Floor cleaned', label_ar: 'الأرضية نظيفة', required: true, checked: false },
        { id: 'trash', label_en: 'Trash removed', label_ar: 'القمامة مزالة', required: true, checked: false },
      ])
    }
  }

  const toggleChecklistItem = (itemId) => {
    setChecklist(prev => prev.map(item =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    ))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Check if all required items are checked
      const allRequiredChecked = checklist
        .filter(item => item.required)
        .every(item => item.checked)

      const finalResult = allRequiredChecked ? 'passed' : inspectionResult

      // Update task with inspection results
      const { error } = await supabase
        .from('housekeeping_tasks')
        .update({
          inspection_status: finalResult,
          inspected_by: user.id,
          inspected_at: new Date().toISOString(),
          inspection_notes: notes,
          inspection_checklist: { items: checklist, result: finalResult },
          status: finalResult === 'passed' ? 'completed' : 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id)

      if (error) throw error

      alert(`Inspection ${finalResult === 'passed' ? 'passed' : 'failed'} successfully!`)
      onComplete()
      onClose()
    } catch (error) {
      console.error('Error submitting inspection:', error)
      alert('Failed to submit inspection')
    } finally {
      setLoading(false)
    }
  }

  const allRequiredChecked = checklist
    .filter(item => item.required)
    .every(item => item.checked)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6 rounded-t-lg">
          <h2 className="text-2xl font-bold">Supervisor Inspection</h2>
          <p className="text-blue-100 mt-1">
            Room {task.room?.room_number} • {task.task_type.replace('_', ' ').toUpperCase()}
          </p>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Task Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Assigned To</p>
                <p className="font-medium">{task.assigned_user?.full_name}</p>
              </div>
              <div>
                <p className="text-gray-600">Completed At</p>
                <p className="font-medium">
                  {task.completed_at ? new Date(task.completed_at).toLocaleString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Duration</p>
                <p className="font-medium">{task.duration_minutes || 0} minutes</p>
              </div>
              <div>
                <p className="text-gray-600">Priority</p>
                <p className={`font-medium ${
                  task.priority === 'urgent' ? 'text-red-600' :
                  task.priority === 'high' ? 'text-orange-600' :
                  'text-gray-700'
                }`}>
                  {task.priority}
                </p>
              </div>
            </div>
          </div>

          {/* Inspection Checklist */}
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              Inspection Checklist
            </h3>

            <div className="space-y-3">
              {checklist.map((item) => (
                <label
                  key={item.id}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    item.checked
                      ? 'bg-green-50 border-green-300'
                      : 'bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggleChecklistItem(item.id)}
                    className="mt-1 w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.label_en}</span>
                      {item.required && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Required</span>
                      )}
                    </div>
                    <span className="text-sm text-gray-600">{item.label_ar}</span>
                  </div>
                  {item.checked && (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Inspection Result */}
          <div className="mb-6">
            <label className="block font-medium mb-2">Inspection Result</label>
            <div className="flex gap-4">
              <label className={`flex-1 flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                inspectionResult === 'passed'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="result"
                  value="passed"
                  checked={inspectionResult === 'passed'}
                  onChange={(e) => setInspectionResult(e.target.value)}
                  disabled={!allRequiredChecked}
                  className="w-5 h-5 text-green-600"
                />
                <div>
                  <div className="font-medium flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Pass Inspection
                  </div>
                  <p className="text-sm text-gray-600">Room meets all standards</p>
                </div>
              </label>

              <label className={`flex-1 flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                inspectionResult === 'failed'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="result"
                  value="failed"
                  checked={inspectionResult === 'failed'}
                  onChange={(e) => setInspectionResult(e.target.value)}
                  className="w-5 h-5 text-red-600"
                />
                <div>
                  <div className="font-medium flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    Fail Inspection
                  </div>
                  <p className="text-sm text-gray-600">Requires re-cleaning</p>
                </div>
              </label>
            </div>

            {!allRequiredChecked && inspectionResult === 'passed' && (
              <div className="mt-2 flex items-center gap-2 text-orange-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Please check all required items to pass inspection</span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block font-medium mb-2">
              Inspector Notes {inspectionResult === 'failed' && <span className="text-red-600">*</span>}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Add any comments or issues found during inspection..."
              required={inspectionResult === 'failed'}
            />
            {inspectionResult === 'failed' && (
              <p className="text-sm text-gray-600 mt-1">
                Please explain what needs to be corrected for failed inspections
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (inspectionResult === 'passed' && !allRequiredChecked)}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-white disabled:opacity-50 ${
                inspectionResult === 'passed'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {loading ? (
                <Clock className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              Submit Inspection
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
