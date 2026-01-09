import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { FileText, Plus, Eye, CheckCircle, XCircle, Package, Calendar, X } from 'lucide-react'
import { translations } from '../translations'

export default function Procurement({ user, lang = 'en' }) {
  const t = translations[lang]
  const [activeTab, setActiveTab] = useState('invoices') // invoices or grn
  const [invoices, setInvoices] = useState([])
  const [grns, setGrns] = useState([])
  const [vendors, setVendors] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddPIModal, setShowAddPIModal] = useState(false)
  const [showCreateGRNModal, setShowCreateGRNModal] = useState(false)
  const [viewInvoice, setViewInvoice] = useState(null)
  const [viewGRN, setViewGRN] = useState(null)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [piFormData, setPIFormData] = useState({
    vendor_id: '',
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    notes: '',
    items: []
  })

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load vendors
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('org_id', user.org_id)
        .eq('is_active', true)
        .order('name')
      
      if (vendorError) throw vendorError
      setVendors(vendorData || [])

      // Load inventory items
      const { data: itemData, error: itemError } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('org_id', user.org_id)
        .order('item_name_en')
      
      if (itemError) throw itemError
      setItems(itemData || [])

      // Load purchase invoices
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('purchase_invoices')
        .select(`
          *,
          vendor:vendors(name),
          purchase_invoice_items(*, item:inventory_items(item_name_en))
        `)
        .eq('org_id', user.org_id)
        .order('created_at', { ascending: false })
      
      if (invoiceError) throw invoiceError
      setInvoices(invoiceData || [])

      // Load GRNs
      const { data: grnData, error: grnError } = await supabase
        .from('goods_received_notes')
        .select(`
          *,
          invoice:purchase_invoices(invoice_number, vendor:vendors(name)),
          received_by_user:users(full_name),
          grn_items(*, item:inventory_items(item_name_en))
        `)
        .eq('org_id', user.org_id)
        .order('created_at', { ascending: false })
      
      if (grnError) throw grnError
      setGrns(grnData || [])

    } catch (error) {
      console.error('Error loading data:', error)
      alert('Failed to load data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPIItem = () => {
    setPIFormData({
      ...piFormData,
      items: [
        ...piFormData.items,
        { item_id: '', quantity: 1, unit_price: 0, tax_rate: 0 }
      ]
    })
  }

  const handleRemovePIItem = (index) => {
    setPIFormData({
      ...piFormData,
      items: piFormData.items.filter((_, i) => i !== index)
    })
  }

  const handleUpdatePIItem = (index, field, value) => {
    const newItems = [...piFormData.items]
    newItems[index][field] = value
    setPIFormData({ ...piFormData, items: newItems })
  }

  const calculatePITotals = () => {
    let subtotal = 0
    let totalTax = 0
    
    piFormData.items.forEach(item => {
      const itemTotal = item.quantity * item.unit_price
      const itemTax = itemTotal * (item.tax_rate / 100)
      subtotal += itemTotal
      totalTax += itemTax
    })
    
    return {
      subtotal,
      totalTax,
      grandTotal: subtotal + totalTax
    }
  }

  const handleSubmitPI = async (e) => {
    e.preventDefault()
    
    if (!piFormData.vendor_id || piFormData.items.length === 0) {
      alert('Please select a vendor and add at least one item')
      return
    }

    try {
      const totals = calculatePITotals()
      
      // Insert purchase invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('purchase_invoices')
        .insert([{
          org_id: user.org_id,
          vendor_id: piFormData.vendor_id,
          invoice_number: piFormData.invoice_number,
          invoice_date: piFormData.invoice_date,
          due_date: piFormData.due_date || null,
          total_amount: totals.subtotal,
          tax_amount: totals.totalTax,
          grand_total: totals.grandTotal,
          status: 'submitted',
          notes: piFormData.notes,
          created_by: user.id
        }])
        .select()
        .single()

      if (invoiceError) throw invoiceError

      // Insert invoice items
      const itemsToInsert = piFormData.items.map(item => ({
        invoice_id: invoice.id,
        item_id: item.item_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        tax_amount: (item.quantity * item.unit_price * item.tax_rate) / 100,
        total_amount: item.quantity * item.unit_price + ((item.quantity * item.unit_price * item.tax_rate) / 100)
      }))

      const { error: itemsError } = await supabase
        .from('purchase_invoice_items')
        .insert(itemsToInsert)

      if (itemsError) throw itemsError

      setShowAddPIModal(false)
      setPIFormData({
        vendor_id: '',
        invoice_number: '',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: '',
        notes: '',
        items: []
      })
      loadData()
      alert('Purchase Invoice created successfully!')
    } catch (error) {
      console.error('Error creating PI:', error)
      alert('Failed to create Purchase Invoice: ' + error.message)
    }
  }

  const handleCreateGRN = async (invoice) => {
    setSelectedInvoice(invoice)
    setShowCreateGRNModal(true)
  }

  const handleSubmitGRN = async (e) => {
    e.preventDefault()
    
    try {
      // Create GRN
      const { data: grn, error: grnError } = await supabase
        .from('goods_received_notes')
        .insert([{
          org_id: user.org_id,
          invoice_id: selectedInvoice.id,
          grn_number: '', // Auto-generated by trigger
          received_date: new Date().toISOString().split('T')[0],
          received_by: user.id,
          status: 'accepted',
          quality_check_status: 'passed'
        }])
        .select()
        .single()

      if (grnError) throw grnError

      // Create GRN items (auto-accept all)
      const grnItemsToInsert = selectedInvoice.purchase_invoice_items.map(item => ({
        grn_id: grn.id,
        invoice_item_id: item.id,
        item_id: item.item_id,
        ordered_quantity: item.quantity,
        received_quantity: item.quantity,
        accepted_quantity: item.quantity,
        rejected_quantity: 0,
        unit_price: item.unit_price
      }))

      const { error: itemsError } = await supabase
        .from('grn_items')
        .insert(grnItemsToInsert)

      if (itemsError) throw itemsError

      setShowCreateGRNModal(false)
      setSelectedInvoice(null)
      loadData()
      alert('GRN created successfully! Inventory updated.')
    } catch (error) {
      console.error('Error creating GRN:', error)
      alert('Failed to create GRN: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Procurement</h1>
              <p className="text-sm text-gray-600">Purchase Invoices & Goods Receipt</p>
            </div>
          </div>
          {activeTab === 'invoices' && (
            <button
              onClick={() => setShowAddPIModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Purchase Invoice
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'invoices'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Purchase Invoices ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab('grn')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'grn'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Goods Receipt Notes ({grns.length})
        </button>
      </div>

      {/* Purchase Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.invoice_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {invoice.vendor?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(invoice.invoice_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      ${invoice.grand_total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        invoice.status === 'received' ? 'bg-green-100 text-green-700' :
                        invoice.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                        invoice.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setViewInvoice(invoice)}
                          className="inline-flex items-center gap-1 text-gray-700 hover:text-gray-900 font-medium"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        {invoice.status === 'submitted' && (
                          <button
                            onClick={() => handleCreateGRN(invoice)}
                            className="text-green-600 hover:text-green-800 font-medium"
                          >
                            Create GRN
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {invoices.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No purchase invoices found</p>
            </div>
          )}
        </div>
      )}

      {/* GRN Tab */}
      {activeTab === 'grn' && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">GRN #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Received Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Received By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {grns.map((grn) => (
                  <tr key={grn.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {grn.grn_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {grn.invoice?.invoice_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {grn.invoice?.vendor?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(grn.received_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {grn.received_by_user?.full_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        grn.status === 'accepted' ? 'bg-green-100 text-green-700' :
                        grn.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        grn.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {grn.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setViewGRN(grn)}
                        className="inline-flex items-center gap-1 text-gray-700 hover:text-gray-900 font-medium"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {grns.length === 0 && (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No goods receipt notes found</p>
            </div>
          )}
        </div>
      )}

      {/* Add PI Modal */}
      {showAddPIModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-8">
            <div className="bg-green-600 text-white p-6 rounded-t-xl">
              <h2 className="text-xl font-bold">New Purchase Invoice</h2>
            </div>
            <form onSubmit={handleSubmitPI} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vendor *</label>
                  <select
                    value={piFormData.vendor_id}
                    onChange={(e) => setPIFormData({ ...piFormData, vendor_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Select Vendor</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Number *</label>
                  <input
                    type="text"
                    value={piFormData.invoice_number}
                    onChange={(e) => setPIFormData({ ...piFormData, invoice_number: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Date *</label>
                  <input
                    type="date"
                    value={piFormData.invoice_date}
                    onChange={(e) => setPIFormData({ ...piFormData, invoice_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                  <input
                    type="date"
                    value={piFormData.due_date}
                    onChange={(e) => setPIFormData({ ...piFormData, due_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">Items *</label>
                  <button
                    type="button"
                    onClick={handleAddPIItem}
                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    + Add Item
                  </button>
                </div>

                {/* Column headers */}
                <div className="grid grid-cols-6 gap-2 mb-2 text-xs font-semibold text-gray-600">
                  <div className="col-span-2">Item</div>
                  <div>Qty</div>
                  <div>Price</div>
                  <div>Total</div>
                  <div></div>
                </div>
                
                {piFormData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-6 gap-2 mb-2">
                    <select
                      value={item.item_id}
                      onChange={(e) => handleUpdatePIItem(index, 'item_id', e.target.value)}
                      className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      required
                    >
                      <option value="">Select Item</option>
                      {items.map(i => (
                        <option key={i.id} value={i.id}>{i.item_name_en}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleUpdatePIItem(index, 'quantity', parseInt(e.target.value))}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      min="1"
                      required
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => handleUpdatePIItem(index, 'unit_price', parseFloat(e.target.value))}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      min="0"
                      required
                    />
                    <div className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-900 flex items-center">
                      ${(((Number(item.quantity) || 0) * (Number(item.unit_price) || 0))).toFixed(2)}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePIItem(index)}
                      className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              {piFormData.items.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">${calculatePITotals().subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Tax:</span>
                    <span className="font-medium">${calculatePITotals().totalTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
                    <span>Grand Total:</span>
                    <span>${calculatePITotals().grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddPIModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Create Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create GRN Modal */}
      {showCreateGRNModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="bg-green-600 text-white p-6 rounded-t-xl">
              <h2 className="text-xl font-bold">Create Goods Receipt Note</h2>
            </div>
            <form onSubmit={handleSubmitGRN} className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Invoice:</span>
                  <span className="font-medium">{selectedInvoice.invoice_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Vendor:</span>
                  <span className="font-medium">{selectedInvoice.vendor?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Items:</span>
                  <span className="font-medium">{selectedInvoice.purchase_invoice_items.length}</span>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                This will create a GRN and accept all items from the invoice, automatically updating inventory stock levels.
              </p>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateGRNModal(false)
                    setSelectedInvoice(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Create GRN & Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Purchase Invoice Modal */}
      {viewInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-8">
            <div className="bg-green-600 text-white p-6 rounded-t-xl flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Purchase Invoice</h2>
                <p className="text-sm text-green-100 mt-1">{viewInvoice.invoice_number}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewInvoice(null)}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Vendor</div>
                  <div className="font-semibold text-gray-900">{viewInvoice.vendor?.name || '—'}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Invoice Date</div>
                  <div className="font-semibold text-gray-900">{new Date(viewInvoice.invoice_date).toLocaleDateString()}</div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 font-semibold text-gray-800">Items</div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(viewInvoice.purchase_invoice_items || []).map((it) => (
                        <tr key={it.id}>
                          <td className="px-4 py-3 text-sm text-gray-900">{it.item?.item_name_en || 'Item'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 text-right">{it.quantity}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 text-right">${Number(it.unit_price).toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">${Number(it.total_amount).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">${Number(viewInvoice.total_amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-medium">${Number(viewInvoice.tax_amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
                  <span>Grand Total:</span>
                  <span>${Number(viewInvoice.grand_total || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewInvoice(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View GRN Modal */}
      {viewGRN && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-8">
            <div className="bg-green-600 text-white p-6 rounded-t-xl flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Goods Receipt Note</h2>
                <p className="text-sm text-green-100 mt-1">{viewGRN.grn_number}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewGRN(null)}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Invoice</div>
                  <div className="font-semibold text-gray-900">{viewGRN.invoice?.invoice_number || '—'}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Vendor</div>
                  <div className="font-semibold text-gray-900">{viewGRN.invoice?.vendor?.name || '—'}</div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 font-semibold text-gray-800">Items</div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(viewGRN.grn_items || []).map((it) => (
                        <tr key={it.id}>
                          <td className="px-4 py-3 text-sm text-gray-900">{it.item?.item_name_en || 'Item'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 text-right">{it.received_quantity}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 text-right">${Number(it.unit_price).toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">${(((Number(it.received_quantity) || 0) * (Number(it.unit_price) || 0))).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewGRN(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
