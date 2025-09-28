import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Badge from '@/components/ui/badge'

function formatPrice(n) {
  const num = Number(n)
  return Number.isFinite(num) ? num.toFixed(2) : '0.00'
}

export default function ProductPage() {
  const { slug } = useParams()
  const [product, setProduct] = useState(null)
  const [variants, setVariants] = useState([])
  const [listings, setListings] = useState([])
  const [selectedListingId, setSelectedListingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setErr('')
    api.get(`/catalog/listings/${slug}`)
      .then(({ product, listings, variants }) => {
        if (!active) return
        setProduct(product)
        setListings(listings || [])
        setVariants(variants || [])
        if ((listings || []).length) setSelectedListingId(listings[0]._id)
      })
      .catch((e) => { if (active) setErr(e.message || 'Failed to load product') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [slug])

  const selectedListing = useMemo(
    () => listings.find((listing) => listing._id === selectedListingId) || null,
    [listings, selectedListingId]
  )

  const offerIndexByVariant = useMemo(() => {
    const map = new Map()
    if (selectedListing?.offers) {
      selectedListing.offers.forEach((offer) => {
        const variantId = offer.variant?._id || offer.variant
        map.set(String(variantId), offer)
      })
    }
    return map
  }, [selectedListing])

  if (loading) return <div className="container py-10">Loading…</div>
  if (err) return <div className="container py-10 text-red-600">{err}</div>
  if (!product) return <div className="container py-10">Not found</div>

  return (
    <div className="container py-10 grid gap-8 lg:grid-cols-2">
      <Card>
        <CardContent className="p-4">
          {product?.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="aspect-square w-full rounded-md object-cover bg-muted"
            />
          ) : (
            <div className="aspect-square w-full rounded-md bg-muted" />
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
          {product.brand && <Badge>{product.brand}</Badge>}
        </div>

        {selectedListing && (
          <div className="text-xl font-semibold flex items-center gap-2">
            {selectedListing.seller?.displayName && (
              <span className="text-sm font-medium text-muted-foreground">
                Sold by {selectedListing.seller.displayName}
              </span>
            )}
            {selectedListing.offers?.[0] && (
              <span>${formatPrice(selectedListing.offers[0].price)}</span>
            )}
          </div>
        )}

        <p className="text-muted-foreground">
          {product.description || 'No description provided.'}
        </p>

        {listings.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Available sellers</div>
            <div className="flex flex-wrap gap-2">
              {listings.map((listing) => (
                <Button
                  key={listing._id}
                  type="button"
                  variant={listing._id === selectedListingId ? 'default' : 'outline'}
                  onClick={() => setSelectedListingId(listing._id)}
                >
                  {listing.seller?.displayName || 'Seller'} · {formatPrice(listing.offers?.[0]?.price)}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-md border p-4">
          <div className="mb-3 text-sm font-medium">SKUs & pricing</div>
          {variants.length === 0 ? (
            <div className="text-sm text-muted-foreground">No active variants</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="pb-2">SKU</th>
                  <th className="pb-2">Title</th>
                  <th className="pb-2">Price</th>
                  <th className="pb-2">Stock</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((variant) => {
                  const offer = offerIndexByVariant.get(String(variant._id));
                  return (
                    <tr key={variant._id} className="border-t">
                      <td className="py-2 font-mono text-xs">{variant.sku}</td>
                      <td className="py-2">{variant.title || '-'}</td>
                      <td className="py-2">{offer ? `$${formatPrice(offer.price)}` : '-'}</td>
                      <td className="py-2">{offer?.stock ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {selectedListing && (
            <p className="mt-3 text-xs text-muted-foreground">
              Inventory reflects the selected seller's offer.
            </p>
          )}
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
