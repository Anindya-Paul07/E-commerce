import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Badge from '@/components/ui/badge'
import { notify } from '@/lib/notify'
import { useAppDispatch } from '@/store/hooks'
import { addToCart as addToCartThunk } from '@/store/slices/cartSlice'

function formatPrice(n) {
  const num = Number(n)
  return Number.isFinite(num) ? num.toFixed(2) : '0.00'
}

export default function ProductPage() {
  const { slug } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [adding, setAdding] = useState(false)
  const [availability, setAvailability] = useState(null)
  const [availLoading, setAvailLoading] = useState(true)
  const [availErr, setAvailErr] = useState('')
  const dispatch = useAppDispatch()

  useEffect(() => {
    let active = true
    setLoading(true)
    setErr('')
    api.get(`/products/${slug}`)
      .then(({ product }) => { if (active) setProduct(product) })
      .catch((e) => { if (active) setErr(e.message || 'Failed to load product') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [slug])

  // Load computed availability (on-hand, reserved, available)
  useEffect(() => {
    let active = true
    setAvailLoading(true)
    setAvailErr('')
    api.get(`/products/${slug}/stock`)
      .then((data) => { if (active) setAvailability(data) })
      .catch((e) => { if (active) setAvailErr(e.message || 'Failed to load availability') })
      .finally(() => { if (active) setAvailLoading(false) })
    return () => { active = false }
  }, [slug])

  async function addToCart() {
    if (!product?._id) return
    setAdding(true)
    try {
      await dispatch(addToCartThunk({ productId: product._id, qty: 1 }))
      notify.success('Added to cart')
    } catch (e) {
      notify.error(e.message || 'Failed to add to cart')
    } finally {
      setAdding(false)
    }
  }

  if (loading) return <div className="container py-10">Loading…</div>
  if (err) return <div className="container py-10 text-red-600">{err}</div>
  if (!product) return <div className="container py-10">Not found</div>

  return (
    <div className="container py-10 grid gap-8 lg:grid-cols-2">
      <Card>
        <CardContent className="p-4">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.title}
              className="aspect-square w-full rounded-md object-cover bg-muted"
            />
          ) : (
            <div className="aspect-square w-full rounded-md bg-muted" />
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{product.title}</h1>
          {product.tags?.[0] && <Badge>{product.tags[0]}</Badge>}
        </div>

        <div className="text-xl font-semibold">${formatPrice(product.price)}</div>

        <p className="text-muted-foreground">
          {product.description || 'No description provided.'}
        </p>

        <div className="flex items-center gap-3">
          <Button onClick={addToCart} disabled={adding}>
            {adding ? 'Adding…' : 'Add to cart'}
          </Button>
          <Button variant="outline">Buy now</Button>
        </div>

        <div className="text-sm text-muted-foreground">
          {availLoading ? 'Checking stock…' : availErr ? 'Availability unavailable' : `Available: ${availability?.available ?? 0}`}
        </div>

        {product.images?.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {product.images.slice(1).map((u) => (
              <img key={u} src={u} alt="" className="h-16 w-16 rounded-md object-cover border" />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
