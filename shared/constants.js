export const RoomStatus = {
  VACANT: 'vacant',
  OCCUPIED: 'occupied',
  CLEANING: 'cleaning',
  MAINTENANCE: 'maintenance',
  OUT_OF_ORDER: 'out_of_order',
}

export const TaskStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  INSPECTED: 'inspected',
  FAILED: 'failed',
}

export const TaskType = {
  REGULAR: 'regular',
  CHECKOUT: 'checkout',
  DEEP_CLEAN: 'deep_clean',
  INSPECTION: 'inspection',
  TURNDOWN: 'turndown',
}

export const Priority = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
}

export const UserRole = {
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
  STAFF: 'staff',
  LAUNDRY: 'laundry',
  MAINTENANCE: 'maintenance',
}

export const RequestType = {
  GUEST_REQUEST: 'guest_request',
  BREAKDOWN: 'breakdown',
  MAINTENANCE: 'maintenance',
  HOUSEKEEPING: 'housekeeping',
}

export const ServiceRequestStatus = {
  OPEN: 'open',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
}

export const InventoryTransactionType = {
  RECEIPT: 'receipt',
  ISSUE: 'issue',
  RETURN: 'return',
  ADJUSTMENT: 'adjustment',
  DISCARD: 'discard',
  TRANSFER: 'transfer',
}

export const LinenTransactionType = {
  ISSUE_CLEAN: 'issue_clean',
  RETURN_SOILED: 'return_soiled',
  SEND_LAUNDRY: 'send_laundry',
  RECEIVE_LAUNDRY: 'receive_laundry',
  MARK_DAMAGED: 'mark_damaged',
  DISCARD: 'discard',
  PURCHASE: 'purchase',
  ADJUSTMENT: 'adjustment',
}
