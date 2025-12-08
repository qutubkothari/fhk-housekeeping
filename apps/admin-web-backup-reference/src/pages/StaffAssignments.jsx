import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { ShoppingCart, Plus, X, Search, Trash2, Package } from 'lucide-react'

export default function StaffAssignments() {
  const [staff, setStaff] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [selectedItems, setSelectedItems] = useState([])
  const [cart, setCart] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [itemSearchQuery, setItemSearchQuery] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load staff with their assignments
      const { data: staffData, error: staffError } = await supabase
        .from('users')
        .select('*')
        .in('role', ['staff', 'maintenance'])
        .eq('is_active', true)
        .order('full_name')

      if (staffError) throw staffError

      // Load inventory items
      const { data: itemsData, error: itemsError } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('is_active', true)
        .order('item_name_en')

      if (itemsError) throw itemsError

      setStaff(staffData || [])
      setItems(itemsData || [])

      // Load existing assignments (stored in staff metadata)
      const staffWithAssignments = await Promise.all(
        (staffData || []).map(async (person) => {
          const assignments = person.metadata?.assigned_items || []
          return { ...person, assigned_items: assignments }
        })
      )
      setStaff(staffWithAssignments)
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAssignModal = (staffMember) => {
    setSelectedStaff(staffMember)
    setCart([])
    setShowAssignModal(true)
  }

  const addItemToCart = (item) => {
    const existing = cart.find(i => i.item_id === item.id)
    if (existing) {
      setCart(cart.map(i => 
        i.item_id === item.id 
          ? { ...i, quantity: i.quantity + 1 }
          : i
      ))
    } else {
      setCart([...cart, { 
        item_id: item.id,
        item_name_en: item.item_name_en,
        item_name_ar: item.item_name_ar,
        unit: item.unit,
        quantity: 1 
      }])
    }
  }

  const removeItemFromCart = (itemId) => {
    const existing = cart.find(i => i.item_id === itemId)
    if (existing && existing.quantity > 1) {
      setCart(cart.map(i =>
        i.item_id === itemId
          ? { ...i, quantity: i.quantity - 1 }
          : i
      ))
    } else {
      setCart(cart.filter(i => i.item_id !== itemId))
    }
  }

  const handleAssignItems = async () => {
    if (!selectedStaff || cart.length === 0) return

    try {
      // Get current assignments
      const currentAssignments = selectedStaff.metadata?.assigned_items || []
      const now = new Date().toISOString()
      
      // Merge new items with existing (update quantity if exists)
      const updatedAssignments = [...currentAssignments]
      cart.forEach(newItem => {
        const existingIndex = updatedAssignments.findIndex(i => i.item_id === newItem.item_id)
        if (existingIndex >= 0) {
          updatedAssignments[existingIndex].quantity += newItem.quantity
          updatedAssignments[existingIndex].assigned_at = now
        } else {
          updatedAssignments.push({ ...newItem, assigned_at: now })
        }
      })

      // Update staff metadata
      const { error } = await supabase
        .from('users')
        .update({
          metadata: {
            ...selectedStaff.metadata,
            assigned_items: updatedAssignments
          }
        })
        .eq('id', selectedStaff.id)

      if (error) throw error

      // Record transaction for tracking
      await supabase
        .from('store_transactions')
        .insert({
          org_id: selectedStaff.org_id,
          staff_id: selectedStaff.id,
          transaction_type: 'checkout',
          status: 'completed',
          items: cart,
          total_items: cart.reduce((sum, item) => sum + item.quantity, 0),
          notes: 'Permanent assignment to staff'
        })

      setShowAssignModal(false)
      setSelectedStaff(null)
      setCart([])
      setItemSearchQuery('')
      loadData()
      alert('Items assigned successfully!')
    } catch (err) {
      console.error('Error assigning items:', err)
      alert('Failed to assign items')
    }
  }

  const handleRemoveAssignment = async (staffMember, itemToRemove) => {
    if (!confirm(`Remove ${itemToRemove.item_name_en} from ${staffMember.full_name}'s cart?`)) return

    try {
      const currentAssignments = staffMember.metadata?.assigned_items || []
      const updatedAssignments = currentAssignments.filter(i => i.item_id !== itemToRemove.item_id)

      const { error } = await supabase
        .from('users')
        .update({
          metadata: {
            ...staffMember.metadata,
            assigned_items: updatedAssignments
          }
        })
        .eq('id', staffMember.id)

      if (error) throw error
      loadData()
    } catch (err) {
      console.error('Error removing assignment:', err)
      alert('Failed to remove assignment')
    }
  }

  const filteredStaff = staff.filter(person => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      person.full_name.toLowerCase().includes(query) ||
      person.email.toLowerCase().includes(query) ||
      person.role.toLowerCase().includes(query)
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Cart Assignments</h1>
          <p className="text-gray-600 mt-1">Assign permanent consumables to staff members</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Start Date"
            />
          </div>
          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="End Date"
            />
          </div>
        </div>
      </div>

      {/* Staff List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map((person) => {
          let assignments = person.assigned_items || []
          
          // Filter by date range
          if (startDate || endDate) {
            assignments = assignments.filter(item => {
              const assignedDate = item.assigned_at ? new Date(item.assigned_at) : null
              if (!assignedDate) return false
              
              const start = startDate ? new Date(startDate) : null
              const end = endDate ? new Date(endDate + 'T23:59:59') : null
              
              if (start && assignedDate < start) return false
              if (end && assignedDate > end) return false
              return true
            })
          }
          
          const totalItems = assignments.reduce((sum, item) => sum + item.quantity, 0)

          return (
            <div key={person.id} className="bg-white rounded-lg shadow p-6">
              {/* Staff Info */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{person.full_name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{person.role}</p>
                  <p className="text-xs text-gray-400">{person.email}</p>
                </div>
                <button
                  onClick={() => handleOpenAssignModal(person)}
                  className="bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-lg"
                  title="Assign items"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Assigned Items */}
              {assignments.length === 0 ? (
                <div className="text-center py-4 text-gray-400">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No items assigned</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Assigned Cart:</span>
                    <span className="text-sm font-bold text-primary-600">{totalItems} items</span>
                  </div>
                  {assignments.map((item) => (
                    <div key={item.item_id} className="flex items-center justify-between bg-gray-50 rounded p-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{item.item_name_en}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity} {item.unit}</p>
                        {item.assigned_at && (
                          <p className="text-xs text-gray-400">
                            {new Date(item.assigned_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveAssignment(person, item)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Assign Items to Cart</h3>
                <p className="text-sm text-gray-600">{selectedStaff?.full_name}</p>
              </div>
              <button
                onClick={() => {
                  setShowAssignModal(false)
                  setSelectedStaff(null)
                  setCart([])
                  setItemSearchQuery('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Search Bar for Items */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={itemSearchQuery}
                    onChange={(e) => setItemSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                {items
                  .filter(item => {
                    if (!itemSearchQuery) return true
                    const query = itemSearchQuery.toLowerCase()
                    return (
                      item.item_name_en.toLowerCase().includes(query) ||
                      item.item_name_ar.toLowerCase().includes(query) ||
                      item.category?.toLowerCase().includes(query)
                    )
                  })
                  .map((item) => {
                  const inCart = cart.find(c => c.item_id === item.id)
                  const quantity = inCart?.quantity || 0

                  return (
                    <div
                      key={item.id}
                      className={`border-2 rounded-lg p-3 transition-all ${
                        quantity > 0 ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="text-center mb-2">
                        <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-900">{item.item_name_en}</p>
                        <p className="text-xs text-gray-500">{item.unit}</p>
                      </div>

                      {quantity === 0 ? (
                        <button
                          onClick={() => addItemToCart(item)}
                          className="w-full bg-primary-500 hover:bg-primary-600 text-white py-1 rounded text-sm"
                        >
                          Add
                        </button>
                      ) : (
                        <div className="flex items-center justify-between gap-1">
                          <button
                            onClick={() => removeItemFromCart(item.id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm"
                          >
                            -
                          </button>
                          <span className="font-bold text-gray-900">{quantity}</span>
                          <button
                            onClick={() => addItemToCart(item)}
                            className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-sm"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t p-6 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-bold text-gray-900">
                  Total: {cart.reduce((sum, item) => sum + item.quantity, 0)} items
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAssignModal(false)
                    setSelectedStaff(null)
                    setCart([])
                    setItemSearchQuery('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignItems}
                  disabled={cart.length === 0}
                  className={`flex-1 px-4 py-2 rounded-lg text-white ${
                    cart.length === 0
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-primary-600 hover:bg-primary-700'
                  }`}
                >
                  Assign to Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
