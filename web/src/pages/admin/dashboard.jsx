import { useEffect, useMemo, useState } from 'react'
import { data, Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { useSession } from '@/context/SessionContext'
import { notify } from '@/lib/notify'

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
})

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, userLoading, logout } = useSession()
  const [stats, setStats] = useState({ orders: 0, products: 0, users: 0, revenue: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (userLoading) return
    if (!user?.roles?.includes('admin')) {
      setLoading(false)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError('')

    api.get('/stats', { signal: controller.signal })
      .then((data) => {
        setStats({
          orders: data.orders ?? 0,
          products: data.products ?? 0,
          users: data.users ?? 0,
          revenue: data.revenue ?? 0,
        })
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        setError(err.message || 'Failed to load stats')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [user, userLoading])

  const cards = useMemo(() => ([
    { label: 'Orders', value: stats.orders.toLocaleString() },
    { label: 'Products', value: stats.products.toLocaleString() },
    { label: 'Customers', value: stats.users.toLocaleString() },
    { label: 'Revenue', value: formatter.format(stats.revenue) },
  ]), [stats])

  async function handleLogout() {
    await logout()
    notify.info('Signed out')
    navigate('/', { replace: true })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Button asChild><Link to="/admin/products">Manage Products</Link></Button>
          <Button asChild variant="outline"><Link to="/admin/categories">Manage Categories</Link></Button>
          <Button asChild variant="outline"><Link to="/admin/inventory">Manage Inventory</Link></Button>
          <Button variant="ghost" onClick={handleLogout}>Logout</Button>
        </div>
      </div>

     {error && <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label} className="bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="skeleton h-9 w-20 rounded" />
              ) : (
                <div className="text-3xl font-semibold">{card.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">Use the buttons above to jump into your catalog CMS.</p>
    </div>
  )
}
