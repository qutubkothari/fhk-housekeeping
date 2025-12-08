import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/stores/authStore'
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Search,
  Filter,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  X,
  Download,
  Upload,
  ClipboardList,
  UserPlus
} from 'lucide-react'

export default function Inventory() {
  const { t } = useTranslation()
  const { user, orgId } = useAuthStore()
  
  const [activeTab, setActiveTab] = useState('items')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all') // all, low, out
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('add') // add, edit, view, transaction
  const [selectedItem, setSelectedItem] = useState(null)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [transactions, setTransactions] = useState([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  
  // Assign stock state
  const [rooms, setRooms] = useState([])
  const [staff, setStaff] = useState([])
  const [assignData, setAssignData] = useState({
    item_id: '',
    assign_to_type: 'room', // 'room' or 'staff'
    room_id: '',
    staff_id: '',
    quantity: 0,
    notes: ''
  })
  
  const [formData, setFormData] = useState({
    item_code: '',
    item_name_en: '',
    item_name_ar: '',
    category: 'consumables',
    unit: 'pcs',
    current_stock: 0,
    min_level: 0,
    reorder_level: 0,
    max_level: 0,
    unit_cost: 0,
    location: '',
    supplier: '',
    barcode: '',
    is_active: true
  })
  
  const [transactionData, setTransactionData] = useState({
    transaction_type: 'receipt',
    quantity: 0,
    notes: '',
    reference_number: ''
  })

  const categories = [
    { value: 'consumables', label: 'Consumables' },
    { value: 'cleaning_supplies', label: 'Cleaning Supplies' },
    { value: 'amenities', label: 'Amenities' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'toiletries', label: 'Toiletries' }
  ]

  const units = [
    { value: 'pcs', label: 'Pieces' },
    { value: 'kg', label: 'Kilograms' },
    { value: 'liters', label: 'Liters' },
    { value: 'boxes', label: 'Boxes' },
    { value: 'bottles', label: 'Bottles' },
    { value: 'rolls', label: 'Rolls' },
    { value: 'sets', label: 'Sets' }
  ]

  const transactionTypes = [
    { value: 'receipt', label: 'Receipt', icon: TrendingUp, color: 'text-green-600' },
    { value: 'issue', label: 'Issue', icon: TrendingDown, color: 'text-red-600' },
    { value: 'return', label: 'Return', icon: Upload, color: 'text-blue-600' },
    { value: 'adjustment', label: 'Adjustment', icon: RefreshCw, color: 'text-yellow-600' },
    { value: 'discard', label: 'Discard', icon: Trash2, color: 'text-gray-600' }
  ]

  const tabs = [
    { id: 'items', label: 'Items', icon: Package },
    { id: 'assign', label: 'Assign Stock', icon: UserPlus },
    { id: 'transactions', label: 'Transactions', icon: ClipboardList }
  ]

  useEffect(() => {
    fetchItems()
    fetchRooms()
    fetchStaff()
  }, [orgId])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => {
      fetchItems(true)
    }, 30000)
    return () => clearInterval(interval)
  }, [autoRefresh, orgId])

  const fetchItems = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('org_id', orgId)
        .order('item_name_en')

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('org_id', orgId)
        .order('room_number')

      if (error) throw error
      setRooms(data || [])
    } catch (error) {
      console.error('Error fetching rooms:', error)
    }
  }

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('org_id', orgId)
        .in('role', ['staff', 'supervisor', 'maintenance'])
        .eq('is_active', true)
        .order('full_name')

      if (error) throw error
      setStaff(data || [])
    } catch (error) {
      console.error('Error fetching staff:', error)
    }
  }

  const fetchTransactions = async (itemId) => {
    setLoadingTransactions(true)
    try {
      const { data, error } = await supabase
        .from('inventory_transactions')
        .select('*, created_by_user:users!inventory_transactions_created_by_fkey(full_name)')
        .eq('item_id', itemId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoadingTransactions(false)
    }
  }

  const handleAdd = () => {
    setModalMode('add')
    setFormData({
      item_code: '',
      item_name_en: '',
      item_name_ar: '',
      category: 'consumables',
      unit: 'pcs',
      current_stock: 0,
      min_level: 0,
      reorder_level: 0,
      max_level: 0,
      unit_cost: 0,
      location: '',
      supplier: '',
      barcode: '',
      is_active: true
    })
    setShowModal(true)
  }

  const handleEdit = (item) => {
    setModalMode('edit')
    setSelectedItem(item)
    setFormData({
      item_code: item.item_code,
      item_name_en: item.item_name_en,
      item_name_ar: item.item_name_ar,
      category: item.category,
      unit: item.unit,
      current_stock: item.current_stock,
      min_level: item.min_level,
      reorder_level: item.reorder_level,
      max_level: item.max_level,
      unit_cost: item.unit_cost,
      location: item.location || '',
      supplier: item.supplier || '',
      barcode: item.barcode || '',
      is_active: item.is_active
    })
    setShowModal(true)
  }

  const handleView = (item) => {
    setModalMode('view')
    setSelectedItem(item)
    setShowModal(true)
    fetchTransactions(item.id)
  }

  const handleDelete = async (item) => {
    if (!confirm(`Are you sure you want to delete ${item.item_name_en}?`)) return

    try {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', item.id)

      if (error) throw error
      fetchItems()
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Failed to delete item: ' + error.message)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (modalMode === 'add') {
        const { error } = await supabase
          .from('inventory_items')
          .insert([{ ...formData, org_id: orgId }])

        if (error) throw error
      } else if (modalMode === 'edit') {
        const { error } = await supabase
          .from('inventory_items')
          .update(formData)
          .eq('id', selectedItem.id)

        if (error) throw error
      }

      setShowModal(false)
      fetchItems()
    } catch (error) {
      console.error('Error saving item:', error)
      alert('Failed to save item: ' + error.message)
    }
  }

  const handleTransaction = async (e) => {
    e.preventDefault()
    
    try {
      const item = selectedItem
      let newStock = parseFloat(item.current_stock)
      const quantity = parseFloat(transactionData.quantity)

      // Calculate new stock based on transaction type
      if (transactionData.transaction_type === 'receipt' || transactionData.transaction_type === 'return') {
        newStock += quantity
      } else if (transactionData.transaction_type === 'issue' || transactionData.transaction_type === 'discard') {
        newStock -= quantity
      } else if (transactionData.transaction_type === 'adjustment') {
        newStock = quantity // Direct adjustment
      }

      if (newStock < 0) {
        alert('Stock cannot be negative')
        return
      }

      // Insert transaction
      const { error: transError } = await supabase
        .from('inventory_transactions')
        .insert([{
          org_id: orgId,
          item_id: item.id,
          transaction_type: transactionData.transaction_type,
          quantity: transactionData.transaction_type === 'adjustment' ? quantity - item.current_stock : quantity,
          balance_after: newStock,
          notes: transactionData.notes,
          reference_number: transactionData.reference_number,
          created_by: user.id
        }])

      if (transError) throw transError

      // Update item stock
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ current_stock: newStock })
        .eq('id', item.id)

      if (updateError) throw updateError

      setShowTransactionModal(false)
      setTransactionData({
        transaction_type: 'receipt',
        quantity: 0,
        notes: '',
        reference_number: ''
      })
      fetchItems()
      fetchTransactions(item.id)
    } catch (error) {
      console.error('Error creating transaction:', error)
      alert('Failed to create transaction: ' + error.message)
    }
  }

  const openTransactionModal = (item) => {
    setSelectedItem(item)
    setTransactionData({
      transaction_type: 'receipt',
      quantity: 0,
      notes: '',
      reference_number: ''
    })
    setShowTransactionModal(true)
  }

  const handleAssignStock = async (e) => {
    e.preventDefault()
    
    try {
      const item = items.find(i => i.id === assignData.item_id)
      if (!item) throw new Error('Item not found')
      
      if (assignData.quantity > item.current_stock) {
        alert('Insufficient stock available')
        return
      }

      // Build assignment description
      let assignmentDesc = ''
      if (assignData.assign_to_type === 'room') {
        const room = rooms.find(r => r.id === assignData.room_id)
        assignmentDesc = `Assigned to Room ${room?.room_number}`
      } else {
        const staffMember = staff.find(s => s.id === assignData.staff_id)
        assignmentDesc = `Assigned to Staff: ${staffMember?.full_name}`
      }
      if (assignData.notes) assignmentDesc += ` - ${assignData.notes}`

      // Create transaction for stock assignment
      const newStock = parseFloat(item.current_stock) - parseFloat(assignData.quantity)
      
      const { error: transError } = await supabase
        .from('inventory_transactions')
        .insert([{
          org_id: orgId,
          item_id: assignData.item_id,
          transaction_type: 'issue',
          quantity: assignData.quantity,
          balance_after: newStock,
          notes: assignmentDesc,
          created_by: user.id
        }])

      if (transError) throw transError

      // Update item stock
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ current_stock: newStock })
        .eq('id', assignData.item_id)

      if (updateError) throw updateError

      setAssignData({
        item_id: '',
        assign_to_type: 'room',
        room_id: '',
        staff_id: '',
        quantity: 0,
        notes: ''
      })
      
      fetchItems()
      alert('Stock assigned successfully')
    } catch (error) {
      console.error('Error assigning stock:', error)
      alert('Failed to assign stock: ' + error.message)
    }
  }

  const getStockStatus = (item) => {
    if (item.current_stock <= 0) return { status: 'out', label: 'Out of Stock', color: 'bg-red-100 text-red-800' }
    if (item.current_stock <= item.reorder_level) return { status: 'low', label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' }
    if (item.current_stock <= item.min_level) return { status: 'warning', label: 'Below Min', color: 'bg-orange-100 text-orange-800' }
    return { status: 'ok', label: 'In Stock', color: 'bg-green-100 text-green-800' }
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.item_name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.item_name_ar.includes(searchTerm) ||
      item.item_code.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
    
    let matchesStock = true
    if (stockFilter === 'low') {
      matchesStock = item.current_stock <= item.reorder_level && item.current_stock > 0
    } else if (stockFilter === 'out') {
      matchesStock = item.current_stock <= 0
    }
    
    return matchesSearch && matchesCategory && matchesStock
  })

  const stats = {
    total: items.length,
    lowStock: items.filter(i => i.current_stock <= i.reorder_level && i.current_stock > 0).length,
    outOfStock: items.filter(i => i.current_stock <= 0).length,
    totalValue: items.reduce((sum, item) => sum + (item.current_stock * item.unit_cost), 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-gray-600">Loading inventory...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Track and manage stock levels</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchItems()}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {activeTab === 'items' && (
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          )}
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
          {/* Items Tab */}
          {activeTab === 'items' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">${stats.totalValue.toFixed(2)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Stock Levels</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reorder Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => {
                const stockStatus = getStockStatus(item)
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.item_code}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.item_name_en}</div>
                        <div className="text-sm text-gray-500">{item.item_name_ar}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {categories.find(c => c.value === item.category)?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.current_stock} {item.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.reorder_level} {item.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${stockStatus.color}`}>
                        {stockStatus.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${item.unit_cost.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setAssignData({ ...assignData, item_id: item.id })
                            setActiveTab('assign')
                          }}
                          className="text-purple-600 hover:text-purple-900"
                          title="Quick Assign"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleView(item)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openTransactionModal(item)}
                          className="text-green-600 hover:text-green-900"
                          title="Add Transaction"
                        >
                          <TrendingUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No items found</p>
            </div>
          )}
        </div>
      </div>
            </>
          )}

          {/* Assign Stock Tab */}
          {activeTab === 'assign' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800">Assign inventory items to rooms or staff members</p>
              </div>

              <form onSubmit={handleAssignStock} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Item *</label>
                    <select
                      value={assignData.item_id}
                      onChange={(e) => setAssignData({ ...assignData, item_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Choose an item...</option>
                      {items.filter(i => i.current_stock > 0).map(item => (
                        <option key={item.id} value={item.id}>
                          {item.item_name_en} (Stock: {item.current_stock} {item.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign To *</label>
                    <select
                      value={assignData.assign_to_type}
                      onChange={(e) => setAssignData({ ...assignData, assign_to_type: e.target.value, room_id: '', staff_id: '' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="room">Room</option>
                      <option value="staff">Staff Member</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {assignData.assign_to_type === 'room' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select Room *</label>
                      <select
                        value={assignData.room_id}
                        onChange={(e) => setAssignData({ ...assignData, room_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Choose a room...</option>
                        {rooms.map(room => (
                          <option key={room.id} value={room.id}>
                            {room.room_number} - {room.room_type}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select Staff *</label>
                      <select
                        value={assignData.staff_id}
                        onChange={(e) => setAssignData({ ...assignData, staff_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Choose a staff member...</option>
                        {staff.map(member => (
                          <option key={member.id} value={member.id}>
                            {member.full_name} - {member.role}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={assignData.quantity}
                      onChange={(e) => setAssignData({ ...assignData, quantity: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    {assignData.item_id && (
                      <p className="text-sm text-gray-500 mt-1">
                        Available: {items.find(i => i.id === assignData.item_id)?.current_stock || 0}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <input
                      type="text"
                      value={assignData.notes}
                      onChange={(e) => setAssignData({ ...assignData, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional notes..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAssignData({ item_id: '', assign_to_type: 'room', room_id: '', staff_id: '', quantity: 0, notes: '' })}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Clear
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Assign Stock
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800">View all inventory transactions and movements</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <p className="text-gray-500 text-center">Select an item from the Items tab to view its transaction history</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (modalMode === 'add' || modalMode === 'edit') && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {modalMode === 'add' ? 'Add New Item' : 'Edit Item'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Code *</label>
                  <input
                    type="text"
                    value={formData.item_code}
                    onChange={(e) => setFormData({ ...formData, item_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Name (English) *</label>
                  <input
                    type="text"
                    value={formData.item_name_en}
                    onChange={(e) => setFormData({ ...formData, item_name_en: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Name (Arabic) *</label>
                  <input
                    type="text"
                    value={formData.item_name_ar}
                    onChange={(e) => setFormData({ ...formData, item_name_ar: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {units.map(unit => (
                      <option key={unit.value} value={unit.value}>{unit.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.current_stock}
                    onChange={(e) => setFormData({ ...formData, current_stock: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Level</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.min_level}
                    onChange={(e) => setFormData({ ...formData, min_level: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.reorder_level}
                    onChange={(e) => setFormData({ ...formData, reorder_level: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Level</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.max_level}
                    onChange={(e) => setFormData({ ...formData, max_level: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unit_cost}
                    onChange={(e) => setFormData({ ...formData, unit_cost: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active</label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {modalMode === 'add' ? 'Add Item' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showModal && modalMode === 'view' && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Item Details</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Item Code</h3>
                  <p className="mt-1 text-lg font-semibold">{selectedItem.item_code}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Barcode</h3>
                  <p className="mt-1 text-lg">{selectedItem.barcode || '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Item Name (EN)</h3>
                  <p className="mt-1 text-lg">{selectedItem.item_name_en}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Item Name (AR)</h3>
                  <p className="mt-1 text-lg" dir="rtl">{selectedItem.item_name_ar}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Category</h3>
                  <p className="mt-1 text-lg">{categories.find(c => c.value === selectedItem.category)?.label}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Unit</h3>
                  <p className="mt-1 text-lg">{selectedItem.unit}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <span className={`inline-block px-2 py-1 text-sm font-medium rounded ${getStockStatus(selectedItem).color}`}>
                    {getStockStatus(selectedItem).label}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Current Stock</h3>
                  <p className="mt-1 text-2xl font-bold text-blue-600">{selectedItem.current_stock}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Min Level</h3>
                  <p className="mt-1 text-2xl font-bold">{selectedItem.min_level}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Reorder Level</h3>
                  <p className="mt-1 text-2xl font-bold">{selectedItem.reorder_level}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Max Level</h3>
                  <p className="mt-1 text-2xl font-bold">{selectedItem.max_level}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Unit Cost</h3>
                  <p className="mt-1 text-lg font-semibold">${selectedItem.unit_cost.toFixed(2)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Location</h3>
                  <p className="mt-1 text-lg">{selectedItem.location || '-'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Supplier</h3>
                  <p className="mt-1 text-lg">{selectedItem.supplier || '-'}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Recent Transactions</h3>
                {loadingTransactions ? (
                  <div className="text-center py-4">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                  </div>
                ) : transactions.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No transactions yet</p>
                ) : (
                  <div className="space-y-2">
                    {transactions.map((trans) => {
                      const transType = transactionTypes.find(t => t.value === trans.transaction_type)
                      const Icon = transType?.icon || Package
                      return (
                        <div key={trans.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div className="flex items-center gap-3">
                            <Icon className={`w-5 h-5 ${transType?.color}`} />
                            <div>
                              <p className="font-medium">{transType?.label}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(trans.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{trans.quantity > 0 ? '+' : ''}{trans.quantity} {selectedItem.unit}</p>
                            <p className="text-sm text-gray-500">Balance: {trans.balance_after}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {showTransactionModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Add Transaction</h2>
              <button onClick={() => setShowTransactionModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleTransaction} className="p-6 space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">{selectedItem.item_name_en}</h3>
                <p className="text-sm text-gray-500">Current Stock: {selectedItem.current_stock} {selectedItem.unit}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type *</label>
                <select
                  value={transactionData.transaction_type}
                  onChange={(e) => setTransactionData({ ...transactionData, transaction_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {transactionTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {transactionData.transaction_type === 'adjustment' ? 'New Stock Level *' : 'Quantity *'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={transactionData.quantity}
                  onChange={(e) => setTransactionData({ ...transactionData, quantity: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
                <input
                  type="text"
                  value={transactionData.reference_number}
                  onChange={(e) => setTransactionData({ ...transactionData, reference_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="PO#, Invoice#, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={transactionData.notes}
                  onChange={(e) => setTransactionData({ ...transactionData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTransactionModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Submit Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
