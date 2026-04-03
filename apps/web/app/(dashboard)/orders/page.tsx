'use client'

import { useState } from 'react'
import { Plus, ChevronRight, X } from 'lucide-react'
import { useOrders, useUpdateOrderStatus, type Order } from '@/lib/hooks/use-orders'
import { cn, formatCurrency, formatDate } from '@/lib/utils'

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  confirmed: 'bg-blue-100 text-blue-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function OrdersPage() {
  const [selected, setSelected] = useState<Order | null>(null)
  const { data, isLoading } = useOrders({ pageSize: 100 })
  const orders = data?.data ?? []

  const updateStatus = useUpdateOrderStatus(selected?.id ?? '')

  const totalRevenue = orders.reduce((sum, o) => sum + (o.status === 'delivered' ? o.total : 0), 0)
  const totalPaid = orders.reduce((sum, o) => sum + o.paidAmount, 0)
  const pendingCount = orders.filter((o) => o.status === 'pending').length

  return (
    <div className="flex h-full">
      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shrink-0">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Orders</h1>
            <p className="text-sm text-gray-500 mt-0.5">{isLoading ? '…' : `${data?.total ?? 0} orders`}</p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90">
            <Plus className="w-4 h-4" />
            New Order
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Orders', value: String(data?.total ?? '—'), sub: 'All time' },
              { label: 'Pending Orders', value: String(pendingCount), sub: 'Awaiting confirmation' },
              { label: 'Total Paid', value: formatCurrency(totalPaid), sub: 'Across all orders' },
              { label: 'Total Revenue', value: formatCurrency(totalRevenue), sub: 'Delivered orders' },
            ].map((card) => (
              <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500 font-medium">{card.label}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{card.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
              </div>
            ))}
          </div>

          {isLoading && <p className="text-sm text-gray-400 text-center py-12">Loading…</p>}

          {/* Table */}
          {!isLoading && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Order</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Contact</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">Paid</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Total</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden lg:table-cell">Date</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center text-sm text-gray-500">No orders yet</td>
                    </tr>
                  )}
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => setSelected(order === selected ? null : order)}
                      className={cn('hover:bg-gray-50 cursor-pointer', selected?.id === order.id && 'bg-blue-50')}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{order.title}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{order.contact.name}</td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', ORDER_STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600')}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="text-xs">
                          <span className="font-medium">{formatCurrency(order.paidAmount)}</span>
                          <span className="text-gray-400"> / {formatCurrency(order.total)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(order.total)}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">{formatDate(new Date(order.createdAt))}</td>
                      <td className="px-4 py-3">
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Order detail drawer */}
      {selected && (
        <div className="w-96 shrink-0 border-l border-gray-200 bg-white overflow-y-auto flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">{selected.title}</h2>
              <p className="text-xs text-gray-500">{selected.contact.name}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-700">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div className="flex gap-2">
              <span className={cn('px-3 py-1 rounded-full text-xs font-medium capitalize', ORDER_STATUS_COLORS[selected.status] ?? 'bg-gray-100 text-gray-600')}>
                {selected.status}
              </span>
            </div>

            {/* Items */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Items</p>
              <div className="space-y-1">
                {selected.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-100 last:border-0">
                    <span className="text-gray-900 flex-1">{item.name}</span>
                    <span className="text-gray-500 text-xs mx-2">{item.quantity} × {formatCurrency(item.unitPrice)}</span>
                    <span className="font-medium text-gray-900">{formatCurrency(item.total)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between pt-2 mt-1 border-t border-gray-200">
                <span className="text-sm font-semibold text-gray-900">Total</span>
                <span className="text-sm font-bold text-gray-900">{formatCurrency(selected.total)}</span>
              </div>
            </div>

            {/* Payments */}
            {selected.payments.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Payments</p>
                <div className="space-y-1">
                  {selected.payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-sm py-1">
                      <span className="text-gray-600 capitalize">{p.method}</span>
                      <span className="text-xs text-gray-400">{formatDate(new Date(p.paidAt))}</span>
                      <span className="font-medium text-green-700">{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between pt-2 mt-1 border-t border-gray-200 text-sm">
                  <span className="text-gray-500">Balance due</span>
                  <span className="font-semibold text-red-600">{formatCurrency(selected.total - selected.paidAmount)}</span>
                </div>
              </div>
            )}

            {/* Update status */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Update Status</p>
              <div className="grid grid-cols-2 gap-2">
                {(['confirmed', 'delivered', 'cancelled'] as const).map((s) => (
                  <button
                    key={s}
                    disabled={selected.status === s || updateStatus.isPending}
                    onClick={() => updateStatus.mutate(s)}
                    className={cn('px-3 py-2 text-xs rounded-lg border capitalize font-medium disabled:opacity-50', ORDER_STATUS_COLORS[s])}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
