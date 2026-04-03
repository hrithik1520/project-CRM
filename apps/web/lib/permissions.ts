export type CRMRole = 'admin' | 'manager' | 'agent'

export type Action =
  | 'manage_users'
  | 'manage_sessions'
  | 'manage_pipelines'
  | 'manage_automations'
  | 'manage_templates'
  | 'view_all_leads'
  | 'assign_lead'
  | 'create_lead'
  | 'edit_lead'
  | 'delete_lead'
  | 'send_message'
  | 'create_order'
  | 'edit_order'
  | 'view_audit_logs'
  | 'manage_webhooks'

const PERMISSIONS: Record<CRMRole, Action[]> = {
  admin: [
    'manage_users', 'manage_sessions', 'manage_pipelines', 'manage_automations',
    'manage_templates', 'view_all_leads', 'assign_lead', 'create_lead', 'edit_lead',
    'delete_lead', 'send_message', 'create_order', 'edit_order', 'view_audit_logs',
    'manage_webhooks',
  ],
  manager: [
    'manage_pipelines', 'manage_templates', 'view_all_leads', 'assign_lead',
    'create_lead', 'edit_lead', 'send_message', 'create_order', 'edit_order',
  ],
  agent: [
    'create_lead', 'edit_lead', 'send_message', 'create_order',
  ],
}

export function hasPermission(role: CRMRole, action: Action): boolean {
  return PERMISSIONS[role]?.includes(action) ?? false
}
