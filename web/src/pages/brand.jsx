import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function BrandsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    (async () => {
      setLoading(true); setErr('')
      try {
        const { items } = await api.get('/brands?status=active&limit=200&sort=sortOrder name')
        setItems(items || [])
      } catch (e) { setErr(e.message || 'Failed to load brands') }
      finally { setLoading(false) }
    })()
  }, [])

  return (
    <div className="container py-10 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Brands</h1>
      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {err && <p className="text-sm text-red-600">{err}</p>}
      {!loading && !err && !items.length && <p className="text-sm text-muted-foreground">No brands yet.</p>}

      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {items.map(b => (
          <Card key={b._id} className="group">
            <CardHeader className="pb-2">
              <CardTitle className="truncate">{b.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {b.logo
                ? <img src={b.logo} alt={b.name} className="aspect-[3/2] w-full rounded-md object-contain bg-muted p-2" />
                : <div className="aspect-[3/2] w-full rounded-md bg-muted" />
              }
              {b.website && (
                <a href={b.website} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-primary hover:underline">
                  Visit website
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}