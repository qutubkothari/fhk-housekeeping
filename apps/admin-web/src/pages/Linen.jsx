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
  RefreshCw,
  X,
  ArrowRight,
  Sparkles,
  Recycle,
  AlertTriangle,
  CheckCircle,
  Loader,
  TrendingUp,
  ClipboardList,
  UserPlus
} from 'lucide-react'

export default function Linen() {
  const { t } = useTranslation()
  const { user, orgId } = useAuthStore()
  
  const [activeTab, setActiveTab] = useState('items')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all') // all, below_par, damaged
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('add') // add, edit, view, transaction
  const [selectedItem, setSelectedItem] = useState(null)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [transactions, setTransactions] = useState([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  
  // Assign linen state
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
    linen_type: 'bed_sheet',
    size: 'double',
    color: 'white',
    item_name_en: '',
    item_name_ar: '',
    total_stock: 0,
    clean_stock: 0,
    soiled_stock: 0,
    in_laundry: 0,
    damaged_stock: 0,
    par_level: 0,
    unit_cost: 0,
    is_active: true
  })
  
  const [transactionData, setTransactionData] = useState({
    transaction_type: 'issue_clean',
    quantity: 0,
    notes: '',
    damage_reason: ''
  })

  const linenTypes = [
    { value: 'bed_sheet', label: 'Bed Sheet', icon: '🛏️' },
    { value: 'pillow_case', label: 'Pillow Case', icon: '🛌' },
    { value: 'towel', label: 'Towel', icon: '🧴' },
    { value: 'bathrobe', label: 'Bathrobe', icon: '👘' },
    { value: 'blanket', label: 'Blanket', icon: '🧣' },
    { value: 'duvet', label: 'Duvet', icon: '🛌' },
    { value: 'mattress_protector', label: 'Mattress Protector', icon: '🛡️' }
  ]

  const sizes = [
    { value: 'single', label: 'Single' },
    { value: 'double', label: 'Double' },
    { value: 'queen', label: 'Queen' },
    { value: 'king', label: 'King' }
  ]

  const transactionTypes = [
    { value: 'issue_clean', label: 'Issue Clean', icon: ArrowRight, color: 'text-green-600' },
    { value: 'return_soiled', label: 'Return Soiled', icon: Recycle, color: 'text-orange-600' },
    { value: 'send_laundry', label: 'Send to Laundry', icon: Loader, color: 'text-blue-600' },
    { value: 'receive_laundry', label: 'Receive from Laundry', icon: CheckCircle, color: 'text-green-600' },
    { value: 'mark_damaged', label: 'Mark Damaged', icon: AlertTriangle, color: 'text-red-600' },
    { value: 'purchase', label: 'Purchase', icon: TrendingUp, color: 'text-purple-600' }
  ]

  const tabs = [
    { id: 'items', label: 'Items', icon: Package },
    { id: 'assign', label: 'Assign Linen', icon: UserPlus },
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
        .from('linen_items')
        .select('*')
        .eq('org_id', orgId)
        .order('item_name_en')

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error('Error fetching linen:', error)
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
        .from('linen_transactions')
        .select('*, created_by_user:users!linen_transactions_created_by_fkey(full_name), room:rooms(room_number)')
        .eq('linen_id', itemId)
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
      linen_type: 'bed_sheet',
      size: 'double',
      color: 'white',
      item_name_en: '',
      item_name_ar: '',
      total_stock: 0,
      clean_stock: 0,
      soiled_stock: 0,
      in_laundry: 0,
      damaged_stock: 0,
      par_level: 0,
      unit_cost: 0,
      is_active: true
    })
    setShowModal(true)
  }

  const handleEdit = (item) => {
    setModalMode('edit')
    setSelectedItem(item)
    setFormData({
      linen_type: item.linen_type,
      size: item.size || 'double',
      color: item.color || 'white',
      item_name_en: item.item_name_en,
      item_name_ar: item.item_name_ar,
      total_stock: item.total_stock,
      clean_stock: item.clean_stock,
      soiled_stock: item.soiled_stock,
      in_laundry: item.in_laundry,
      damaged_stock: item.damaged_stock,
      par_level: item.par_level,
      unit_cost: item.unit_cost,
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
        .from('linen_items')
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
          .from('linen_items')
          .insert([{ ...formData, org_id: orgId }])

        if (error) throw error
      } else if (modalMode === 'edit') {
        const { error } = await supabase
          .from('linen_items')
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
      let newClean = parseInt(item.clean_stock)
      let newSoiled = parseInt(item.soiled_stock)
      let newLaundry = parseInt(item.in_laundry)
      let newDamaged = parseInt(item.damaged_stock)
      const quantity = parseInt(transactionData.quantity)

      // Calculate new stock based on transaction type
      switch (transactionData.transaction_type) {
        case 'issue_clean':
          if (newClean < quantity) {
            alert('Not enough clean stock')
            return
          }
          newClean -= quantity
          break
        case 'return_soiled':
          newSoiled += quantity
          break
        case 'send_laundry':
          if (newSoiled < quantity) {
            alert('Not enough soiled stock')
            return
          }
          newSoiled -= quantity
          newLaundry += quantity
          break
        case 'receive_laundry':
          if (newLaundry < quantity) {
            alert('Not enough items in laundry')
            return
          }
          newLaundry -= quantity
          newClean += quantity
          break
        case 'mark_damaged':
          newDamaged += quantity
          break
        case 'purchase':
          newClean += quantity
          break
      }

      const newTotal = newClean + newSoiled + newLaundry + newDamaged

      // Insert transaction
      const { error: transError } = await supabase
        .from('linen_transactions')
        .insert([{
          org_id: orgId,
          linen_id: item.id,
          transaction_type: transactionData.transaction_type,
          quantity: quantity,
          notes: transactionData.notes,
          damage_reason: transactionData.damage_reason || null,
          created_by: user.id
        }])

      if (transError) throw transError

      // Update item stock
      const { error: updateError } = await supabase
        .from('linen_items')
        .update({
          total_stock: newTotal,
          clean_stock: newClean,
          soiled_stock: newSoiled,
          in_laundry: newLaundry,
          damaged_stock: newDamaged
        })
        .eq('id', item.id)

      if (updateError) throw updateError

      setShowTransactionModal(false)
      setTransactionData({
        transaction_type: 'issue_clean',
        quantity: 0,
        notes: '',
        damage_reason: ''
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
      transaction_type: 'issue_clean',
      quantity: 0,
      notes: '',
      damage_reason: ''
    })
    setShowTransactionModal(true)
  }

  const handleAssignLinen = async (e) => {
    e.preventDefault()
    
    try {
      const item = items.find(i => i.id === assignData.item_id)
      if (!item) throw new Error('Item not found')
      
      if (assignData.quantity > item.clean_stock) {
        alert('Insufficient clean stock available')
        return
      }

      // Build assignment description
      let assignmentDesc = assignData.notes || ''
      if (assignData.assign_to_type === 'room') {
        const room = rooms.find(r => r.id === assignData.room_id)
        if (assignmentDesc) assignmentDesc = `Room ${room?.room_number} - ${assignmentDesc}`
      } else {
        const staffMember = staff.find(s => s.id === assignData.staff_id)
        if (assignmentDesc) assignmentDesc = `Staff: ${staffMember?.full_name} - ${assignmentDesc}`
        else assignmentDesc = `Assigned to Staff: ${staffMember?.full_name}`
      }

      // Create transaction for linen assignment
      const newCleanStock = parseInt(item.clean_stock) - parseInt(assignData.quantity)
      
      const { error: transError } = await supabase
        .from('linen_transactions')
        .insert([{
          org_id: orgId,
          linen_id: assignData.item_id,
          room_id: assignData.assign_to_type === 'room' ? assignData.room_id : null,
          transaction_type: 'issue_clean',
          quantity: assignData.quantity,
          clean_stock_after: newCleanStock,
          soiled_stock_after: item.soiled_stock,
          in_laundry_after: item.in_laundry,
          damaged_stock_after: item.damaged_stock,
          notes: assignmentDesc,
          created_by: user.id
        }])

      if (transError) throw transError

      // Update item clean stock
      const { error: updateError } = await supabase
        .from('linen_items')
        .update({ clean_stock: newCleanStock })
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
      alert('Linen assigned successfully')
    } catch (error) {
      console.error('Error assigning linen:', error)
      alert('Failed to assign linen: ' + error.message)
    }
  }

  const getStockStatus = (item) => {
    const available = item.clean_stock
    if (available === 0) return { status: 'out', label: 'No Clean Stock', color: 'bg-red-100 text-red-800' }
    if (available < item.par_level * 0.3) return { status: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' }
    if (available < item.par_level * 0.5) return { status: 'low', label: 'Low', color: 'bg-yellow-100 text-yellow-800' }
    return { status: 'ok', label: 'Good', color: 'bg-green-100 text-green-800' }
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.item_name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.item_name_ar.includes(searchTerm) ||
      item.linen_type.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === 'all' || item.linen_type === typeFilter
    
    let matchesStatus = true
    if (statusFilter === 'below_par') {
      matchesStatus = item.clean_stock < item.par_level * 0.5
    } else if (statusFilter === 'damaged') {
      matchesStatus = item.damaged_stock > 0
    }
    
    return matchesSearch && matchesType && matchesStatus
  })

  const stats = {
    totalItems: items.length,
    totalClean: items.reduce((sum, i) => sum + i.clean_stock, 0),
    totalSoiled: items.reduce((sum, i) => sum + i.soiled_stock, 0),
    totalLaundry: items.reduce((sum, i) => sum + i.in_laundry, 0),
    totalDamaged: items.reduce((sum, i) => sum + i.damaged_stock, 0),
    belowPar: items.filter(i => i.clean_stock < i.par_level * 0.5).length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-gray-600">Loading linen...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Linen Management</h1>
          <p className="text-gray-600 mt-1">Track clean, soiled, and in-laundry items</p>
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
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Total Items</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalItems}</p>
            </div>
            <Package className="w-6 h-6 text-gray-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Clean</p>
              <p className="text-xl font-bold text-green-600">{stats.totalClean}</p>
            </div>
            <Sparkles className="w-6 h-6 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Soiled</p>
              <p className="text-xl font-bold text-orange-600">{stats.totalSoiled}</p>
            </div>
            <Recycle className="w-6 h-6 text-orange-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">In Laundry</p>
              <p className="text-xl font-bold text-blue-600">{stats.totalLaundry}</p>
            </div>
            <Loader className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Damaged</p>
              <p className="text-xl font-bold text-red-600">{stats.totalDamaged}</p>
            </div>
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Below Par</p>
              <p className="text-xl font-bold text-yellow-600">{stats.belowPar}</p>
            </div>
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
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
              placeholder="Search linen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            {linenTypes.map(type => (
              <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
            ))}
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="below_par">Below Par Level</option>
            <option value="damaged">Has Damaged Items</option>
          </select>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type / Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clean</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Soiled</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">In Laundry</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Damaged</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Par Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => {
                const stockStatus = getStockStatus(item)
                const typeInfo = linenTypes.find(t => t.value === item.linen_type)
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.item_name_en}</div>
                        <div className="text-sm text-gray-500">{item.item_name_ar}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <span>{typeInfo?.icon}</span>
                        <div>
                          <div className="font-medium">{typeInfo?.label}</div>
                          <div className="text-gray-500 text-xs">{item.size} • {item.color}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-green-600">{item.clean_stock}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-orange-600">{item.soiled_stock}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-blue-600">{item.in_laundry}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-red-600">{item.damaged_stock}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-gray-900">{item.total_stock}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.par_level}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${stockStatus.color}`}>
                        {stockStatus.label}
                      </span>
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
                          <ArrowRight className="w-4 h-4" />
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
              <p className="text-gray-500">No linen items found</p>
            </div>
          )}
        </div>
      </div>
            </>
          )}

          {/* Assign Linen Tab */}
          {activeTab === 'assign' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800">Assign clean linen items to rooms or staff members</p>
              </div>

              <form onSubmit={handleAssignLinen} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Linen Item *</label>
                    <select
                      value={assignData.item_id}
                      onChange={(e) => setAssignData({ ...assignData, item_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Choose a linen item...</option>
                      {items.filter(i => i.clean_stock > 0).map(item => (
                        <option key={item.id} value={item.id}>
                          {item.item_name_en} (Clean: {item.clean_stock})
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
                      value={assignData.quantity}
                      onChange={(e) => setAssignData({ ...assignData, quantity: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    {assignData.item_id && (
                      <p className="text-sm text-gray-500 mt-1">
                        Available clean: {items.find(i => i.id === assignData.item_id)?.clean_stock || 0}
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
                    Assign Linen
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800">View all linen transactions and movements</p>
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
                {modalMode === 'add' ? 'Add New Linen Item' : 'Edit Linen Item'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Linen Type *</label>
                  <select
                    value={formData.linen_type}
                    onChange={(e) => setFormData({ ...formData, linen_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {linenTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                  <select
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {sizes.map(size => (
                      <option key={size.value} value={size.value}>{size.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Clean Stock</label>
                  <input
                    type="number"
                    value={formData.clean_stock}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0
                      const newTotal = val + formData.soiled_stock + formData.in_laundry + formData.damaged_stock
                      setFormData({ ...formData, clean_stock: val, total_stock: newTotal })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Soiled Stock</label>
                  <input
                    type="number"
                    value={formData.soiled_stock}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0
                      const newTotal = formData.clean_stock + val + formData.in_laundry + formData.damaged_stock
                      setFormData({ ...formData, soiled_stock: val, total_stock: newTotal })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">In Laundry</label>
                  <input
                    type="number"
                    value={formData.in_laundry}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0
                      const newTotal = formData.clean_stock + formData.soiled_stock + val + formData.damaged_stock
                      setFormData({ ...formData, in_laundry: val, total_stock: newTotal })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Damaged</label>
                  <input
                    type="number"
                    value={formData.damaged_stock}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0
                      const newTotal = formData.clean_stock + formData.soiled_stock + formData.in_laundry + val
                      setFormData({ ...formData, damaged_stock: val, total_stock: newTotal })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
                  <input
                    type="number"
                    value={formData.total_stock}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Par Level</label>
                  <input
                    type="number"
                    value={formData.par_level}
                    onChange={(e) => setFormData({ ...formData, par_level: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unit_cost}
                    onChange={(e) => setFormData({ ...formData, unit_cost: parseFloat(e.target.value) || 0 })}
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
              <h2 className="text-xl font-bold text-gray-900">Linen Details</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
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
                  <h3 className="text-sm font-medium text-gray-500">Type</h3>
                  <p className="mt-1 text-lg">{linenTypes.find(t => t.value === selectedItem.linen_type)?.label}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Size</h3>
                  <p className="mt-1 text-lg">{selectedItem.size}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Color</h3>
                  <p className="mt-1 text-lg">{selectedItem.color}</p>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-4 bg-gray-50 p-4 rounded-lg">
                <div className="text-center">
                  <h3 className="text-sm font-medium text-gray-500">Clean</h3>
                  <p className="mt-1 text-2xl font-bold text-green-600">{selectedItem.clean_stock}</p>
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-medium text-gray-500">Soiled</h3>
                  <p className="mt-1 text-2xl font-bold text-orange-600">{selectedItem.soiled_stock}</p>
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-medium text-gray-500">In Laundry</h3>
                  <p className="mt-1 text-2xl font-bold text-blue-600">{selectedItem.in_laundry}</p>
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-medium text-gray-500">Damaged</h3>
                  <p className="mt-1 text-2xl font-bold text-red-600">{selectedItem.damaged_stock}</p>
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-medium text-gray-500">Total</h3>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{selectedItem.total_stock}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Par Level</h3>
                  <p className="mt-1 text-lg font-semibold">{selectedItem.par_level}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Unit Cost</h3>
                  <p className="mt-1 text-lg font-semibold">${selectedItem.unit_cost.toFixed(2)}</p>
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
                            <p className="font-semibold">{trans.quantity} items</p>
                            {trans.room && <p className="text-sm text-gray-500">Room {trans.room.room_number}</p>}
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
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="text-center p-2 bg-green-50 rounded">
                    <p className="text-green-600 font-semibold">{selectedItem.clean_stock}</p>
                    <p className="text-gray-600">Clean</p>
                  </div>
                  <div className="text-center p-2 bg-orange-50 rounded">
                    <p className="text-orange-600 font-semibold">{selectedItem.soiled_stock}</p>
                    <p className="text-gray-600">Soiled</p>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <p className="text-blue-600 font-semibold">{selectedItem.in_laundry}</p>
                    <p className="text-gray-600">Laundry</p>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded">
                    <p className="text-red-600 font-semibold">{selectedItem.damaged_stock}</p>
                    <p className="text-gray-600">Damaged</p>
                  </div>
                </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  value={transactionData.quantity}
                  onChange={(e) => setTransactionData({ ...transactionData, quantity: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  min="1"
                />
              </div>

              {transactionData.transaction_type === 'mark_damaged' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Damage Reason</label>
                  <input
                    type="text"
                    value={transactionData.damage_reason}
                    onChange={(e) => setTransactionData({ ...transactionData, damage_reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="E.g., Torn, Stained, etc."
                  />
                </div>
              )}

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
