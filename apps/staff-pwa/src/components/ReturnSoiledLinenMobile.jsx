import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { X, Recycle } from 'lucide-react'

export default function ReturnSoiledLinenMobile({ user, lang = 'en' }) {
  const [open, setOpen] = useState(false)
  const [rooms, setRooms] = useState([])
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [loadingRooms, setLoadingRooms] = useState(false)

  const [assignedLinens, setAssignedLinens] = useState([]) // [{ linen, available, quantity }]
  const [loadingAssigned, setLoadingAssigned] = useState(false)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const title = lang === 'ar' ? 'إرجاع متسخ' : 'Return Soiled Linen'
  const roomLabel = lang === 'ar' ? 'الغرفة' : 'Room'
  const qtyLabel = lang === 'ar' ? 'الكمية' : 'Quantity'
  const notesLabel = lang === 'ar' ? 'ملاحظات' : 'Notes'
  const cancelLabel = lang === 'ar' ? 'إلغاء' : 'Cancel'
  const processLabel = lang === 'ar' ? 'تنفيذ' : 'Process'

  useEffect(() => {
    if (!open) return

    const loadRooms = async () => {
      setLoadingRooms(true)
      try {
        const { data, error } = await supabase
          .from('rooms')
          .select('id, room_number, room_type, floor')
          .eq('org_id', user.org_id)
          .eq('is_active', true)
          .order('room_number')

        if (error) throw error
        setRooms(data || [])
      } catch (e) {
        console.error('ReturnSoiledLinenMobile: failed to load rooms:', e)
        alert((lang === 'ar' ? 'تعذر تحميل الغرف: ' : 'Failed to load rooms: ') + (e?.message || e))
      } finally {
        setLoadingRooms(false)
      }
    }

    loadRooms()
  }, [open, user?.org_id, lang])

  const selectedRoom = useMemo(() => rooms.find((r) => r.id === selectedRoomId), [rooms, selectedRoomId])

  const loadAssignedForRoom = async (roomId) => {
    if (!roomId) {
      setAssignedLinens([])
      return
    }

    setLoadingAssigned(true)
    try {
      const { data: txRows, error } = await supabase
        .from('linen_transactions')
        .select(
          'linen_id, transaction_type, quantity, linen_items(id, item_name_en, item_name_ar, clean_stock, soiled_stock, in_laundry, total_stock)'
        )
        .eq('org_id', user.org_id)
        .eq('room_id', roomId)
        .in('transaction_type', ['issue_clean', 'return_soiled'])

      if (error) throw error

      const byLinenId = new Map()
      for (const row of txRows || []) {
        if (!row?.linen_id) continue
        const existing = byLinenId.get(row.linen_id) || {
          linen: row.linen_items,
          issued: 0,
          returned: 0,
        }

        const qty = parseInt(row.quantity, 10) || 0
        if (row.transaction_type === 'issue_clean') existing.issued += qty
        if (row.transaction_type === 'return_soiled') existing.returned += qty
        if (!existing.linen && row.linen_items) existing.linen = row.linen_items

        byLinenId.set(row.linen_id, existing)
      }

      const items = Array.from(byLinenId.values())
        .map((v) => {
          const available = Math.max(0, (v.issued || 0) - (v.returned || 0))
          return {
            linen: v.linen,
            available,
            quantity: 0,
          }
        })
        .filter((x) => x.linen?.id && x.available > 0)
        .sort((a, b) => (a.linen.item_name_en || '').localeCompare(b.linen.item_name_en || ''))

      setAssignedLinens(items)
    } catch (e) {
      console.error('ReturnSoiledLinenMobile: failed to load assigned linens:', e)
      alert((lang === 'ar' ? 'تعذر تحميل عناصر الغرفة: ' : 'Failed to load room linen items: ') + (e?.message || e))
      setAssignedLinens([])
    } finally {
      setLoadingAssigned(false)
    }
  }

  const onChangeRoom = async (roomId) => {
    setSelectedRoomId(roomId)
    setNotes('')
    await loadAssignedForRoom(roomId)
  }

  const updateQuantity = (linenId, nextQty) => {
    setAssignedLinens((prev) =>
      prev.map((row) => {
        if (row?.linen?.id !== linenId) return row
        const qty = Math.max(0, parseInt(nextQty, 10) || 0)
        return { ...row, quantity: qty }
      })
    )
  }

  const submit = async () => {
    if (!selectedRoomId) {
      alert(lang === 'ar' ? 'اختر الغرفة' : 'Please select a room')
      return
    }

    const itemsToReturn = assignedLinens.filter((x) => (parseInt(x.quantity, 10) || 0) > 0)
    if (itemsToReturn.length === 0) {
      alert(lang === 'ar' ? 'أدخل كمية عنصر واحد على الأقل' : 'Enter quantity for at least one item')
      return
    }

    for (const row of itemsToReturn) {
      if (row.quantity > row.available) {
        alert(
          (lang === 'ar' ? 'الكمية أكبر من المتاح: ' : 'Quantity exceeds available: ') +
            (row.linen?.item_name_en || 'Item')
        )
        return
      }
    }

    setSubmitting(true)
    try {
      for (const row of itemsToReturn) {
        const linen = row.linen
        const quantity = parseInt(row.quantity, 10) || 0
        if (!linen?.id || quantity <= 0) continue

        // 1) Record transaction
        const { error: txError } = await supabase
          .from('linen_transactions')
          .insert([
            {
              org_id: user.org_id,
              linen_id: linen.id,
              transaction_type: 'return_soiled',
              quantity,
              room_id: selectedRoomId,
              notes: notes || null,
              created_by: user.id,
            },
          ])

        if (txError) throw txError

        // 2) Update global stock: returned items become soiled
        const clean = parseInt(linen.clean_stock, 10) || 0
        const soiled = parseInt(linen.soiled_stock, 10) || 0
        const inLaundry = parseInt(linen.in_laundry, 10) || 0

        const nextSoiled = soiled + quantity
        const nextTotal = clean + nextSoiled + inLaundry

        const { error: updateError } = await supabase
          .from('linen_items')
          .update({ soiled_stock: nextSoiled, total_stock: nextTotal })
          .eq('id', linen.id)

        if (updateError) throw updateError
      }

      alert(lang === 'ar' ? 'تم تسجيل المتسخ' : 'Soiled linen recorded')
      await loadAssignedForRoom(selectedRoomId)
      setAssignedLinens((prev) => prev.map((x) => ({ ...x, quantity: 0 })))
      setNotes('')
      setOpen(false)
      setSelectedRoomId('')
    } catch (e) {
      console.error('ReturnSoiledLinenMobile: submit failed:', e)
      alert((lang === 'ar' ? 'فشل التنفيذ: ' : 'Failed to process: ') + (e?.message || e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="mb-4">
        <button
          onClick={() => setOpen(true)}
          className="w-full bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white px-4 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
        >
          <Recycle className="w-5 h-5" />
          {title}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-pink-600 to-pink-700 text-white p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">{title}</h2>
                  <p className="text-pink-100 text-sm mt-1">
                    {lang === 'ar'
                      ? 'اختر الغرفة ثم أدخل الكميات المتسخة'
                      : 'Select a room, then enter soiled quantities'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setOpen(false)
                    setSelectedRoomId('')
                    setAssignedLinens([])
                    setNotes('')
                  }}
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(85vh-220px)] space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{roomLabel} *</label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => onChangeRoom(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  disabled={loadingRooms}
                >
                  <option value="">{lang === 'ar' ? 'اختر الغرفة' : 'Select room'}</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.room_number}{r.room_type ? ` - ${r.room_type}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedRoomId && (
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="text-sm font-semibold text-gray-900">
                    {lang === 'ar' ? 'عناصر الغرفة' : 'Room linen items'}
                    {selectedRoom?.room_number ? ` – ${selectedRoom.room_number}` : ''}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {lang === 'ar'
                      ? 'يعرض العناصر التي تم إصدارها لهذه الغرفة ولم يتم إرجاعها بعد.'
                      : 'Shows items issued to this room that are not yet returned.'}
                  </div>

                  <div className="mt-4 space-y-3">
                    {loadingAssigned ? (
                      <div className="text-sm text-gray-600">{lang === 'ar' ? 'جار التحميل...' : 'Loading...'}</div>
                    ) : assignedLinens.length === 0 ? (
                      <div className="text-sm text-gray-600">
                        {lang === 'ar' ? 'لا توجد عناصر صادرة لهذه الغرفة' : 'No issued linen found for this room'}
                      </div>
                    ) : (
                      assignedLinens.map((row) => (
                        <div key={row.linen.id} className="bg-white rounded-xl p-4 border border-gray-200">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-gray-900">
                                {lang === 'ar' ? row.linen.item_name_ar || row.linen.item_name_en : row.linen.item_name_en}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                {lang === 'ar' ? 'المتاح: ' : 'Available: '} {row.available}
                              </div>
                            </div>
                            <div className="w-28">
                              <label className="block text-xs font-semibold text-gray-700 mb-1">{qtyLabel}</label>
                              <input
                                type="number"
                                min={0}
                                max={row.available}
                                value={row.quantity}
                                onChange={(e) => updateQuantity(row.linen.id, e.target.value)}
                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{notesLabel}</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  placeholder={lang === 'ar' ? 'ملاحظات اختيارية...' : 'Optional notes...'}
                  rows={3}
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setOpen(false)
                    setSelectedRoomId('')
                    setAssignedLinens([])
                    setNotes('')
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={submitting}
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={submit}
                  className="flex-1 bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submitting}
                >
                  {submitting ? (lang === 'ar' ? 'جار التنفيذ...' : 'Processing...') : processLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
