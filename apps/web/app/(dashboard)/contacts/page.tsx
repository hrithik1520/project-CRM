'use client'

import { useState } from 'react'
import { Search, Plus, Phone, Mail, Building2, Tag, ChevronRight, X } from 'lucide-react'
import { DUMMY_CONTACTS } from '@/lib/dummy-data'
import { cn, formatRelativeTime } from '@/lib/utils'

const TAG_COLORS: Record<string, string> = {
  hot: 'bg-red-100 text-red-700',
  warm: 'bg-amber-100 text-amber-700',
  cold: 'bg-blue-100 text-blue-700',
  vip: 'bg-purple-100 text-purple-700',
  'bulk-order': 'bg-green-100 text-green-700',
}

export default function ContactsPage() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<(typeof DUMMY_CONTACTS)[0] | null>(null)

  const filtered = DUMMY_CONTACTS.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c.company ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex h-full">
      {/* Main list */}
      <div className={cn('flex flex-col', selected ? 'flex-1' : 'w-full')}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shrink-0">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Contacts</h1>
            <p className="text-sm text-gray-500 mt-0.5">{DUMMY_CONTACTS.length} contacts</p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90">
            <Plus className="w-4 h-4" />
            New Contact
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-gray-200 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, email..."
              className="w-full h-9 pl-9 pr-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden lg:table-cell">Company</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden lg:table-cell">Source</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Tags</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">Last Active</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-sm text-gray-500">
                    No contacts found
                  </td>
                </tr>
              )}
              {filtered.map((contact) => (
                <tr
                  key={contact.id}
                  onClick={() => setSelected(contact === selected ? null : contact)}
                  className={cn('hover:bg-gray-50 cursor-pointer', selected?.id === contact.id && 'bg-blue-50')}
                >
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-semibold text-primary-foreground shrink-0">
                        {contact.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{contact.name}</p>
                        <p className="text-xs text-gray-500 md:hidden">{contact.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{contact.phone}</td>
                  <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{contact.company ?? '—'}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 capitalize">
                      {contact.source}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {contact.tags.map((t) => (
                        <span key={t} className={cn('px-1.5 py-0.5 rounded text-xs font-medium', TAG_COLORS[t] ?? 'bg-gray-100 text-gray-600')}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">
                    {formatRelativeTime(contact.lastActivity)}
                  </td>
                  <td className="px-4 py-3">
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail drawer */}
      {selected && (
        <div className="w-80 shrink-0 border-l border-gray-200 bg-white overflow-y-auto flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Contact Details</h2>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-700">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 space-y-4">
            {/* Avatar + name */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-lg font-bold text-primary-foreground">
                {selected.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{selected.name}</p>
                <p className="text-xs text-gray-500 capitalize">{selected.source}</p>
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                {selected.phone}
              </div>
              {selected.email && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                  {selected.email}
                </div>
              )}
              {selected.company && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                  {selected.company}
                </div>
              )}
            </div>

            {/* Tags */}
            {selected.tags.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <Tag className="w-3 h-3" /> Tags
                </p>
                <div className="flex gap-1 flex-wrap">
                  {selected.tags.map((t) => (
                    <span key={t} className={cn('px-2 py-0.5 rounded-full text-xs font-medium', TAG_COLORS[t] ?? 'bg-gray-100 text-gray-600')}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <button className="w-full text-left px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50">
                View Leads (3)
              </button>
              <button className="w-full text-left px-3 py-2 text-sm rounded-lg bg-green-50 border border-green-200 text-green-700 hover:bg-green-100">
                Send WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
