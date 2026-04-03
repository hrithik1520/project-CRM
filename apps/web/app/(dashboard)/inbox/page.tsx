'use client'

import { useState } from 'react'
import { Search, Send, FileText, Wifi, WifiOff, Check, CheckCheck } from 'lucide-react'
import { useConversations, useSendMessage, useMarkConversationRead, type Conversation, type Message } from '@/lib/hooks/use-conversations'
import { useTemplates } from '@/lib/hooks/use-templates'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { cn, formatRelativeTime } from '@/lib/utils'

interface WhatsAppAccount {
  id: string
  name: string
  phoneNumber?: string | null
  sessions: { id: string; status: string }[]
}

function useWhatsAppAccounts() {
  return useQuery<WhatsAppAccount[]>({
    queryKey: ['whatsapp-accounts'],
    queryFn: () => api.get('/api/whatsapp/accounts'),
    refetchInterval: 15000,
  })
}

function MsgStatus({ status }: { status: string }) {
  if (status === 'read') return <CheckCheck className="w-3 h-3 text-blue-400" />
  if (status === 'delivered') return <CheckCheck className="w-3 h-3 text-gray-400" />
  if (status === 'sent') return <Check className="w-3 h-3 text-gray-400" />
  return null
}

function ConversationSkeleton() {
  return (
    <div className="px-3 py-3 border-b border-gray-100 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-24 bg-gray-200 rounded" />
          <div className="h-3 w-36 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  )
}

export default function InboxPage() {
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null)
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [msgInput, setMsgInput] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const [search, setSearch] = useState('')

  const { data: accounts, isLoading: accountsLoading } = useWhatsAppAccounts()
  const currentAccountId = activeAccountId ?? accounts?.[0]?.id ?? null

  const { data: convData, isLoading: convsLoading } = useConversations({
    whatsappAccountId: currentAccountId ?? undefined,
  })

  const { data: convDetail } = useQuery<Conversation>({
    queryKey: ['conversations', activeConvId],
    queryFn: () => api.get(`/api/conversations/${activeConvId}?pageSize=50`),
    enabled: !!activeConvId,
    refetchInterval: 5000,
  })

  const { data: templateData } = useTemplates({ pageSize: 50 })
  const sendMessage = useSendMessage(activeConvId ?? '')
  const markRead = useMarkConversationRead()

  const conversations = convData?.data ?? []
  const filtered = conversations.filter((c) =>
    c.contact.name.toLowerCase().includes(search.toLowerCase()) ||
    c.contact.phone.includes(search)
  )

  async function handleSend() {
    if (!msgInput.trim() || !activeConvId) return
    await sendMessage.mutateAsync({ body: msgInput.trim() })
    setMsgInput('')
  }

  function openConversation(convId: string) {
    setActiveConvId(convId)
    markRead.mutate(convId)
  }

  const activeConv = convDetail ?? conversations.find((c) => c.id === activeConvId)
  const messages = convDetail?.messages ?? []

  const connectedAccounts = accounts?.filter((a) => a.sessions.some((s) => s.status === 'connected')) ?? []
  const otherAccounts = accounts?.filter((a) => !a.sessions.some((s) => s.status === 'connected')) ?? []

  return (
    <div className="flex h-full">
      {/* Left panel: account tabs + conversation list */}
      <div className="w-72 shrink-0 flex flex-col border-r border-gray-200 bg-white">
        {/* Account tabs */}
        <div className="border-b border-gray-200 px-3 py-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Accounts</p>
          {accountsLoading ? (
            <div className="space-y-1">
              <div className="h-8 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-8 bg-gray-100 rounded-lg animate-pulse" />
            </div>
          ) : (
            <div className="space-y-1">
              {connectedAccounts.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => { setActiveAccountId(acc.id); setActiveConvId(null) }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                    currentAccountId === acc.id ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <Wifi className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  {acc.name}
                </button>
              ))}
              {otherAccounts.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => { setActiveAccountId(acc.id); setActiveConvId(null) }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors opacity-50',
                    currentAccountId === acc.id ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <WifiOff className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  {acc.name}
                </button>
              ))}
              {!accountsLoading && accounts?.length === 0 && (
                <p className="text-xs text-gray-400 px-3 py-2">No accounts. Add one in Settings.</p>
              )}
            </div>
          )}
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full h-8 pl-8 pr-3 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {convsLoading
            ? Array.from({ length: 5 }).map((_, i) => <ConversationSkeleton key={i} />)
            : filtered.map((cv) => (
              <button
                key={cv.id}
                onClick={() => openConversation(cv.id)}
                className={cn(
                  'w-full flex items-start gap-3 px-3 py-3 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors',
                  activeConvId === cv.id && 'bg-blue-50 border-l-2 border-l-blue-500'
                )}
              >
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-xs font-semibold text-primary-foreground shrink-0">
                  {cv.contact.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">{cv.contact.name}</p>
                    <p className="text-xs text-gray-400 shrink-0 ml-2">
                      {cv.lastMessageAt ? formatRelativeTime(new Date(cv.lastMessageAt)) : ''}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-gray-500 truncate">{cv.lastMessageBody ?? ''}</p>
                    {cv.unreadCount > 0 && (
                      <span className="ml-2 min-w-[18px] h-[18px] rounded-full bg-green-500 text-white text-[10px] flex items-center justify-center font-semibold shrink-0">
                        {cv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}

          {!convsLoading && filtered.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-8">No conversations</p>
          )}
        </div>
      </div>

      {/* Right panel: active chat */}
      {activeConv ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-sm font-semibold text-primary-foreground">
                {activeConv.contact.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{activeConv.contact.name}</p>
                <p className="text-xs text-gray-500">{activeConv.contact.phone}</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
            {[...messages].reverse().map((msg: Message) => (
              <div key={msg.id} className={cn('flex', msg.direction === 'outbound' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-sm px-4 py-2.5 rounded-2xl text-sm shadow-sm',
                  msg.direction === 'outbound'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
                )}>
                  <p className="leading-relaxed">{msg.body}</p>
                  <div className={cn('flex items-center justify-end gap-1 mt-1', msg.direction === 'outbound' ? 'text-primary-foreground/50' : 'text-gray-400')}>
                    <span className="text-[11px]">
                      {new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit' }).format(new Date(msg.createdAt))}
                    </span>
                    {msg.direction === 'outbound' && <MsgStatus status={msg.status} />}
                  </div>
                </div>
              </div>
            ))}

            {messages.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-8">No messages yet</p>
            )}
          </div>

          {/* Send box */}
          <div className="border-t border-gray-200 bg-white p-3 shrink-0">
            {showTemplates && (
              <div className="mb-2 border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm max-h-48 overflow-y-auto">
                <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
                  <p className="text-xs font-semibold text-gray-600">Templates</p>
                  <button onClick={() => setShowTemplates(false)} className="text-xs text-gray-400 hover:text-gray-700">close</button>
                </div>
                {(templateData?.data ?? []).map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => { setMsgInput(tpl.body); setShowTemplates(false) }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                  >
                    <p className="text-xs font-medium text-gray-900">{tpl.name} <span className="text-gray-400 font-normal">{tpl.shortcut}</span></p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{tpl.body.slice(0, 80)}{tpl.body.length > 80 ? '…' : ''}</p>
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2">
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className={cn('p-2 rounded-lg border transition-colors', showTemplates ? 'bg-gray-100 border-gray-300' : 'border-gray-200 hover:bg-gray-50')}
                title="Templates"
              >
                <FileText className="w-4 h-4 text-gray-500" />
              </button>
              <div className="flex-1 relative">
                <textarea
                  value={msgInput}
                  onChange={(e) => setMsgInput(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[40px] max-h-28"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
                  }}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!msgInput.trim() || sendMessage.isPending}
                className="p-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <p className="text-sm text-gray-400">Select a conversation to start chatting</p>
        </div>
      )}
    </div>
  )
}
