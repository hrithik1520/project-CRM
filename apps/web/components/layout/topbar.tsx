'use client'

import { Search, Wifi, WifiOff, AlertCircle, LogOut, User, ChevronDown } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { DUMMY_SESSIONS } from '@/lib/dummy-data'

export function Topbar() {
  const { data: session } = useSession()
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)

  async function handleLogout() {
    await signOut({ redirect: false })
    router.push('/login')
  }

  const user = session?.user as { name?: string; email?: string; role?: string } | undefined

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
        {DUMMY_SESSIONS.map((s) => (
          <div
            key={s.id}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
              s.status === 'connected'
                ? 'bg-green-50 text-green-700'
                : s.status === 'requires_reauth'
                ? 'bg-amber-50 text-amber-700'
                : 'bg-red-50 text-red-700'
            )}
          >
            {s.status === 'connected' ? (
              <Wifi className="w-3 h-3" />
            ) : s.status === 'requires_reauth' ? (
              <AlertCircle className="w-3 h-3" />
            ) : (
              <WifiOff className="w-3 h-3" />
            )}
            <span className="hidden sm:inline">{s.name}</span>
          </div>
        ))}
      </div>

      {/* User menu */}
      <div className="relative">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-semibold text-primary-foreground">
            {user?.name?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-gray-900 leading-none">{user?.name ?? 'User'}</p>
            <p className="text-xs text-gray-500 mt-0.5 capitalize">{user?.role ?? 'agent'}</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </button>

        {showUserMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg border border-gray-200 shadow-lg z-20 py-1">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={() => { setShowUserMenu(false); router.push('/settings/profile') }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <User className="w-4 h-4" />
                Profile
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
