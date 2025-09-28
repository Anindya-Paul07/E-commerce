import { useEffect, useMemo, useState } from 'react';
import SellerGate from '@/components/SellerGate';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { notify } from '@/lib/notify';

const emptyCreateForm = {
  catalogProductId: '',
  status: 'draft',
  titleOverride: '',
  descriptionOverride: '',
  offersByVariant: {},
};

function toOfferMap(listing) {
  if (!listing?.offers) return {};
  return listing.offers.reduce((acc, offer) => {
    const variantId = offer.variant?._id || offer.variant;
    acc[variantId] = {
      price: offer.price ?? '',
      compareAtPrice: offer.compareAtPrice ?? '',
      stock: offer.stock ?? 0,
      inventoryPolicy: offer.inventoryPolicy || 'track',
    };
    return acc;
  }, {});
}

function buildOffersFromMap(map) {
  return Object.entries(map)
    .map(([variant, values]) => ({
      variant,
      price: Number(values.price),
      compareAtPrice:
        values.compareAtPrice === '' || values.compareAtPrice == null ? undefined : Number(values.compareAtPrice),
      stock: Number(values.stock || 0),
      inventoryPolicy: values.inventoryPolicy || 'track',
    }))
    .filter((offer) => offer.variant && Number.isFinite(offer.price));
}

function formatPrice(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '-';
  return `$${num.toFixed(2)}`;
}

export default function SellerListingsPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const [catalogProducts, setCatalogProducts] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [createVariants, setCreateVariants] = useState([]);
  const [creating, setCreating] = useState(false);

  const selectedListing = useMemo(
    () => listings.find((listing) => listing._id === selectedId) || null,
    [listings, selectedId]
  );

  useEffect(() => {
    fetchListings();
    fetchCatalog();
  }, []);

  async function fetchListings() {
    setLoading(true);
    try {
      const data = await api.get('/sellers/listings');
      const items = data.items || [];
      setListings(items);
      if (items.length && !selectedId) {
        setSelectedId(items[0]._id);
        setEditing({ ...items[0], offersByVariant: toOfferMap(items[0]) });
      }
    } catch (error) {
      notify.error(error.message || 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  }

  async function fetchCatalog() {
    setCatalogLoading(true);
    try {
      const data = await api.get('/catalog/products?limit=50&status=active&moderationState=approved');
      setCatalogProducts(data.items || []);
    } catch (error) {
      notify.error(error.message || 'Failed to load catalog');
    } finally {
      setCatalogLoading(false);
    }
  }

  async function handleSelectListing(listing) {
    setSelectedId(listing._id);
    setEditing({ ...listing, offersByVariant: toOfferMap(listing) });
  }

  function updateEditField(field, value) {
    setEditing((prev) => ({ ...prev, [field]: value }));
  }

  function updateEditOffer(variantId, field, value) {
    setEditing((prev) => ({
      ...prev,
      offersByVariant: {
        ...prev.offersByVariant,
        [variantId]: {
          ...prev.offersByVariant[variantId],
          [field]: value,
        },
      },
    }));
  }

  async function saveListing() {
    if (!editing?._id) return;
    setSaving(true);
    try {
      const payload = {
        status: editing.status,
        titleOverride: editing.titleOverride,
        descriptionOverride: editing.descriptionOverride,
        offers: buildOffersFromMap(editing.offersByVariant),
      };
      await api.patch(`/sellers/listings/${editing._id}`, payload);
      notify.success('Listing updated');
      await fetchListings();
    } catch (error) {
      notify.error(error.message || 'Failed to update listing');
    } finally {
      setSaving(false);
    }
  }

  async function deleteListing(listingId) {
    if (!window.confirm('Remove this listing?')) return;
    try {
      await api.delete(`/sellers/listings/${listingId}`);
      notify.success('Listing deleted');
      setSelectedId(null);
      await fetchListings();
    } catch (error) {
      notify.error(error.message || 'Failed to remove listing');
    }
  }

  async function onSelectCatalogProduct(productId) {
    setCreateForm((prev) => ({ ...prev, catalogProductId: productId }));
    if (!productId) {
      setCreateVariants([]);
      return;
    }
    try {
      const data = await api.get(`/catalog/products/${productId}`);
      const variants = data.variants || [];
      setCreateVariants(variants);
      const offerMap = variants.reduce((acc, variant) => {
        acc[variant._id] = { price: '', compareAtPrice: '', stock: 0, inventoryPolicy: 'track' };
        return acc;
      }, {});
      setCreateForm((prev) => ({ ...prev, offersByVariant: offerMap }));
    } catch (error) {
      notify.error(error.message || 'Failed to load variants');
    }
  }

  function updateCreateOffer(variantId, field, value) {
    setCreateForm((prev) => ({
      ...prev,
      offersByVariant: {
        ...prev.offersByVariant,
        [variantId]: {
          ...prev.offersByVariant[variantId],
          [field]: value,
        },
      },
    }));
  }

  async function submitCreate(event) {
    event.preventDefault();
    if (!createForm.catalogProductId) {
      notify.error('Select a catalog product first');
      return;
    }
    setCreating(true);
    try {
      const offers = buildOffersFromMap(createForm.offersByVariant);
      if (!offers.length) throw new Error('Provide a price for at least one SKU');
      const payload = {
        catalogProductId: createForm.catalogProductId,
        status: createForm.status,
        titleOverride: createForm.titleOverride,
        descriptionOverride: createForm.descriptionOverride,
        offers,
      };
      await api.post('/sellers/listings', payload);
      notify.success('Listing submitted for review');
      setCreateForm(emptyCreateForm);
      setCreateVariants([]);
      await fetchListings();
    } catch (error) {
      notify.error(error.message || 'Failed to create listing');
    } finally {
      setCreating(false);
    }
  }

  return (
    <SellerGate>
      <div className="container space-y-6 py-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">My listings</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage marketplace listings based on the shared product catalog.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <Card className="h-fit max-h-[70vh] overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base">Listings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 overflow-y-auto">
              {loading && <div className="text-sm text-muted-foreground">Loading listings…</div>}
              {!loading && listings.length === 0 && (
                <div className="text-sm text-muted-foreground">You have not created any listings yet.</div>
              )}
              <div className="space-y-2">
                {listings.map((listing) => (
                  <button
                    key={listing._id}
                    type="button"
                    onClick={() => handleSelectListing(listing)}
                    className={`w-full rounded-md border px-3 py-2 text-left text-sm transition hover:bg-muted ${
                      selectedId === listing._id ? 'border-primary bg-primary/10 text-primary' : ''
                    }`}
                  >
                    <div className="font-medium">{listing.catalogProduct?.name || 'Catalog product'}</div>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-1">
                      <span>{listing.status}</span>
                      <span>•</span>
                      <span>{listing.offers?.length || 0} SKUs</span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Create listing</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="grid gap-3" onSubmit={submitCreate}>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium" htmlFor="catalog-product-select">Catalog product *</label>
                    <select
                      id="catalog-product-select"
                      value={createForm.catalogProductId}
                      onChange={(event) => onSelectCatalogProduct(event.target.value)}
                      className="h-10 rounded-md border px-3"
                    >
                      <option value="">Select catalog product</option>
                      {catalogLoading && <option value="" disabled>Loading…</option>}
                      {catalogProducts.map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.name} ({product.brand || 'Unbranded'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Status</label>
                      <select
                        value={createForm.status}
                        onChange={(event) => setCreateForm((prev) => ({ ...prev, status: event.target.value }))}
                        className="h-10 rounded-md border px-3"
                      >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Title override</label>
                    <input
                      value={createForm.titleOverride}
                      onChange={(event) => setCreateForm((prev) => ({ ...prev, titleOverride: event.target.value }))}
                      className="h-10 rounded-md border px-3"
                      placeholder="Optional"
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Description override</label>
                    <textarea
                      value={createForm.descriptionOverride}
                      onChange={(event) =>
                        setCreateForm((prev) => ({ ...prev, descriptionOverride: event.target.value }))
                      }
                      className="min-h-[80px] rounded-md border px-3 py-2"
                      placeholder="Optional"
                    />
                  </div>

                  {createForm.catalogProductId && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Variant pricing</div>
                      <div className="space-y-2">
                        {createVariants.map((variant) => {
                          const entry = createForm.offersByVariant[variant._id] || {
                            price: '',
                            compareAtPrice: '',
                            stock: 0,
                          };
                          return (
                            <div key={variant._id} className="rounded-md border p-3">
                              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                                <div>
                                  <div className="font-medium">{variant.title || variant.sku}</div>
                                  <div className="text-xs text-muted-foreground">SKU: {variant.sku}</div>
                                </div>
                                <div className="grid gap-2 md:grid-cols-3">
                                  <input
                                    value={entry.price}
                                    onChange={(event) => updateCreateOffer(variant._id, 'price', event.target.value)}
                                    placeholder="Price"
                                    className="h-10 rounded-md border px-3"
                                  />
                                  <input
                                    value={entry.compareAtPrice}
                                    onChange={(event) =>
                                      updateCreateOffer(variant._id, 'compareAtPrice', event.target.value)
                                    }
                                    placeholder="Compare at"
                                    className="h-10 rounded-md border px-3"
                                  />
                                  <input
                                    value={entry.stock}
                                    onChange={(event) => updateCreateOffer(variant._id, 'stock', event.target.value)}
                                    placeholder="Stock"
                                    className="h-10 rounded-md border px-3"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="text-right">
                    <Button type="submit" disabled={creating}>
                      {creating ? 'Submitting…' : 'Submit listing'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="min-h-[300px]">
              <CardHeader>
                <CardTitle className="text-base">
                  {selectedListing?.catalogProduct?.name || 'Select a listing to edit'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedListing && <div className="text-sm text-muted-foreground">Select a listing to manage.</div>}
                {selectedListing && editing && (
                  <div className="space-y-4">
                    <div className="grid gap-2 md:grid-cols-2">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Status</label>
                        <select
                          value={editing.status}
                          onChange={(event) => updateEditField('status', event.target.value)}
                          className="h-10 rounded-md border px-3"
                        >
                          <option value="draft">Draft</option>
                          <option value="active">Active</option>
                          <option value="paused">Paused</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Title override</label>
                      <input
                        value={editing.titleOverride || ''}
                        onChange={(event) => updateEditField('titleOverride', event.target.value)}
                        className="h-10 rounded-md border px-3"
                      />
                    </div>

                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Description override</label>
                      <textarea
                        value={editing.descriptionOverride || ''}
                        onChange={(event) => updateEditField('descriptionOverride', event.target.value)}
                        className="min-h-[80px] rounded-md border px-3 py-2"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Offers</div>
                      <div className="space-y-3">
                        {selectedListing.offers?.map((offer) => {
                          const variantId = offer.variant?._id || offer.variant;
                          const entry = editing.offersByVariant?.[variantId] || {
                            price: '',
                            compareAtPrice: '',
                            stock: 0,
                          };
                          return (
                            <div key={variantId} className="rounded-md border p-3">
                              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                                <div>
                                  <div className="font-medium">{offer.variant?.title || offer.variant?.sku}</div>
                                  <div className="text-xs text-muted-foreground">SKU: {offer.variant?.sku || variantId}</div>
                                  <div className="text-xs text-muted-foreground">Current price: {formatPrice(offer.price)}</div>
                                </div>
                                <div className="grid gap-2 md:grid-cols-3">
                                  <input
                                    value={entry.price}
                                    onChange={(event) => updateEditOffer(variantId, 'price', event.target.value)}
                                    placeholder="Price"
                                    className="h-10 rounded-md border px-3"
                                  />
                                  <input
                                    value={entry.compareAtPrice}
                                    onChange={(event) => updateEditOffer(variantId, 'compareAtPrice', event.target.value)}
                                    placeholder="Compare at"
                                    className="h-10 rounded-md border px-3"
                                  />
                                  <input
                                    value={entry.stock}
                                    onChange={(event) => updateEditOffer(variantId, 'stock', event.target.value)}
                                    placeholder="Stock"
                                    className="h-10 rounded-md border px-3"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button type="button" variant="outline" onClick={() => deleteListing(selectedListing._id)}>
                        Delete listing
                      </Button>
                      <Button type="button" onClick={saveListing} disabled={saving}>
                        {saving ? 'Saving…' : 'Save changes'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SellerGate>
  );
}
