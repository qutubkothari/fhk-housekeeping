import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Plus, Search, Package, AlertTriangle, TrendingDown, TrendingUp, UserPlus, X, ShoppingCart, Trash2, Edit2, Grid, List } from 'lucide-react'
import { translations } from '../translations'

export default function Inventory({ user, lang = 'en' }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('items')
  const [viewMode, setViewMode] = useState('cards') // 'cards' or 'table' for staff assignments
  const [staff, setStaff] = useState([])
  const [showItemModal, setShowItemModal] = useState(false)
  const [modalMode, setModalMode] = useState('add')
  const [selectedItem, setSelectedItem] = useState(null)
  const [itemFormData, setItemFormData] = useState({
    item_name_en: '',
    item_name_ar: '',
    category: 'cleaning',
    current_stock: 0,
    reorder_level: 10,
    unit: 'piece',
    location: '',
    notes: ''
  })
  
  // Staff cart modal states
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [cart, setCart] = useState([])
  const [itemSearchQuery, setItemSearchQuery] = useState('')
  const [staffSearchQuery, setStaffSearchQuery] = useState('')
  
  const t = (key) => translations[key]?.[lang] || translations[key]?.en || key

  useEffect(() => {
    console.log('🔵 Inventory v3.0 - WITH STAFF CARTS')
    console.log('👤 User role:', user?.role)
    if (user?.org_id) {
      loadData()
    }
  }, [user?.org_id])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load inventory items
      const { data: itemsData, error: itemsError } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('org_id', user.org_id)
        .eq('is_active', true)
        .order('item_name_en')

      if (itemsError) throw itemsError
      setItems(itemsData || [])

      // Load staff with their cart assignments
      const { data: staffData, error: staffError } = await supabase
        .from('users')
        .select('*')
        .eq('org_id', user.org_id)
        .in('role', ['staff', 'maintenance', 'laundry', 'inventory'])
        .eq('is_active', true)
        .order('full_name')

      if (staffError) throw staffError

      // Load existing cart assignments from metadata
      const staffWithCarts = (staffData || []).map(person => ({
        ...person,
        assigned_items: person.metadata?.assigned_items || []
      }))
      
      setStaff(staffWithCarts)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAssignModal = (staffMember) => {
    setSelectedStaff(staffMember)
    setCart([])
    setShowAssignModal(true)
  }

  const handleAddItem = () => {
    setModalMode('add')
    setSelectedItem(null)
    setItemFormData({
      item_name_en: '',
      item_name_ar: '',
      category: 'cleaning',
      current_stock: 0,
      reorder_level: 10,
      unit: 'piece',
      location: '',
      notes: ''
    })
    setShowItemModal(true)
  }

  const handleEditItem = (item) => {
    setModalMode('edit')
    setSelectedItem(item)
    setItemFormData({
      item_name_en: item.item_name_en,
      item_name_ar: item.item_name_ar || '',
      category: item.category,
      current_stock: item.current_stock,
      reorder_level: item.reorder_level,
      unit: item.unit,
      location: item.location || '',
      notes: item.notes || ''
    })
    setShowItemModal(true)
  }

  const handleDeleteItem = async (item) => {
    if (!confirm(`Are you sure you want to delete "${item.item_name_en}"?`)) return

    try {
      const { error } = await supabase
        .from('inventory_items')
        .update({ is_active: false })
        .eq('id', item.id)

      if (error) throw error
      alert('Item deleted successfully')
      loadData()
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Failed to delete item: ' + error.message)
    }
  }

  const handleSaveItem = async (e) => {
    e.preventDefault()

    try {
      if (modalMode === 'add') {
        const { error } = await supabase
          .from('inventory_items')
          .insert([{
            org_id: user.org_id,
            ...itemFormData,
            is_active: true
          }])

        if (error) throw error
        alert('Item added successfully')
      } else {
        const { error } = await supabase
          .from('inventory_items')
          .update(itemFormData)
          .eq('id', selectedItem.id)

        if (error) throw error
        alert('Item updated successfully')
      }

      setShowItemModal(false)
      loadData()
    } catch (error) {
      console.error('Error saving item:', error)
      alert('Failed to save item: ' + error.message)
    }
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
      
      // Merge new items with existing
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

      // Record transaction
      await supabase
        .from('inventory_transactions')
        .insert({
          org_id: user.org_id,
          staff_id: selectedStaff.id,
          transaction_type: 'issue',
          items: cart,
          notes: 'Permanent assignment to staff cart'
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

  const filteredItems = items.filter(item =>
    item.item_name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    total: items.length,
    low_stock: items.filter(i => i.current_stock <= i.reorder_level).length,
    out_of_stock: items.filter(i => i.current_stock === 0).length,
    in_stock: items.filter(i => i.current_stock > i.reorder_level).length,
  }

  const getStockStatus = (item) => {
    if (item.current_stock === 0) return { text: t('outOfStock'), color: 'bg-red-100 text-red-700 border-red-200' }
    if (item.current_stock <= item.reorder_level) return { text: t('lowStock'), color: 'bg-yellow-100 text-yellow-700 border-yellow-200' }
    return { text: t('inStock'), color: 'bg-green-100 text-green-700 border-green-200' }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div></div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
      </div>

      {/* Tabs */}
      {(user.role === 'admin' || user.role === 'super_admin' || user.role === 'inventory') && (
        <div className="bg-white rounded-xl shadow-lg p-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('items')}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === 'items'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Items
            </button>
            <button
              onClick={() => setActiveTab('assign')}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === 'assign'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Assign Stock
            </button>
          </div>
        </div>
      )}

      {/* Items Tab */}
      {activeTab === 'items' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: t('totalItems'), value: stats.total, color: 'from-blue-500 to-blue-600', icon: Package },
          { label: t('inStock'), value: stats.in_stock, color: 'from-green-500 to-green-600', icon: TrendingUp },
          { label: t('lowStock'), value: stats.low_stock, color: 'from-yellow-500 to-yellow-600', icon: AlertTriangle },
          { label: t('outOfStock'), value: stats.out_of_stock, color: 'from-red-500 to-red-600', icon: TrendingDown },
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

      {/* Search */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t('search') + '...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleAddItem}
            className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            {t('addNewItem')}
          </button>
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map(item => {
          const status = getStockStatus(item)
          return (
            <div key={item.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-6 border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{item.item_name_en}</h3>
                  <p className="text-sm text-gray-500 capitalize">{item.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${status.color}`}>
                    {status.text}
                  </span>
                  <button
                    onClick={() => handleEditItem(item)}
                    className="text-blue-600 hover:text-blue-900 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item)}
                    className="text-red-600 hover:text-red-900 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">{t('currentStock')}</span>
                  <span className="text-xl font-bold text-gray-900">{item.current_stock}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('reorderLevel')}:</span>
                  <span className="font-semibold text-gray-900">{item.reorder_level}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('unit')}:</span>
                  <span className="font-semibold text-gray-900 capitalize">{item.unit}</span>
                </div>
                {item.location && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('location')}:</span>
                    <span className="font-semibold text-gray-900">{item.location}</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No inventory items found</p>
        </div>
      )}
        </>
      )}

      {/* Assign Stock Tab - Staff Carts */}
      {activeTab === 'assign' && (
        <div className="space-y-6">
          {/* Header with search and view toggle */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-blue-100">
            <div className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search staff..."
                  value={staffSearchQuery}
                  onChange={(e) => setStaffSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
              </div>
              
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
                    viewMode === 'cards'
                      ? 'bg-white text-blue-600 shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                  <span className="hidden sm:inline">Cards</span>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
                    viewMode === 'table'
                      ? 'bg-white text-blue-600 shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">Table</span>
                </button>
              </div>
            </div>
          </div>

          {/* Staff Cards Grid */}
          {viewMode === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {staff
              .filter(person => {
                if (!staffSearchQuery) return true
                const query = staffSearchQuery.toLowerCase()
                return (
                  person.full_name.toLowerCase().includes(query) ||
                  person.email.toLowerCase().includes(query) ||
                  person.role.toLowerCase().includes(query)
                )
              })
              .map((person) => {
                const assignments = person.assigned_items || []
                const totalItems = assignments.reduce((sum, item) => sum + item.quantity, 0)

                return (
                  <div 
                    key={person.id} 
                    className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-blue-100 hover:shadow-xl transition-all hover:border-blue-300"
                  >
                    {/* Staff Info Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg">{person.full_name}</h3>
                        <p className="text-sm text-blue-600 capitalize font-medium">{person.role}</p>
                        <p className="text-xs text-gray-500">{person.email}</p>
                      </div>
                      <button
                        onClick={() => handleOpenAssignModal(person)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
                        title="Assign items"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Assigned Items */}
                    {assignments.length === 0 ? (
                      <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-xl">
                        <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No items assigned</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                          <span className="text-sm font-medium text-gray-700">Assigned Cart:</span>
                          <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {totalItems} items
                          </span>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {assignments.map((item) => (
                            <div 
                              key={item.item_id} 
                              className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-3 border border-blue-100"
                            >
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{item.item_name_en}</p>
                                <p className="text-xs text-gray-600">Qty: {item.quantity} {item.unit}</p>
                                {item.assigned_at && (
                                  <p className="text-xs text-gray-500">
                                    {new Date(item.assigned_at).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => handleRemoveAssignment(person, item)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
          )}

          {/* Staff Table View */}
          {viewMode === 'table' && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-blue-50 to-purple-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Staff Member</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Total Items</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Assigned Items</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {staff
                      .filter(person => {
                        if (!staffSearchQuery) return true
                        const query = staffSearchQuery.toLowerCase()
                        return (
                          person.full_name.toLowerCase().includes(query) ||
                          person.email.toLowerCase().includes(query) ||
                          person.role.toLowerCase().includes(query)
                        )
                      })
                      .map((person, index) => {
                        const assignments = person.assigned_items || []
                        const totalItems = assignments.reduce((sum, item) => sum + item.quantity, 0)

                        return (
                          <tr key={person.id} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-bold text-gray-900">{person.full_name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                                {person.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">{person.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700">
                                {totalItems}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {assignments.length === 0 ? (
                                <span className="text-sm text-gray-400 italic">No items assigned</span>
                              ) : (
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                  {assignments.map((item) => (
                                    <div key={item.item_id} className="flex items-center justify-between text-xs bg-gradient-to-r from-blue-50 to-purple-50 rounded px-2 py-1 border border-blue-100">
                                      <span className="font-medium text-gray-800">{item.item_name_en}</span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-gray-600">Qty: {item.quantity} {item.unit}</span>
                                        <button
                                          onClick={() => handleRemoveAssignment(person, item)}
                                          className="text-red-500 hover:text-red-700 hover:bg-red-100 p-1 rounded transition-all"
                                          title="Remove item"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <button
                                onClick={() => handleOpenAssignModal(person)}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-2 rounded-lg shadow-md hover:shadow-lg transition-all"
                                title="Assign items"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
              
              {/* Empty State */}
              {staff.filter(person => {
                if (!staffSearchQuery) return true
                const query = staffSearchQuery.toLowerCase()
                return (
                  person.full_name.toLowerCase().includes(query) ||
                  person.email.toLowerCase().includes(query) ||
                  person.role.toLowerCase().includes(query)
                )
              }).length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No staff members found</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Assignment Modal */}
          {showAssignModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600">
                  <div>
                    <h3 className="text-xl font-bold text-white">Assign Items to Cart</h3>
                    <p className="text-sm text-blue-100">{selectedStaff?.full_name}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowAssignModal(false)
                      setSelectedStaff(null)
                      setCart([])
                      setItemSearchQuery('')
                    }}
                    className="text-white hover:bg-white/20 p-2 rounded-lg transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-blue-50 via-white to-purple-50">
                  {/* Search Bar for Items */}
                  <div className="mb-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search items..."
                        value={itemSearchQuery}
                        onChange={(e) => setItemSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {items
                      .filter(item => {
                        if (!itemSearchQuery) return true
                        const query = itemSearchQuery.toLowerCase()
                        return (
                          item.item_name_en.toLowerCase().includes(query) ||
                          item.item_name_ar?.toLowerCase().includes(query) ||
                          item.category?.toLowerCase().includes(query)
                        )
                      })
                      .map((item) => {
                        const inCart = cart.find(c => c.item_id === item.id)
                        const quantity = inCart?.quantity || 0

                        return (
                          <div
                            key={item.id}
                            className={`border-2 rounded-xl p-4 transition-all ${
                              quantity > 0 
                                ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 shadow-md' 
                                : 'border-gray-200 bg-white hover:border-blue-300'
                            }`}
                          >
                            <div className="text-center mb-3">
                              <Package className={`w-10 h-10 mx-auto mb-2 ${quantity > 0 ? 'text-blue-500' : 'text-gray-400'}`} />
                              <p className="text-sm font-medium text-gray-900">{item.item_name_en}</p>
                              <p className="text-xs text-gray-500">{item.unit}</p>
                            </div>

                            {quantity === 0 ? (
                              <button
                                onClick={() => addItemToCart(item)}
                                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-2 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
                              >
                                Add
                              </button>
                            ) : (
                              <div className="flex items-center justify-between gap-2">
                                <button
                                  onClick={() => removeItemFromCart(item.id)}
                                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all shadow-md"
                                >
                                  -
                                </button>
                                <span className="font-bold text-gray-900 text-lg">{quantity}</span>
                                <button
                                  onClick={() => addItemToCart(item)}
                                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all shadow-md"
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
                <div className="border-t p-6 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Total: {cart.reduce((sum, item) => sum + item.quantity, 0)} items
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setShowAssignModal(false)
                        setSelectedStaff(null)
                        setCart([])
                        setItemSearchQuery('')
                      }}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAssignItems}
                      disabled={cart.length === 0}
                      className={`flex-1 px-6 py-3 rounded-xl text-white font-medium transition-all ${
                        cart.length === 0
                          ? 'bg-gray-300 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
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
      )}

      {/* Add/Edit Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {modalMode === 'edit' ? <Edit2 className="w-6 h-6 text-white" /> : <Plus className="w-6 h-6 text-white" />}
                <h2 className="text-xl font-bold text-white">{modalMode === 'edit' ? 'Edit Inventory Item' : 'Add New Inventory Item'}</h2>
              </div>
              <button
                onClick={() => {
                  setShowItemModal(false)
                  setSelectedItem(null)
                }}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('itemName')} (English) *</label>
                  <input
                    type="text"
                    value={itemFormData.item_name_en}
                    onChange={(e) => setItemFormData({ ...itemFormData, item_name_en: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('itemName')} (Arabic)</label>
                  <input
                    type="text"
                    value={itemFormData.item_name_ar}
                    onChange={(e) => setItemFormData({ ...itemFormData, item_name_ar: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    dir="rtl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('category')} *</label>
                  <select
                    value={itemFormData.category}
                    onChange={(e) => setItemFormData({ ...itemFormData, category: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  >
                    <option value="cleaning">Cleaning</option>
                    <option value="linens">Linens</option>
                    <option value="amenities">Amenities</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="kitchen">Kitchen</option>
                    <option value="office">Office</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('unit')} *</label>
                  <select
                    value={itemFormData.unit}
                    onChange={(e) => setItemFormData({ ...itemFormData, unit: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  >
                    <option value="piece">Piece</option>
                    <option value="box">Box</option>
                    <option value="bottle">Bottle</option>
                    <option value="kg">Kilogram</option>
                    <option value="liter">Liter</option>
                    <option value="pack">Pack</option>
                    <option value="roll">Roll</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('currentStock')} *</label>
                  <input
                    type="number"
                    value={itemFormData.current_stock}
                    onChange={(e) => setItemFormData({ ...itemFormData, current_stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('reorderLevel')} *</label>
                  <input
                    type="number"
                    value={itemFormData.reorder_level}
                    onChange={(e) => setItemFormData({ ...itemFormData, reorder_level: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                    min="0"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('location')}</label>
                  <input
                    type="text"
                    value={itemFormData.location}
                    onChange={(e) => setItemFormData({ ...itemFormData, location: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., Storage Room A, Shelf 3"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('notes')}</label>
                  <textarea
                    value={itemFormData.notes}
                    onChange={(e) => setItemFormData({ ...itemFormData, notes: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    rows="3"
                    placeholder="Additional notes about this item..."
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {modalMode === 'edit' ? (
                    <>
                      <Edit2 className="w-5 h-5" />
                      {t('update')} {t('itemName')}
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      {t('add')} {t('itemName')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}