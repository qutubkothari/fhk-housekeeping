import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Search, Shirt, Package, TrendingUp, TrendingDown, RefreshCw, Plus, X, ArrowRight, Recycle, Loader, CheckCircle, AlertTriangle, Clock, Edit2, Trash2 } from 'lucide-react'
import Select from 'react-select'
import { translations } from '../translations'

export default function Linen({ user, lang = 'en' }) {
  const t = (key) => translations[key]?.[lang] || key

  const [linens, setLinens] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [activeTab, setActiveTab] = useState('items')
  const [rooms, setRooms] = useState([])
  const [transactions, setTransactions] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [selectedLinen, setSelectedLinen] = useState(null)
  const [linenData, setLinenData] = useState({
    item_name_en: '',
    item_name_ar: '',
    linen_type: 'bedding',
    size: 'standard',
    clean_stock: 0,
    soiled_stock: 0,
    in_laundry: 0,
    total_stock: 0,
    par_level: 0,
    notes: ''
  })
  const [transactionData, setTransactionData] = useState({
    linen_id: '',
    transaction_type: 'issue_clean',
    quantity: 0,
    room_id: '',
    notes: ''
  })

  useEffect(() => {
    console.log('🟣 Linen v3.0 - WITH TRANSACTIONS')
    if (user?.org_id) {
      loadData()
      const interval = setInterval(() => loadData(true), 30000)
      return () => clearInterval(interval)
    }
  }, [user?.org_id])

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      // Load linens
      const { data: linenData, error: linenError } = await supabase
        .from('linen_items')
        .select('*')
        .eq('org_id', user.org_id)
        .eq('is_active', true)
        .order('item_name_en')

      if (linenError) throw linenError
      setLinens(linenData || [])

      // Load rooms
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('org_id', user.org_id)
        .order('room_number')

      if (roomError) throw roomError
      setRooms(roomData || [])

      // Load transactions
      const { data: transData, error: transError } = await supabase
        .from('linen_transactions')
        .select('*, linen_items(item_name_en), rooms(room_number)')
        .eq('org_id', user.org_id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (transError) throw transError
      setTransactions(transData || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddLinen = async (e) => {
    e.preventDefault()
    
    try {
      const total = parseInt(linenData.clean_stock) + parseInt(linenData.soiled_stock) + parseInt(linenData.in_laundry)
      
      const { error } = await supabase
        .from('linen_items')
        .insert([{
          org_id: user.org_id,
          item_name_en: linenData.item_name_en,
          item_name_ar: linenData.item_name_ar,
          linen_type: linenData.linen_type,
          size: linenData.size,
          clean_stock: parseInt(linenData.clean_stock),
          soiled_stock: parseInt(linenData.soiled_stock),
          in_laundry: parseInt(linenData.in_laundry),
          total_stock: total,
          par_level: parseInt(linenData.par_level),
          notes: linenData.notes,
          is_active: true
        }])

      if (error) throw error

      setLinenData({
        item_name_en: '',
        item_name_ar: '',
        linen_type: 'bedding',
        size: 'standard',
        clean_stock: 0,
        soiled_stock: 0,
        in_laundry: 0,
        total_stock: 0,
        par_level: 0,
        notes: ''
      })
      
      setShowAddModal(false)
      loadData()
      alert('Linen item added successfully')
    } catch (error) {
      console.error('Error adding linen:', error)
      alert('Failed to add linen: ' + error.message)
    }
  }

  const handleEdit = (item) => {
    setSelectedLinen(item)
    setLinenData({
      item_name_en: item.item_name_en,
      item_name_ar: item.item_name_ar,
      linen_type: item.linen_type,
      size: item.size,
      clean_stock: item.clean_stock,
      soiled_stock: item.soiled_stock,
      in_laundry: item.in_laundry,
      total_stock: item.total_stock,
      par_level: item.par_level,
      notes: item.notes || ''
    })
    setShowEditModal(true)
  }

  const handleUpdateLinen = async (e) => {
    e.preventDefault()
    
    try {
      const total = parseInt(linenData.clean_stock) + parseInt(linenData.soiled_stock) + parseInt(linenData.in_laundry)
      
      const { error } = await supabase
        .from('linen_items')
        .update({
          item_name_en: linenData.item_name_en,
          item_name_ar: linenData.item_name_ar,
          linen_type: linenData.linen_type,
          size: linenData.size,
          clean_stock: parseInt(linenData.clean_stock),
          soiled_stock: parseInt(linenData.soiled_stock),
          in_laundry: parseInt(linenData.in_laundry),
          total_stock: total,
          par_level: parseInt(linenData.par_level) || 0,
          notes: linenData.notes
        })
        .eq('id', selectedLinen.id)

      if (error) throw error

      setShowEditModal(false)
      setSelectedLinen(null)
      setLinenData({
        item_name_en: '',
        item_name_ar: '',
        linen_type: 'bedding',
        size: 'standard',
        clean_stock: 0,
        soiled_stock: 0,
        in_laundry: 0,
        total_stock: 0,
        par_level: 0,
        notes: ''
      })
      loadData()
      alert('Linen item updated successfully')
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to update linen item')
    }
  }

  const handleDelete = async (item) => {
    if (!confirm(`Delete ${item.item_name_en}? This action cannot be undone.`)) return

    try {
      const { error} = await supabase
        .from('linen_items')
        .delete()
        .eq('id', item.id)

      if (error) throw error
      loadData()
      alert('Linen item deleted successfully')
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to delete linen item')
    }
  }

  const handleTransaction = async (e) => {
    e.preventDefault()
    
    try {
      const item = linens.find(l => l.id === transactionData.linen_item_id)
      if (!item) throw new Error('Linen item not found')

      const quantity = parseInt(transactionData.quantity)
      let newClean = item.clean_stock || 0
      let newSoiled = item.soiled_stock || 0
      let newLaundry = item.in_laundry || 0

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
          // Mark as damaged by reducing total stock
          if (newClean >= quantity) {
            newClean -= quantity
          } else if (newSoiled >= quantity) {
            newSoiled -= quantity
          } else {
            alert('Not enough stock to mark as damaged')
            return
          }
          break
        case 'purchase':
          newClean += quantity
          break
      }

      const newTotal = newClean + newSoiled + newLaundry

      // Insert transaction
      const { error: transError } = await supabase
        .from('linen_transactions')
        .insert([{
          org_id: user.org_id,
          linen_id: item.id,
          transaction_type: transactionData.transaction_type,
          quantity: quantity,
          room_id: transactionData.room_id || null,
          notes: transactionData.notes,
          created_by: user.id
        }])

      if (transError) throw transError

      // Update item stock
      const { error: updateError } = await supabase
        .from('linen_items')
        .update({
          clean_stock: newClean,
          soiled_stock: newSoiled,
          in_laundry: newLaundry,
          total_stock: newTotal
        })
        .eq('id', item.id)

      if (updateError) throw updateError

      setTransactionData({
        linen_id: '',
        transaction_type: 'issue_clean',
        quantity: 0,
        room_id: '',
        notes: ''
      })
      
      setShowTransactionModal(false)
      loadData()
      alert('Transaction completed successfully')
    } catch (error) {
      console.error('Error processing transaction:', error)
      alert('Failed to process transaction: ' + error.message)
    }
  }

  const transactionTypes = [
    { value: 'issue_clean', label: 'Issue Clean', icon: ArrowRight, color: 'text-green-600', needsRoom: true },
    { value: 'return_soiled', label: 'Return Soiled', icon: Recycle, color: 'text-orange-600', needsRoom: true },
    { value: 'send_laundry', label: 'Send to Laundry', icon: Loader, color: 'text-blue-600', needsRoom: false },
    { value: 'receive_laundry', label: 'Receive from Laundry', icon: CheckCircle, color: 'text-green-600', needsRoom: false },
    { value: 'mark_damaged', label: 'Mark Damaged', icon: AlertTriangle, color: 'text-red-600', needsRoom: false },
    { value: 'purchase', label: 'Purchase', icon: TrendingUp, color: 'text-purple-600', needsRoom: false }
  ]

  const filteredLinens = linens.filter(item => {
    const matchesSearch = item.item_name_en?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const stats = {
    clean: linens.reduce((sum, l) => sum + (l.clean_stock || 0), 0),
    soiled: linens.reduce((sum, l) => sum + (l.soiled_stock || 0), 0),
    in_laundry: linens.reduce((sum, l) => sum + (l.in_laundry || 0), 0),
    total_items: linens.length,
  }

  const getStatusBadge = (clean, soiled, inLaundry) => {
    if (clean > soiled + inLaundry) return 'bg-green-100 text-green-700 border-green-200'
    if (soiled > clean) return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    return 'bg-blue-100 text-blue-700 border-blue-200'
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div></div>
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Linen Management</h1>
        {(user.role === 'admin' || user.role === 'super_admin' || user.role === 'laundry') && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white px-4 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Linen Item
          </button>
        )}
      </div>

      {/* Tabs */}
      {(user.role === 'admin' || user.role === 'super_admin' || user.role === 'laundry') && (
        <div className="bg-white rounded-xl shadow-lg p-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('items')}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === 'items'
                  ? 'bg-gradient-to-r from-pink-600 to-pink-700 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Items
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === 'transactions'
                  ? 'bg-gradient-to-r from-pink-600 to-pink-700 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-pink-600 to-pink-700 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              History
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
          { label: t('cleanItems'), value: stats.clean, color: 'from-green-500 to-green-600', icon: Shirt },
          { label: t('soiledItems'), value: stats.soiled, color: 'from-yellow-500 to-yellow-600', icon: TrendingDown },
          { label: t('inLaundry'), value: stats.in_laundry, color: 'from-blue-500 to-blue-600', icon: RefreshCw },
          { label: t('totalTypes'), value: stats.total_items, color: 'from-purple-500 to-purple-600', icon: Package },
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

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search linen items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => fetchLinens()}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Linen Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLinens.map(item => (
          <div key={item.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-6 border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg">
                  <Shirt className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{item.item_name_en}</h3>
                  <p className="text-sm text-gray-500">{item.linen_type} • {item.size}</p>
                  <p className="text-sm text-gray-500">Total: {item.total_stock || 0}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                <span className="text-sm font-medium text-green-800">Clean</span>
                <span className="text-xl font-bold text-green-700">{item.clean_stock || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                <span className="text-sm font-medium text-yellow-800">Soiled</span>
                <span className="text-xl font-bold text-yellow-700">{item.soiled_stock || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <span className="text-sm font-medium text-blue-800">In Laundry</span>
                <span className="text-xl font-bold text-blue-700">{item.in_laundry || 0}</span>
              </div>
            </div>

            {item.notes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">{item.notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredLinens.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <Shirt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No linen items found</p>
        </div>
      )}
        </>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <button
              onClick={() => setShowTransactionModal(true)}
              className="w-full bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white px-6 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Transaction
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {transactionTypes.map((type) => {
              const Icon = type.icon
              return (
                <div
                  key={type.value}
                  onClick={() => {
                    setTransactionData({ ...transactionData, transaction_type: type.value })
                    setShowTransactionModal(true)
                  }}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-pink-300"
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="p-4 bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl">
                      <Icon className={`w-8 h-8 ${type.color}`} />
                    </div>
                    <p className="font-semibold text-gray-900">{type.label}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {transactions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-lg">
              <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No transactions yet</p>
            </div>
          ) : (
            transactions.map((trans) => {
              const transType = transactionTypes.find(t => t.value === trans.transaction_type)
              const Icon = transType?.icon || Package
              return (
                <div key={trans.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-3 bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl`}>
                        <Icon className={`w-6 h-6 ${transType?.color || 'text-gray-600'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900">{transType?.label}</h3>
                          <span className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded-full font-semibold">
                            {trans.quantity} items
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{trans.linen_items?.item_name_en}</p>
                        {trans.room_id && trans.rooms && (
                          <p className="text-sm text-gray-500">Room: {trans.rooms.room_number}</p>
                        )}
                        {trans.notes && (
                          <p className="text-sm text-gray-500 mt-1">{trans.notes}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(trans.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Add Linen Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-pink-600 to-pink-700 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Plus className="w-6 h-6 text-white" />
                <h2 className="text-xl font-bold text-white">Add Linen Item</h2>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddLinen} className="p-6 space-y-6">
              <div className="bg-pink-50 border border-pink-200 rounded-xl p-4">
                <p className="text-pink-800 text-sm">Add new linen items to your inventory</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Item Name (English) *</label>
                  <input
                    type="text"
                    value={linenData.item_name_en}
                    onChange={(e) => setLinenData({ ...linenData, item_name_en: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    placeholder="e.g., Queen Bed Sheet"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Item Name (Arabic)</label>
                  <input
                    type="text"
                    value={linenData.item_name_ar}
                    onChange={(e) => setLinenData({ ...linenData, item_name_ar: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    placeholder="اسم العنصر"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Linen Type *</label>
                  <Select
                    value={{ value: linenData.linen_type, label: linenData.linen_type.charAt(0).toUpperCase() + linenData.linen_type.slice(1) }}
                    onChange={(option) => setLinenData({ ...linenData, linen_type: option?.value || 'bedding' })}
                    options={[
                      { value: 'bedding', label: 'Bedding' },
                      { value: 'towels', label: 'Towels' },
                      { value: 'bathrobes', label: 'Bathrobes' },
                      { value: 'tablecloths', label: 'Tablecloths' },
                      { value: 'other', label: 'Other' }
                    ]}
                    placeholder="Select linen type"
                    isSearchable
                    className="react-select-container"
                    classNamePrefix="react-select"
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: '42px',
                        borderRadius: '0.5rem',
                        borderWidth: '2px',
                        borderColor: '#e5e7eb',
                        '&:hover': { borderColor: '#ec4899' },
                        '&:focus': { borderColor: '#ec4899', boxShadow: '0 0 0 1px #ec4899' }
                      })
                    }}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Size *</label>
                  <Select
                    value={{ value: linenData.size, label: linenData.size.charAt(0).toUpperCase() + linenData.size.slice(1) }}
                    onChange={(option) => setLinenData({ ...linenData, size: option?.value || 'standard' })}
                    options={[
                      { value: 'small', label: 'Small' },
                      { value: 'standard', label: 'Standard' },
                      { value: 'large', label: 'Large' },
                      { value: 'king', label: 'King' },
                      { value: 'queen', label: 'Queen' }
                    ]}
                    placeholder="Select size"
                    isSearchable
                    className="react-select-container"
                    classNamePrefix="react-select"
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: '42px',
                        borderRadius: '0.5rem',
                        borderWidth: '2px',
                        borderColor: '#e5e7eb',
                        '&:hover': { borderColor: '#ec4899' },
                        '&:focus': { borderColor: '#ec4899', boxShadow: '0 0 0 1px #ec4899' }
                      })
                    }}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Clean Stock *</label>
                  <input
                    type="number"
                    min="0"
                    value={linenData.clean_stock}
                    onChange={(e) => setLinenData({ ...linenData, clean_stock: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Soiled Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={linenData.soiled_stock}
                    onChange={(e) => setLinenData({ ...linenData, soiled_stock: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">In Laundry</label>
                  <input
                    type="number"
                    min="0"
                    value={linenData.in_laundry}
                    onChange={(e) => setLinenData({ ...linenData, in_laundry: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Par Level *</label>
                  <input
                    type="number"
                    min="0"
                    value={linenData.par_level}
                    onChange={(e) => setLinenData({ ...linenData, par_level: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                <textarea
                  value={linenData.notes}
                  onChange={(e) => setLinenData({ ...linenData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  rows="3"
                  placeholder="Optional notes..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Linen Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Edit2 className="w-6 h-6 text-white" />
                <h2 className="text-xl font-bold text-white">Edit Linen Item</h2>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedLinen(null)
                }}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateLinen} className="p-6 space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-blue-800 text-sm">Update linen item details</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Item Name (English) *</label>
                  <input
                    type="text"
                    value={linenData.item_name_en}
                    onChange={(e) => setLinenData({ ...linenData, item_name_en: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Item Name (Arabic)</label>
                  <input
                    type="text"
                    value={linenData.item_name_ar}
                    onChange={(e) => setLinenData({ ...linenData, item_name_ar: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Linen Type *</label>
                  <select
                    value={linenData.linen_type}
                    onChange={(e) => setLinenData({ ...linenData, linen_type: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="bedding">Bedding</option>
                    <option value="towels">Towels</option>
                    <option value="bathrobes">Bathrobes</option>
                    <option value="tablecloths">Tablecloths</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Size *</label>
                  <select
                    value={linenData.size}
                    onChange={(e) => setLinenData({ ...linenData, size: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="small">Small</option>
                    <option value="standard">Standard</option>
                    <option value="large">Large</option>
                    <option value="king">King</option>
                    <option value="queen">Queen</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Clean Stock *</label>
                  <input
                    type="number"
                    min="0"
                    value={linenData.clean_stock}
                    onChange={(e) => setLinenData({ ...linenData, clean_stock: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Soiled Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={linenData.soiled_stock}
                    onChange={(e) => setLinenData({ ...linenData, soiled_stock: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">In Laundry</label>
                  <input
                    type="number"
                    min="0"
                    value={linenData.in_laundry}
                    onChange={(e) => setLinenData({ ...linenData, in_laundry: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Par Level *</label>
                  <input
                    type="number"
                    min="0"
                    value={linenData.par_level}
                    onChange={(e) => setLinenData({ ...linenData, par_level: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                <textarea
                  value={linenData.notes}
                  onChange={(e) => setLinenData({ ...linenData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedLinen(null)
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-5 h-5" />
                  Update Linen Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-pink-600 to-pink-700 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Process Transaction</h2>
                <button
                  onClick={() => {
                    setShowTransactionModal(false)
                    setTransactionData({
                      linen_item_id: '',
                      transaction_type: '',
                      quantity: '',
                      room_id: '',
                      notes: ''
                    })
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleTransaction} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Transaction Type *</label>
                <Select
                  value={transactionTypes.find(t => t.value === transactionData.transaction_type)}
                  onChange={(option) => setTransactionData({ ...transactionData, transaction_type: option?.value || '' })}
                  options={transactionTypes.map(type => ({ value: type.value, label: type.label }))}
                  placeholder="Select transaction type"
                  isClearable
                  isSearchable
                  className="react-select-container"
                  classNamePrefix="react-select"
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: '42px',
                      borderRadius: '0.5rem',
                      borderWidth: '2px',
                      borderColor: '#e5e7eb',
                      '&:hover': { borderColor: '#ec4899' },
                      '&:focus': { borderColor: '#ec4899', boxShadow: '0 0 0 1px #ec4899' }
                    })
                  }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Linen Item *</label>
                <Select
                  value={linens.find(l => l.id === transactionData.linen_item_id) ? {
                    value: transactionData.linen_item_id,
                    label: `${linens.find(l => l.id === transactionData.linen_item_id).item_name_en} - Clean: ${linens.find(l => l.id === transactionData.linen_item_id).clean_stock}, Soiled: ${linens.find(l => l.id === transactionData.linen_item_id).soiled_stock}, In Laundry: ${linens.find(l => l.id === transactionData.linen_item_id).in_laundry}`
                  } : null}
                  onChange={(option) => setTransactionData({ ...transactionData, linen_item_id: option?.value || '' })}
                  options={linens.map(linen => ({
                    value: linen.id,
                    label: `${linen.item_name_en} - Clean: ${linen.clean_stock}, Soiled: ${linen.soiled_stock}, In Laundry: ${linen.in_laundry}`
                  }))}
                  placeholder="Select linen item"
                  isClearable
                  isSearchable
                  className="react-select-container"
                  classNamePrefix="react-select"
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: '42px',
                      borderRadius: '0.5rem',
                      borderWidth: '2px',
                      borderColor: '#e5e7eb',
                      '&:hover': { borderColor: '#ec4899' },
                      '&:focus': { borderColor: '#ec4899', boxShadow: '0 0 0 1px #ec4899' }
                    })
                  }}
                  required
                />
              </div>

              {transactionTypes.find(t => t.value === transactionData.transaction_type)?.needsRoom && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Room *</label>
                  <Select
                    value={rooms.find(r => r.id === transactionData.room_id) ? {
                      value: transactionData.room_id,
                      label: `${rooms.find(r => r.id === transactionData.room_id).room_number} - ${rooms.find(r => r.id === transactionData.room_id).room_type}`
                    } : null}
                    onChange={(option) => setTransactionData({ ...transactionData, room_id: option?.value || '' })}
                    options={rooms.map(room => ({
                      value: room.id,
                      label: `${room.room_number} - ${room.room_type}`
                    }))}
                    placeholder="Select room"
                    isClearable
                    isSearchable
                    className="react-select-container"
                    classNamePrefix="react-select"
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: '42px',
                        borderRadius: '0.5rem',
                        borderWidth: '2px',
                        borderColor: '#e5e7eb',
                        '&:hover': { borderColor: '#ec4899' },
                        '&:focus': { borderColor: '#ec4899', boxShadow: '0 0 0 1px #ec4899' }
                      })
                    }}
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity *</label>
                <input
                  type="number"
                  min="1"
                  value={transactionData.quantity}
                  onChange={(e) => setTransactionData({ ...transactionData, quantity: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                <textarea
                  value={transactionData.notes}
                  onChange={(e) => setTransactionData({ ...transactionData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 resize-none"
                  rows="3"
                  placeholder="Optional notes about this transaction..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowTransactionModal(false)
                    setTransactionData({
                      linen_item_id: '',
                      transaction_type: '',
                      quantity: '',
                      room_id: '',
                      notes: ''
                    })
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Process Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
