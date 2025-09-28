import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { notify } from '@/lib/notify';

const STATUS_OPTIONS = ['draft', 'pending', 'under_review', 'approved', 'suspended', 'rejected'];
const VERIFICATION_STATUS = ['not_submitted', 'pending', 'in_review', 'verified', 'rejected'];

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const { items } = await api.get('/admin/sellers?limit=200');
      setSellers(items || []);
    } catch (err) {
      const message = err.message || 'Failed to load sellers';
      setError(message);
      notify.error(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function viewDetails(idOrSlug) {
    try {
      const data = await api.get(`/admin/sellers/${idOrSlug}`);
      setSelected(data);
    } catch (err) {
      notify.error(err.message || 'Failed to fetch seller details');
    }
  }

  async function updateStatus(id, payload) {
    try {
      const { seller } = await api.patch(`/admin/sellers/${id}/status`, payload);
      setSellers((prev) => prev.map((item) => (item._id === seller._id ? seller : item)));
      if (selected?.seller?._id === seller._id) {
        setSelected((prev) => ({ ...prev, seller }));
      }
      notify.success('Seller status updated');
    } catch (err) {
      notify.error(err.message || 'Failed to update seller');
    }
  }

  async function assignPlan(id, planId) {
    if (!planId) return;
    try {
      await api.post(`/admin/sellers/${id}/subscriptions`, { planId });
      notify.success('Subscription assigned');
      await viewDetails(id);
    } catch (err) {
      notify.error(err.message || 'Failed to assign plan');
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr] xl:grid-cols-[3fr_1.5fr]">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Sellers</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left">
                  <tr>
                    <th className="py-2 pr-3">Display name</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Verification</th>
                    <th className="py-2 pr-3">Submitted</th>
                    <th className="py-2 pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sellers.map((seller) => (
                    <tr key={seller._id} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-medium">{seller.displayName || '—'}</td>
                      <td className="py-2 pr-3">{seller.status}</td>
                      <td className="py-2 pr-3">{seller.verificationStatus}</td>
                      <td className="py-2 pr-3">{formatDate(seller.createdAt)}</td>
                      <td className="py-2 pr-3">
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => viewDetails(seller._id)}>
                            View
                          </Button>
                          {STATUS_OPTIONS.filter((status) => status !== seller.status).map((status) => (
                            <Button
                              key={status}
                              size="sm"
                              variant="ghost"
                              onClick={() => updateStatus(seller._id, { status })}
                            >
                              {status}
                            </Button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="h-max">
        <CardHeader>
          <CardTitle>Seller details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selected ? (
            <p className="text-sm text-muted-foreground">Select a seller to inspect their application.</p>
          ) : (
            <div className="space-y-4 text-sm">
              <section>
                <h3 className="text-xs font-semibold uppercase text-muted-foreground">Profile</h3>
                <p><strong>Name:</strong> {selected.seller.displayName}</p>
                <p><strong>Legal:</strong> {selected.seller.legalName || '—'}</p>
                <p><strong>Contact:</strong> {selected.seller.contact?.phone || '—'} · {selected.seller.contact?.email || '—'}</p>
                <p><strong>Verification:</strong> {selected.seller.verificationStatus}</p>
              </section>

              <section>
                <h3 className="text-xs font-semibold uppercase text-muted-foreground">Shop</h3>
                <p><strong>Name:</strong> {selected.shop?.name || '—'}</p>
                <p><strong>Tagline:</strong> {selected.shop?.tagLine || '—'}</p>
                <p className="line-clamp-3"><strong>Description:</strong> {selected.shop?.description || '—'}</p>
              </section>

              <section>
                <h3 className="text-xs font-semibold uppercase text-muted-foreground">Payout</h3>
                <p><strong>Method:</strong> {selected.seller.payout?.method || '—'}</p>
                <p><strong>Account:</strong> {selected.seller.payout?.accountName || '—'} · {selected.seller.payout?.accountNumber || '—'}</p>
              </section>

              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase text-muted-foreground">Update status</h3>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={selected.seller.status === status ? 'default' : 'outline'}
                      onClick={() => updateStatus(selected.seller._id, { status })}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {VERIFICATION_STATUS.map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={selected.seller.verificationStatus === status ? 'default' : 'outline'}
                      onClick={() => updateStatus(selected.seller._id, { verificationStatus: status })}
                    >
                      Verify: {status}
                    </Button>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-xs font-semibold uppercase text-muted-foreground">Assign subscription</h3>
                <AssignPlan onAssign={(planId) => assignPlan(selected.seller._id, planId)} />
              </section>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AssignPlan({ onAssign }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { plans } = await api.get('/subscription-plans');
        setPlans(plans || []);
      } catch (err) {
        notify.error(err.message || 'Failed to load plans');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Loading plans…</p>;
  if (!plans.length) return <p className="text-sm text-muted-foreground">No plans configured yet.</p>;

  return (
    <div className="flex flex-wrap gap-2">
      {plans.map((plan) => (
        <Button key={plan._id} size="sm" variant="outline" onClick={() => onAssign(plan._id)}>
          {plan.name}
        </Button>
      ))}
    </div>
  );
}
