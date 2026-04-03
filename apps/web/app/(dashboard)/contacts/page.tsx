'use client'

import { useState } from 'react'
import { Search, Plus, Phone, Mail, Building2, Tag, ChevronRight, X } from 'lucide-react'
import { useContacts, type Contact } from '@/lib/hooks/use-contacts'
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
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selected, setSelected] = useState<Contact | null>(null)

  const { data, isLoading } = useContacts({ search: debouncedSearch || undefined, pageSize: 100 })
  const contacts = data?.data ?? []

  function handleSearch(value: string) {
    setSearch(value)
    clearTimeout((handleSearch as any).__timer)
    ;(handleSearch as any).__timer = setTimeout(() => setDebouncedSearch(value), 300)
  }

  return (
    <div className="flex h-full">
      {/* Main list */}
      <div className={cn('flex flex-col', selected ? 'flex-1' : 'w-full')}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shrink-0">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Contacts</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {isLoading ? '…' : `${data?.total ?? 0} contacts`}
            </p>
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
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name, phone, email..."
              className="w-full h-9 pl-9 pr-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-16 text-sm text-gray-400">Loading…</div>
          )}
          {!isLoading && (
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">Phone</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden lg:table-cell">Company</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Tags</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">Leads</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">Added</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {contacts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-sm text-gray-500">No contacts found</td>
                  </tr>
                )}
                {contacts.map((contact) => (
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
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {contact.contactTags.map((ct) => (
                          <span key={ct.tag.id} className={cn('px-1.5 py-0.5 rounded text-xs font-medium', TAG_COLORS[ct.tag.name] ?? 'bg-gray-100 text-gray-600')}>
                            {ct.tag.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">
                      {contact._count?.leads ?? 0}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">
                      {formatRelativeTime(new Date(contact.createdAt))}
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-lg font-bold text-primary-foreground">
                {selected.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{selected.name}</p>
                {selected.company && <p className="text-xs text-gray-500">{selected.company}</p>}
              </div>
            </div>

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

            {selected.contactTags.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <Tag className="w-3 h-3" /> Tags
                </p>
                <div className="flex gap-1 flex-wrap">
                  {selected.contactTags.map((ct) => (
                    <span key={ct.tag.id} className={cn('px-2 py-0.5 rounded-full text-xs font-medium', TAG_COLORS[ct.tag.name] ?? 'bg-gray-100 text-gray-600')}>
                      {ct.tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Active leads</span>
                <span className="font-medium">{selected._count?.leads ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Conversations</span>
                <span className="font-medium">{selected._count?.conversations ?? 0}</span>
              </div>
            </div>

            <div className="space-y-2">
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
