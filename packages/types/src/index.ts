// ─────────────────────────────────────────────
// Shared types for CRM monorepo
// ─────────────────────────────────────────────

export type Role = 'admin' | 'manager' | 'agent'

export type LeadStatus = 'active' | 'won' | 'lost' | 'stale' | 'archived'

export type WhatsAppSessionStatus =
  | 'initializing'
  | 'qr'
  | 'connected'
  | 'disconnected'
  | 'requires_reauth'
  | 'stopped'

export type MessageDirection = 'inbound' | 'outbound'

export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed'

export type MessageType = 'text' | 'image' | 'document' | 'audio' | 'video' | 'sticker' | 'location' | 'template'

export type OrderStatus = 'draft' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded'

export type TaskStatus = 'todo' | 'in_progress' | 'done'

export type TaskPriority = 'low' | 'medium' | 'high'

export type AutomationTrigger =
  | 'lead_created'
  | 'lead_assigned'
  | 'stage_changed'
  | 'no_reply_after'
  | 'no_followup_after'
  | 'payment_pending'
  | 'lead_stale'

export type AutomationAction =
  | 'send_whatsapp_message'
  | 'create_task'
  | 'create_reminder'
  | 'move_to_stage'
  | 'assign_to_user'
  | 'send_notification'

// ─────────────────────────────────────────────
// Internal event types (WhatsApp engine → Next.js)
// ─────────────────────────────────────────────

export interface SessionStatusEvent {
  type: 'session_status'
  sessionId: string
  accountId: string
  status: WhatsAppSessionStatus
  qrCode?: string
  phoneNumber?: string
  errorMessage?: string
}

export interface MessageReceivedEvent {
  type: 'message_received'
  sessionId: string
  accountId: string
  waMessageId: string
  from: string           // phone number with country code, no +
  body: string | null
  messageType: MessageType
  mediaUrl?: string
  timestamp: number
}

export interface MessageStatusEvent {
  type: 'message_status'
  waMessageId: string
  status: 'delivered' | 'read'
  timestamp: number
}

export type InternalEvent = SessionStatusEvent | MessageReceivedEvent | MessageStatusEvent

// ─────────────────────────────────────────────
// API response types
// ─────────────────────────────────────────────

export interface ApiError {
  error: string
  code?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// ─────────────────────────────────────────────
// BullMQ job payloads
// ─────────────────────────────────────────────

export interface SendMessageJobPayload {
  messageId: string
  sessionId: string
  accountId: string
  to: string          // phone number
  body: string
  templateId?: string
}

export interface AutomationJobPayload {
  automationId: string
  leadId: string
  triggerType: AutomationTrigger
  context: Record<string, unknown>
}

export interface GA4EventJobPayload {
  eventQueueId: string
  eventName: string
  parameters: Record<string, unknown>
  clientId?: string
}

export interface ReminderCheckJobPayload {
  checkTime: string
}
