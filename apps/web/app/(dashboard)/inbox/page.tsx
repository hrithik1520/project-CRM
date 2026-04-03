'use client'

import { useState } from 'react'
import { Search, Send, FileText, Wifi, WifiOff, Check, CheckCheck } from 'lucide-react'
import { DUMMY_CONTACTS, DUMMY_MESSAGES, DUMMY_TEMPLATES, DUMMY_SESSIONS } from '@/lib/dummy-data'
import { cn, formatRelativeTime } from '@/lib/utils'

const DUMMY_CONVERSATIONS = [
  { id: 'cv1', contactName: 'Amit Mehta', lastMsg: 'Can we schedule a call to discuss further?', time: new Date(Date.now() - 1800000), unread: 1, sessionId: 'sess1' },
  { id: 'cv2', contactName: 'Meera Nair', lastMsg: 'Thank you for the proposal!', time: new Date(Date.now() - 3600000), unread: 0, sessionId: 'sess1' },
  { id: 'cv3', contactName: 'Karan Singh', lastMsg: 'I\'ll get back to you tomorrow.', time: new Date(Date.now() - 7200000), unread: 2, sessionId: 'sess1' },
  { id: 'cv4', contactName: 'Sunita Patel', lastMsg: 'Please send the pricing sheet.', time: new Date(Date.now() - 86400000), unread: 0, sessionId: 'sess1' },
  { id: 'cv5', contactName: 'Vijay Reddy', lastMsg: 'OK sounds good.', time: new Date(Date.now() - 2 * 86400000), unread: 0, sessionId: 'sess1' },
]

function MessageStatus({ status }: { status: string }) {
  if (status === 'read') return <CheckCheck className="w-3 h-3 text-blue-400" />
  if (status === 'delivered') return <CheckCheck className="w-3 h-3 text-gray-400" />
  if (status === 'sent') return <Check className="w-3 h-3 text-gray-400" />
  return null
}

export default function InboxPage() {
  const [activeSession, setActiveSession] = useState('sess1')
  const [activeConv, setActiveConv] = useState(DUMMY_CONVERSATIONS[0]!.id)
  const [msgInput, setMsgInput] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const [search, setSearch] = useState('')

  const conv = DUMMY_CONVERSATIONS.find((c) => c.id === activeConv)

  const filteredConvs = DUMMY_CONVERSATIONS.filter(
    (c) => c.sessionId === activeSession && c.contactName.toLowerCase().includes(search.toLowerCase())
  )

  function applyTemplate(body: string) {
    setMsgInput(body)
    setShowTemplates(false)
  }

  return (
    <div className="flex h-full">
      {/* Left panel: session tabs + conversation list */}
      <div className="w-72 shrink-0 flex flex-col border-r border-gray-200 bg-white">
        {/* Session tabs */}
        <div className="border-b border-gray-200 px-3 py-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Sessions</p>
          <div className="space-y-1">
            {DUMMY_SESSIONS.filter(s => s.status === 'connected').map((session) => (
              <button
                key={session.id}
                onClick={() => setActiveSession(session.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                  activeSession === session.id ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                <Wifi className="w-3.5 h-3.5 text-green-500 shrink-0" />
                {session.name}
              </button>
            ))}
            {DUMMY_SESSIONS.filter(s => s.status !== 'connected').map((session) => (
              <button
                key={session.id}
                onClick={() => setActiveSession(session.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors opacity-50',
                  activeSession === session.id ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                <WifiOff className="w-3.5 h-3.5 text-red-400 shrink-0" />
                {session.name}
              </button>
            ))}
          </div>
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
          {filteredConvs.map((cv) => (
            <button
              key={cv.id}
              onClick={() => setActiveConv(cv.id)}
              className={cn(
                'w-full flex items-start gap-3 px-3 py-3 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors',
                activeConv === cv.id && 'bg-blue-50 border-l-2 border-l-blue-500'
              )}
            >
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-xs font-semibold text-primary-foreground shrink-0">
                {cv.contactName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">{cv.contactName}</p>
                  <p className="text-xs text-gray-400 shrink-0 ml-2">{formatRelativeTime(cv.time)}</p>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xs text-gray-500 truncate">{cv.lastMsg}</p>
                  {cv.unread > 0 && (
                    <span className="ml-2 min-w-[18px] h-[18px] rounded-full bg-green-500 text-white text-[10px] flex items-center justify-center font-semibold shrink-0">
                      {cv.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right panel: active chat */}
      {conv ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-sm font-semibold text-primary-foreground">
                {conv.contactName.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{conv.contactName}</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <Wifi className="w-3 h-3" /> Online via Sales WhatsApp
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50">
                Link to Lead
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
            {DUMMY_MESSAGES.map((msg) => (
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
                      {new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit' }).format(msg.time)}
                    </span>
                    {msg.direction === 'outbound' && <MessageStatus status={msg.status} />}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Send box */}
          <div className="border-t border-gray-200 bg-white p-3 shrink-0">
            {showTemplates && (
              <div className="mb-2 border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-600">Templates</p>
                  <button onClick={() => setShowTemplates(false)} className="text-xs text-gray-400 hover:text-gray-700">close</button>
                </div>
                {DUMMY_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => applyTemplate(tpl.body)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                  >
                    <p className="text-xs font-medium text-gray-900">{tpl.name} <span className="text-gray-400 font-normal">{tpl.shortcut}</span></p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{tpl.body.slice(0, 80)}…</p>
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
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault() /* send */ }
                  }}
                />
              </div>
              <button
                disabled={!msgInput.trim()}
                className="p-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <p className="text-sm text-gray-400">Select a conversation</p>
        </div>
      )}
    </div>
  )
}
