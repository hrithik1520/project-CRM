'use client'

import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const DUMMY_TEAM = [
  { id: 'u1', name: 'Admin User', email: 'admin@crm.local', role: 'admin', isActive: true },
  { id: 'u2', name: 'Sales Manager', email: 'manager@crm.local', role: 'manager', isActive: true },
  { id: 'u3', name: 'Ravi Kumar', email: 'ravi@crm.local', role: 'agent', isActive: true },
  { id: 'u4', name: 'Priya Sharma', email: 'priya@crm.local', role: 'agent', isActive: true },
]

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  agent: 'bg-gray-100 text-gray-600',
}

export default function TeamSettingsPage() {
  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Team Members</h1>
          <p className="text-sm text-gray-500 mt-0.5">{DUMMY_TEAM.length} members</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Invite User
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Email</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Role</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
              <th className="w-20" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {DUMMY_TEAM.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-semibold text-primary-foreground">
                      {member.name.charAt(0)}
                    </div>
                    <span className="font-medium text-gray-900">{member.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{member.email}</td>
                <td className="px-4 py-3">
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', ROLE_COLORS[member.role])}>
                    {member.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('text-xs font-medium', member.isActive ? 'text-green-600' : 'text-gray-400')}>
                    {member.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="text-xs text-gray-500 hover:text-gray-900 border border-gray-200 px-2 py-1 rounded">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
