import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

export default function Dashboard() {
  const [stats, setStats] = useState({ orders: null, products: null, users: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    api.get('/admin/stats')
      .then(data => { if (active) setStats(data || {}) })
      .catch(err => { if (active) setError(err.message || 'Failed to load stats') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const formatCount = (value) => {
    if (value == null) return loading ? '—' : '0'
    return new Intl.NumberFormat().format(value)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Button asChild><Link to="/admin/products">Manage Products</Link></Button>
          <Button asChild variant="outline"><Link to="/admin/categories">Manage Categories</Link></Button>
          <Button asChild variant="outline"><Link to="/admin/inventory">Manage Inventory</Link></Button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Orders</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold">{formatCount(stats.orders)}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Products</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold">{formatCount(stats.products)}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Users</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold">{formatCount(stats.users)}</CardContent>
        </Card>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <p className="text-sm text-muted-foreground">Use the buttons above to jump into your catalog CMS.</p>
    </div>
  )
}
