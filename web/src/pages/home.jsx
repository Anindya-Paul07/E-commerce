import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Badge from "@/components/ui/badge"

export default function Home() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const { items } = await api.get('/products?limit=8&status=active&sort=-createdAt')
        setItems(items)
      } catch (e) {
        setErr(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <div className="container space-y-10 py-10">
      {/* Hero */}
      <section className="rounded-lg bg-gradient-to-r from-muted to-transparent p-8">
        <h2 className="text-3xl font-bold tracking-tight">End-of-Season Sale</h2>
        <p className="mt-1 text-muted-foreground">Up to 40% off on selected styles.</p>
        <div className="mt-6 flex gap-3">
          <Button>Shop now</Button>
          <Button variant="outline">Explore categories</Button>
        </div>
      </section>

      {/* Products */}
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h3 className="text-xl font-semibold">Featured</h3>
          <Button asChild variant="link" className="px-0">
            <Link to="/">View all</Link>
          </Button>
        </div>

        {loading && <p className="text-sm text-muted-foreground">Loading products…</p>}
        {err && <p className="text-sm text-red-600">{err}</p>}

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
                  <div className="aspect-square w-full rounded-md bg-muted/60 group-hover:bg-muted transition-colors" />
                </Link>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-semibold">${Number(p.price).toFixed(2)}</span>
                  <Button size="sm">Add to cart</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
