'use client'

import { useState } from 'react'
import { Plus, ChevronRight, X } from 'lucide-react'
import { DUMMY_ORDERS } from '@/lib/dummy-data'
import { cn, formatCurrency, formatDate } from '@/lib/utils'

const ORDER_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-amber-100 text-amber-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  partial: 'bg-amber-100 text-amber-700',
  paid: 'bg-green-100 text-green-700',
  refunded: 'bg-red-100 text-red-700',
}

const DUMMY_ITEMS = {
  'o1': [
    { name: 'Product A', qty: 100, unit: 250, total: 25000 },
    { name: 'Product B', qty: 50, unit: 400, total: 20000 },
  ],
  'o2': [
    { name: 'Steel Packaging', qty: 200, unit: 150, total: 30000 },
    { name: 'Foam Lining', qty: 500, unit: 80, total: 40000 },
    { name: 'Tape Rolls', qty: 50, unit: 100, total: 5000 },
    { name: 'Labels', qty: 1000, unit: 25, total: 25000 },
    { name: 'Stretch Film', qty: 20, unit: 1000, total: 20000 },
  ],
}

export default function OrdersPage() {
  const [selected, setSelected] = useState<(typeof DUMMY_ORDERS)[0] | null>(null)

  return (
    <div className="flex h-full">
      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shrink-0">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Orders</h1>
            <p className="text-sm text-gray-500 mt-0.5">{DUMMY_ORDERS.length} orders</p>
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
              { label: 'Total Orders', value: '2', sub: 'All time' },
              { label: 'Pending Payment', value: '₹1,20,000', sub: '1 order' },
              { label: 'Partial Payment', value: '₹45,000', sub: '1 order' },
              { label: 'Paid This Month', value: '₹0', sub: '0 orders' },
            ].map((card) => (
              <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500 font-medium">{card.label}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{card.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Order #</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Contact</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">Lead</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Payment</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Total</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden lg:table-cell">Date</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {DUMMY_ORDERS.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelected(order === selected ? null : order)}
                    className={cn('hover:bg-gray-50 cursor-pointer', selected?.id === order.id && 'bg-blue-50')}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-900">{order.orderNumber}</td>
                    <td className="px-4 py-3 text-gray-700">{order.contactName}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell truncate max-w-[160px]">{order.leadTitle}</td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', ORDER_STATUS_COLORS[order.status])}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', PAYMENT_STATUS_COLORS[order.paymentStatus])}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(order.total)}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3">
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Order detail drawer */}
      {selected && (
        <div className="w-96 shrink-0 border-l border-gray-200 bg-white overflow-y-auto flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">{selected.orderNumber}</h2>
              <p className="text-xs text-gray-500">{selected.contactName}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-700">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Status row */}
            <div className="flex gap-2">
              <span className={cn('px-3 py-1 rounded-full text-xs font-medium capitalize', ORDER_STATUS_COLORS[selected.status])}>
                {selected.status}
              </span>
              <span className={cn('px-3 py-1 rounded-full text-xs font-medium capitalize', PAYMENT_STATUS_COLORS[selected.paymentStatus])}>
                {selected.paymentStatus}
              </span>
            </div>

            {/* Items */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Items</p>
              <div className="space-y-1">
                {(DUMMY_ITEMS[selected.id as keyof typeof DUMMY_ITEMS] ?? []).map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-100 last:border-0">
                    <span className="text-gray-900">{item.name}</span>
                    <span className="text-gray-500 text-xs">{item.qty} × {formatCurrency(item.unit)}</span>
                    <span className="font-medium text-gray-900">{formatCurrency(item.total)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between pt-2 mt-1 border-t border-gray-200">
                <span className="text-sm font-semibold text-gray-900">Total</span>
                <span className="text-sm font-bold text-gray-900">{formatCurrency(selected.total)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Update Status</p>
              <div className="grid grid-cols-2 gap-2">
                {['confirmed', 'shipped', 'delivered', 'cancelled'].map((s) => (
                  <button
                    key={s}
                    className={cn('px-3 py-2 text-xs rounded-lg border capitalize font-medium', ORDER_STATUS_COLORS[s])}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Payment</p>
              <div className="grid grid-cols-2 gap-2">
                {['partial', 'paid', 'refunded'].map((s) => (
                  <button
                    key={s}
                    className={cn('px-3 py-2 text-xs rounded-lg border capitalize font-medium', PAYMENT_STATUS_COLORS[s])}
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
