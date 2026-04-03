'use client'

import { Search, Wifi, WifiOff, AlertCircle } from 'lucide-react'
import { UserButton, useUser } from '@clerk/nextjs'
import { cn } from '@/lib/utils'
import { DUMMY_SESSIONS } from '@/lib/dummy-data'

export function Topbar() {
  const { user } = useUser()

  return (
    <header className="h-14 border-b border-gray-200 bg-white flex items-center px-4 gap-4 shrink-0">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search leads, contacts, messages..."
          className="w-full h-9 pl-9 pr-4 rounded-lg border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
        />
      </div>

      {/* WhatsApp session badges */}
      <div className="flex items-center gap-2">
        {DUMMY_SESSIONS.map((session) => (
          <div
            key={session.id}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
              session.status === 'connected'
                ? 'bg-green-50 text-green-700'
                : session.status === 'requires_reauth'
                ? 'bg-amber-50 text-amber-700'
                : 'bg-red-50 text-red-700'
            )}
          >
            {session.status === 'connected' ? (
              <Wifi className="w-3 h-3" />
            ) : session.status === 'requires_reauth' ? (
              <AlertCircle className="w-3 h-3" />
            ) : (
              <WifiOff className="w-3 h-3" />
            )}
            <span className="hidden sm:inline">{session.name}</span>
          </div>
        ))}
      </div>

      {/* Clerk UserButton — handles avatar, profile, sign out */}
      <UserButton
        afterSignOutUrl="/login"
        appearance={{
          elements: {
            avatarBox: 'w-8 h-8',
          },
        }}
      />
    </header>
  )
}
