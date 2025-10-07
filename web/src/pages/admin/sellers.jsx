import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import { notify } from '@/lib/notify'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Badge from '@/components/ui/badge'

const STATUS_OPTIONS = [
  { value: '', label: 'Any status' },
  { value: 'pending', label: 'Pending' },
  { value: 'under_review', label: 'Under review' },
  { value: 'approved', label: 'Approved' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'rejected', label: 'Rejected' },
]

const VERIFICATION_OPTIONS = [
  { value: '', label: 'Any verification' },
  { value: 'not_submitted', label: 'Not submitted' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_review', label: 'In review' },
  { value: 'verified', label: 'Verified' },
  { value: 'rejected', label: 'Rejected' },
]

const DEFAULT_FILTERS = Object.freeze({
  status: 'pending',
  verificationStatus: '',
  q: '',
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function buildQuery(filters) {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.verificationStatus) params.set('verificationStatus', filters.verificationStatus)
  if (filters.q?.trim()) params.set('q', filters.q.trim())
  const query = params.toString()
  return query ? `/admin/sellers?${query}` : '/admin/sellers'
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return dateFormatter.format(date)
}

export default function AdminSellerReviewPage() {
  const [filters, setFilters] = useState(() => ({ ...DEFAULT_FILTERS }))
  const [sellers, setSellers] = useState([])
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actioningId, setActioningId] = useState('')

  const hasItems = sellers.length > 0

  async function fetchSellers(nextFilters, { silent = false } = {}) {
    const resolvedFilters = nextFilters || filters
    if (!silent) setLoading(true)
    setError('')

    try {
      const path = buildQuery(resolvedFilters)
      const data = await api.get(path)
      setSellers(data.items || [])
      setMeta({
        total: data.total || 0,
        page: data.page || 1,
        pages: data.pages || 1,
      })
    } catch (err) {
      const message = err.message || 'Failed to load sellers'
      setError(message)
      notify.error(message)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    fetchSellers({ ...DEFAULT_FILTERS })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleFilterChange(event) {
    const { name, value } = event.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  function handleReset() {
    setFilters({ ...DEFAULT_FILTERS })
    fetchSellers({ ...DEFAULT_FILTERS })
  }

  function handleSubmit(event) {
    event.preventDefault()
    fetchSellers(filters)
  }

  async function handleDecision(id, payload) {
    setActioningId(id)
    try {
      await api.patch(`/admin/sellers/${id}/status`, payload)
      notify.success('Seller status updated')
      await fetchSellers(filters, { silent: true })
    } catch (err) {
      const message = err.message || 'Failed to update seller'
      notify.error(message)
    } finally {
      setActioningId('')
    }
  }

  const filterSummary = useMemo(() => {
    const parts = []
    if (filters.status) parts.push(`Status: ${filters.status.replace(/_/g, ' ')}`)
    if (filters.verificationStatus) parts.push(`Verification: ${filters.verificationStatus.replace(/_/g, ' ')}`)
    if (filters.q) parts.push(`Search: ${filters.q}`)
    return parts.join(' • ') || 'All sellers'
  }, [filters])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Seller review queue</h1>
        <p className="text-sm text-muted-foreground">
          Review new seller applications, adjust statuses, and keep onboarding flowing.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-5">
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="h-10 rounded-md border bg-background px-3"
              >
                {STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="verificationStatus">Verification</label>
              <select
                id="verificationStatus"
                name="verificationStatus"
                value={filters.verificationStatus}
                onChange={handleFilterChange}
                className="h-10 rounded-md border bg-background px-3"
              >
                {VERIFICATION_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-2 md:col-span-2">
              <label className="text-sm font-medium" htmlFor="q">Search</label>
              <input
                id="q"
                name="q"
                value={filters.q}
                onChange={handleFilterChange}
                placeholder="Search by display name, legal name, notes"
                className="h-10 rounded-md border bg-background px-3"
              />
            </div>

            <div className="flex items-end gap-2">
              <Button type="submit">Apply</Button>
              <Button type="button" variant="outline" onClick={handleReset}>Reset</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Queue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>{filterSummary}</span>
            <span>{meta.total} seller{meta.total === 1 ? '' : 's'} found</span>
          </div>

          {error && (
            <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </p>
          )}

          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map(row => (
                <div key={row} className="h-16 animate-pulse rounded-md border bg-muted/50" />
              ))}
            </div>
          ) : hasItems ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Seller</th>
                    <th className="px-3 py-2 font-medium">Contact</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Verification</th>
                    <th className="px-3 py-2 font-medium">Submitted</th>
                    <th className="px-3 py-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sellers.map(seller => {
                    const contactBits = []
                    if (seller.contact?.email) contactBits.push(seller.contact.email)
                    if (seller.contact?.phone) contactBits.push(seller.contact.phone)
                    const contact = contactBits.join(' • ') || seller.user?.email || '—'
                    const busy = actioningId === seller._id

                    return (
                      <tr key={seller._id} className="border-b last:border-b-0">
                        <td className="px-3 py-3 align-top">
                          <div className="font-medium text-foreground">{seller.displayName}</div>
                          <div className="text-xs text-muted-foreground">
                            {seller.legalName || '—'}
                          </div>
                        </td>
                        <td className="px-3 py-3 align-top text-sm text-muted-foreground">{contact}</td>
                        <td className="px-3 py-3 align-top">
                          <Badge>{(seller.status || 'unknown').replace(/_/g, ' ')}</Badge>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <Badge variant="outline">{(seller.verificationStatus || 'unknown').replace(/_/g, ' ')}</Badge>
                        </td>
                        <td className="px-3 py-3 align-top text-sm text-muted-foreground">{formatDate(seller.createdAt)}</td>
                        <td className="px-3 py-3 align-top">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() => handleDecision(seller._id, {
                                status: 'under_review',
                                verificationStatus: seller.verificationStatus === 'verified' ? 'verified' : 'in_review',
                              })}
                            >
                              Mark review
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() => handleDecision(seller._id, {
                                status: 'rejected',
                                verificationStatus: 'rejected',
                              })}
                            >
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              disabled={busy}
                              onClick={() => handleDecision(seller._id, {
                                status: 'approved',
                                verificationStatus: 'verified',
                              })}
                            >
                              Approve
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-md border border-dashed border-muted px-4 py-8 text-center text-sm text-muted-foreground">
              No sellers match these filters yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
