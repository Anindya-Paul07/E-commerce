import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Badge from '@/components/ui/badge'

export default function CategoryPage() {
  const { slug } = useParams()
  const [category, setCategory] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true); setErr('')
    // You can use either categories/:slug/products OR products?category=:slug
    api.get(`/categories/${slug}/products?limit=24`)
      .then(({ items, category }) => { if (active) { setItems(items || []); setCategory(category) } })
      .catch((e) => { if (active) setErr(e.message || 'Failed to load') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [slug])

  if (loading) return <div className="container py-10">Loading…</div>
  if (err) return <div className="container py-10 text-red-600">{err}</div>

  return (
    <div className="container space-y-6 py-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{category?.name || 'Category'}</h1>
        {category?.description && <p className="text-sm text-muted-foreground">{category.description}</p>}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(p => (
          <Card key={p._id} className="group">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="truncate">
                  <Link to={`/product/${p.slug}`} className="hover:underline">{p.title}</Link>
                </CardTitle>
                {p.tags?.[0] && <Badge>{p.tags[0]}</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              <Link to={`/product/${p.slug}`}>
                {p.images?.[0]
                  ? <img src={p.images[0]} alt={p.title} className="aspect-square w-full rounded-md object-cover bg-muted/40" />
                  : <div className="aspect-square w-full rounded-md bg-muted/60" />}
              </Link>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-semibold">${Number(p.price).toFixed(2)}</span>
                <Button size="sm">Add to cart</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">No products in this category yet.</p>
      )}
    </div>
  )
}
