import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { notify } from '@/lib/notify'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
})

const DEFAULT_STATS = {
  orders: { total: 0, itemsSold: 0, pendingFulfillment: 0, grossRevenue: 0 },
  listings: { total: 0, active: 0 },
  inventory: { totalOnHand: 0, totalReserved: 0, lowStock: 0 },
}

export default function SellerDashboard() {
  const [stats, setStats] = useState(DEFAULT_STATS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    api.get('/sellers/stats', { signal: controller.signal })
      .then((data) => {
        setStats({
          orders: { ...DEFAULT_STATS.orders, ...data.orders },
          listings: { ...DEFAULT_STATS.listings, ...data.listings },
          inventory: { ...DEFAULT_STATS.inventory, ...data.inventory },
        })
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        const message = err.message || 'Failed to load seller stats'
        setError(message)
        notify.error(message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [])

  const cards = useMemo(() => ([
    { label: 'Total orders', value: stats.orders.total.toLocaleString() },
    { label: 'Items sold', value: stats.orders.itemsSold.toLocaleString() },
    { label: 'Pending fulfilment', value: stats.orders.pendingFulfillment.toLocaleString() },
    { label: 'Revenue', value: currency.format(stats.orders.grossRevenue) },
  ]), [stats.orders])

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Seller Overview</h1>
          <p className="text-sm text-muted-foreground">
            Track recent orders and catalogue health at a glance.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/admin/inventory">Manage inventory</Link>
          </Button>
          <Button asChild>
            <Link to="/seller/cms">Customize storefront</Link>
          </Button>
        </div>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label} className="bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="skeleton h-9 w-24 rounded" />
              ) : (
                <div className="text-2xl font-semibold">{card.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Listings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {loading ? (
              <div className="skeleton h-5 w-32 rounded" />
            ) : (
              <ul className="space-y-1">
                <li>Total listings: <strong>{stats.listings.total}</strong></li>
                <li>Active listings: <strong>{stats.listings.active}</strong></li>
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {loading ? (
              <div className="skeleton h-5 w-32 rounded" />
            ) : (
              <ul className="space-y-1">
                <li>Total on hand: <strong>{stats.inventory.totalOnHand}</strong></li>
                <li>Reserved units: <strong>{stats.inventory.totalReserved}</strong></li>
                <li>Low stock SKUs: <strong>{stats.inventory.lowStock}</strong></li>
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
