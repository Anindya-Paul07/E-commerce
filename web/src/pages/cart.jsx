import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function CartPage() {
  const [cart, setCart] = useState(null)
  const [subtotal, setSubtotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [placing, setPlacing] = useState(false)
  const [placed, setPlaced] = useState(null)

  const [addr, setAddr] = useState({
    fullName: '', phone: '', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'US'
  })

  async function load() {
    setLoading(true); setErr('')
    try {
      const { cart, subtotal } = await api.get('/cart')
      setCart(cart); setSubtotal(subtotal)
    } catch (e) { setErr(e.message || 'Failed to load cart') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function updateQty(productId, qty) {
    try {
      const { cart, subtotal } = await api.patch(`/cart/item/${productId}`, { qty })
      setCart(cart); setSubtotal(subtotal)
    } catch (e) { alert(e.message) }
  }
  async function removeItem(productId) {
    try {
      const { cart, subtotal } = await api.delete(`/cart/item/${productId}`)
      setCart(cart); setSubtotal(subtotal)
    } catch (e) { alert(e.message) }
  }
  async function clear() {
    if (!confirm('Clear cart?')) return
    const { cart, subtotal } = await api.delete('/cart')
    setCart(cart); setSubtotal(subtotal)
  }
  async function placeOrder(e) {
    e.preventDefault()
    setPlacing(true); setErr('')
    try {
      const { order } = await api.post('/orders/checkout', {
        shippingAddress: addr,
        paymentMethod: 'cod'
      })
      setPlaced(order)
      await load()
    } catch (e) { setErr(e.message || 'Checkout failed') }
    finally { setPlacing(false) }
  }

  return (
    <div className="container py-10 space-y-6">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Your Cart</h1>
        {cart?.items?.length ? <Button variant="outline" onClick={clear}>Clear cart</Button> : null}
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {err && <p className="text-sm text-red-600">{err}</p>}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Items</CardTitle></CardHeader>
          <CardContent>
            {!cart?.items?.length ? (
              <p className="text-sm text-muted-foreground">Your cart is empty.</p>
            ) : (
              <div className="space-y-4">
                {cart.items.map(it => (
                  <div key={String(it.product)} className="flex items-center gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={it.image || ''} alt="" className="h-16 w-16 rounded-md object-cover border" />
                    <div className="flex-1">
                      <div className="font-medium">{it.title}</div>
                      <div className="text-sm text-muted-foreground">${Number(it.price).toFixed(2)}</div>
                    </div>
                    <input
                      type="number" min={1}
                      value={it.qty}
                      onChange={(e) => updateQty(it.product, Math.max(1, Number(e.target.value)))}
                      className="h-9 w-20 rounded-md border bg-background px-2"
                    />
                    <Button size="sm" variant="destructive" onClick={() => removeItem(it.product)}>Remove</Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="font-semibold">${Number(subtotal).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Shipping</span>
              <span className="font-semibold">$0.00</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tax</span>
              <span className="font-semibold">$0.00</span>
            </div>
            <div className="flex items-center justify-between border-t pt-2">
              <span className="text-sm">Total</span>
              <span className="text-lg font-semibold">${Number(subtotal).toFixed(2)}</span>
            </div>

            <form onSubmit={placeOrder} className="mt-4 space-y-2">
              <div className="text-sm font-medium">Shipping address</div>
              <input className="h-9 w-full rounded-md border bg-background px-3" placeholder="Full name"
                value={addr.fullName} onChange={e=>setAddr({...addr, fullName:e.target.value})} required />
              <input className="h-9 w-full rounded-md border bg-background px-3" placeholder="Phone"
                value={addr.phone} onChange={e=>setAddr({...addr, phone:e.target.value})} required />
              <input className="h-9 w-full rounded-md border bg-background px-3" placeholder="Address line 1"
                value={addr.line1} onChange={e=>setAddr({...addr, line1:e.target.value})} required />
              <input className="h-9 w-full rounded-md border bg-background px-3" placeholder="Address line 2 (optional)"
                value={addr.line2} onChange={e=>setAddr({...addr, line2:e.target.value})} />
              <div className="grid grid-cols-2 gap-2">
                <input className="h-9 rounded-md border bg-background px-3" placeholder="City"
                  value={addr.city} onChange={e=>setAddr({...addr, city:e.target.value})} required />
                <input className="h-9 rounded-md border bg-background px-3" placeholder="State/Province"
                  value={addr.state} onChange={e=>setAddr({...addr, state:e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input className="h-9 rounded-md border bg-background px-3" placeholder="Postal code"
                  value={addr.postalCode} onChange={e=>setAddr({...addr, postalCode:e.target.value})} required />
                <input className="h-9 rounded-md border bg-background px-3" placeholder="Country"
                  value={addr.country} onChange={e=>setAddr({...addr, country:e.target.value})} required />
              </div>

              <Button disabled={placing || !cart?.items?.length}>
                {placing ? 'Placing…' : 'Place order'}
              </Button>
              {err && <p className="text-sm text-red-600">{err}</p>}
              {placed && (
                <p className="text-sm text-green-700 mt-2">
                  Order <span className="font-semibold">{placed.number}</span> created!
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
// Note: Checkout is simplified for demo purposes. In production, we will integrate a proper payment gateway.