// Dummy data for M1 UI shell
// Replace with real API calls in M2

export const DUMMY_STAGES = [
  { id: 's1', name: 'New Lead', color: '#6B7280', count: 8 },
  { id: 's2', name: 'Contacted', color: '#3B82F6', count: 6 },
  { id: 's3', name: 'Qualified', color: '#8B5CF6', count: 5 },
  { id: 's4', name: 'Proposal', color: '#F59E0B', count: 4 },
  { id: 's5', name: 'Won', color: '#10B981', count: 3 },
]

export const DUMMY_LEADS = [
  { id: 'l1', title: 'Office supplies bulk order', contactName: 'Amit Mehta', phone: '+919876543210', stageId: 's1', assignedTo: 'Ravi K', tags: ['hot'], score: 80, createdAt: new Date(Date.now() - 2 * 86400000) },
  { id: 'l2', title: 'Monthly procurement contract', contactName: 'Sunita Patel', phone: '+919876543211', stageId: 's1', assignedTo: 'Priya S', tags: ['warm'], score: 60, createdAt: new Date(Date.now() - 1 * 86400000) },
  { id: 'l3', title: 'Export packaging materials', contactName: 'Vijay Reddy', phone: '+919876543212', stageId: 's2', assignedTo: 'Ravi K', tags: ['cold'], score: 30, createdAt: new Date(Date.now() - 5 * 86400000) },
  { id: 'l4', title: 'Annual supply agreement', contactName: 'Meera Nair', phone: '+919876543213', stageId: 's2', assignedTo: 'Priya S', tags: ['vip', 'hot'], score: 95, createdAt: new Date(Date.now() - 3 * 86400000) },
  { id: 'l5', title: 'Wholesale product inquiry', contactName: 'Karan Singh', phone: '+919876543214', stageId: 's3', assignedTo: 'Ravi K', tags: ['warm'], score: 55, createdAt: new Date(Date.now() - 7 * 86400000) },
  { id: 'l6', title: 'Product samples request', contactName: 'Deepa Joshi', phone: '+919876543215', stageId: 's3', assignedTo: 'Priya S', tags: [], score: 40, createdAt: new Date(Date.now() - 4 * 86400000) },
  { id: 'l7', title: 'Custom order manufacturing', contactName: 'Rahul Gupta', phone: '+919876543216', stageId: 's4', assignedTo: 'Ravi K', tags: ['bulk-order'], score: 70, createdAt: new Date(Date.now() - 10 * 86400000) },
  { id: 'l8', title: 'Service contract renewal', contactName: 'Lakshmi Iyer', phone: '+919876543217', stageId: 's4', assignedTo: 'Priya S', tags: ['vip'], score: 88, createdAt: new Date(Date.now() - 6 * 86400000) },
  { id: 'l9', title: 'Trade show follow-up order', contactName: 'Manoj Tiwari', phone: '+919876543218', stageId: 's5', assignedTo: 'Ravi K', tags: ['hot'], score: 100, createdAt: new Date(Date.now() - 15 * 86400000) },
  { id: 'l10', title: 'Initial consultation', contactName: 'Pooja Bansal', phone: '+919876543219', stageId: 's1', assignedTo: 'Priya S', tags: [], score: 20, createdAt: new Date(Date.now() - 1 * 86400000) },
]

export const DUMMY_CONTACTS = [
  { id: 'c1', name: 'Amit Mehta', phone: '+919876543210', email: 'amit@example.com', company: 'Mehta Traders', source: 'website', tags: ['hot'], lastActivity: new Date(Date.now() - 2 * 3600000) },
  { id: 'c2', name: 'Sunita Patel', phone: '+919876543211', email: 'sunita@example.com', company: 'Patel Enterprises', source: 'referral', tags: ['warm'], lastActivity: new Date(Date.now() - 5 * 3600000) },
  { id: 'c3', name: 'Vijay Reddy', phone: '+919876543212', email: 'vijay@example.com', company: 'Reddy & Sons', source: 'instagram', tags: ['cold'], lastActivity: new Date(Date.now() - 86400000) },
  { id: 'c4', name: 'Meera Nair', phone: '+919876543213', email: 'meera@example.com', company: 'Nair Exports', source: 'website', tags: ['vip', 'hot'], lastActivity: new Date(Date.now() - 3600000) },
  { id: 'c5', name: 'Karan Singh', phone: '+919876543214', email: 'karan@example.com', company: 'Singh Wholesale', source: 'cold-call', tags: ['warm'], lastActivity: new Date(Date.now() - 2 * 86400000) },
]

export const DUMMY_MESSAGES = [
  { id: 'm1', direction: 'inbound' as const, body: 'Hi, I am interested in your products. Can you share the catalog?', time: new Date(Date.now() - 3600000), status: 'read' as const },
  { id: 'm2', direction: 'outbound' as const, body: 'Of course! I\'ll send you our full catalog right away. We have some great deals on bulk orders.', time: new Date(Date.now() - 3500000), status: 'read' as const },
  { id: 'm3', direction: 'inbound' as const, body: 'Thank you! What are the payment terms?', time: new Date(Date.now() - 3000000), status: 'read' as const },
  { id: 'm4', direction: 'outbound' as const, body: 'We offer 30% advance and 70% on delivery for first orders. For repeat customers, we have 60-day credit terms.', time: new Date(Date.now() - 2900000), status: 'delivered' as const },
  { id: 'm5', direction: 'inbound' as const, body: 'Sounds good. Can we schedule a call to discuss further?', time: new Date(Date.now() - 1800000), status: 'read' as const },
]

export const DUMMY_REMINDERS = [
  { id: 'r1', note: 'Call Amit to discuss office supplies requirements', dueAt: new Date(Date.now() + 2 * 3600000), leadTitle: 'Office supplies bulk order', contactName: 'Amit Mehta', assignedTo: 'Ravi K', isDone: false },
  { id: 'r2', note: 'Follow up on annual supply agreement proposal', dueAt: new Date(Date.now() + 5 * 3600000), leadTitle: 'Annual supply agreement', contactName: 'Meera Nair', assignedTo: 'Priya S', isDone: false },
  { id: 'r3', note: 'Send revised pricing to Karan Singh', dueAt: new Date(Date.now() - 3600000), leadTitle: 'Wholesale product inquiry', contactName: 'Karan Singh', assignedTo: 'Ravi K', isDone: false },
  { id: 'r4', note: 'Check payment status for trade show order', dueAt: new Date(Date.now() - 86400000), leadTitle: 'Trade show follow-up order', contactName: 'Manoj Tiwari', assignedTo: 'Ravi K', isDone: true },
]

export const DUMMY_TASKS = [
  { id: 't1', title: 'Prepare pricing sheet for Sunita', description: 'Include volume discount tiers', priority: 'high' as const, status: 'todo' as const, dueAt: new Date(Date.now() + 86400000), leadTitle: 'Monthly procurement contract', assignedTo: 'Ravi K' },
  { id: 't2', title: 'Send product catalog', status: 'in_progress' as const, priority: 'medium' as const, dueAt: new Date(Date.now() + 2 * 86400000), leadTitle: 'Export packaging materials', assignedTo: 'Priya S' },
  { id: 't3', title: 'Draft service contract', status: 'todo' as const, priority: 'high' as const, dueAt: new Date(Date.now() + 3 * 86400000), leadTitle: 'Service contract renewal', assignedTo: 'Priya S' },
]

export const DUMMY_ORDERS = [
  { id: 'o1', orderNumber: 'ORD-2026-001', contactName: 'Manoj Tiwari', leadTitle: 'Trade show follow-up order', status: 'confirmed' as const, paymentStatus: 'partial' as const, total: 45000, itemsCount: 2, createdAt: new Date(Date.now() - 5 * 86400000) },
  { id: 'o2', orderNumber: 'ORD-2026-002', contactName: 'Meera Nair', leadTitle: 'Annual supply agreement', status: 'draft' as const, paymentStatus: 'pending' as const, total: 120000, itemsCount: 5, createdAt: new Date(Date.now() - 2 * 86400000) },
]

export const DUMMY_TEMPLATES = [
  { id: 'tpl1', name: 'First Contact', body: 'Hi {{contact_name}}! 👋 Thanks for your interest. I\'m {{agent_name}} from our sales team. How can I help you today?', category: 'intro', shortcut: '/intro' },
  { id: 'tpl2', name: 'Follow Up', body: 'Hi {{contact_name}}, just following up on our conversation. Do you have any questions I can help with?', category: 'follow-up', shortcut: '/fu' },
  { id: 'tpl3', name: 'Proposal Sent', body: 'Hi {{contact_name}}, I\'ve sent over our proposal for your review. Please let me know if you have any questions! 📋', category: 'proposal', shortcut: '/proposal' },
  { id: 'tpl4', name: 'Payment Reminder', body: 'Hi {{contact_name}}, just a gentle reminder that payment for Order #{{order_number}} (₹{{amount}}) is pending.', category: 'payment', shortcut: '/pay' },
  { id: 'tpl5', name: 'Order Confirmed', body: 'Great news {{contact_name}}! 🎉 Your order #{{order_number}} has been confirmed.', category: 'order', shortcut: '/confirm' },
]

export const DUMMY_SESSIONS = [
  { id: 'sess1', name: 'Sales WhatsApp', phone: '+91 9999999999', status: 'connected' as const, lastConnected: new Date(Date.now() - 3600000) },
  { id: 'sess2', name: 'Support WhatsApp', phone: '+91 8888888888', status: 'disconnected' as const, lastConnected: new Date(Date.now() - 5 * 86400000) },
  { id: 'sess3', name: 'Accounts WhatsApp', phone: '+91 7777777777', status: 'requires_reauth' as const, lastConnected: new Date(Date.now() - 2 * 86400000) },
]

export const DUMMY_ACTIVITY = [
  { id: 'a1', type: 'message_sent', description: 'Message sent to Amit Mehta', user: 'Ravi K', leadTitle: 'Office supplies bulk order', time: new Date(Date.now() - 1800000) },
  { id: 'a2', type: 'lead_created', description: 'New lead created: Initial consultation', user: 'Priya S', leadTitle: 'Initial consultation', time: new Date(Date.now() - 3600000) },
  { id: 'a3', type: 'stage_moved', description: 'Lead moved: New → Contacted', user: 'Ravi K', leadTitle: 'Export packaging materials', time: new Date(Date.now() - 7200000) },
  { id: 'a4', type: 'order_created', description: 'Order ORD-2026-002 created', user: 'Priya S', leadTitle: 'Annual supply agreement', time: new Date(Date.now() - 86400000) },
  { id: 'a5', type: 'payment_updated', description: 'Payment status updated to Partial', user: 'Ravi K', leadTitle: 'Trade show follow-up order', time: new Date(Date.now() - 2 * 86400000) },
]
