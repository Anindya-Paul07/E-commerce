import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { notify } from '@/lib/notify';

const EMPTY = {
  name: '',
  code: '',
  description: '',
  price: 0,
  currency: 'USD',
  billingInterval: 'month',
  intervalCount: 1,
  trialDays: 0,
  isDefault: false,
  isBoostPlan: false,
  priorityBoost: 0,
};

export default function AdminSubscriptionsPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  async function load(activeOnly = false) {
    setLoading(true);
    try {
      const { plans } = await api.get(`/subscription-plans${activeOnly ? '' : '?active=false'}`);
      setPlans(plans || []);
    } catch (err) {
      notify.error(err.message || 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(true);
  }, []);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function createPlan(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        intervalCount: Number(form.intervalCount),
        trialDays: Number(form.trialDays),
        priorityBoost: Number(form.priorityBoost),
      };
      await api.post('/admin/subscriptions', payload);
      notify.success('Subscription plan created');
      setForm(EMPTY);
      await load(true);
    } catch (err) {
      notify.error(err.message || 'Failed to create plan');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(id, active) {
    try {
      await api.patch(`/admin/subscriptions/${id}`, { active });
      notify.success('Plan updated');
      await load(true);
    } catch (err) {
      notify.error(err.message || 'Failed to update plan');
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Active plans</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading plans…</p>
          ) : plans.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active plans yet.</p>
          ) : (
            <div className="space-y-3">
              {plans.map((plan) => (
                <div key={plan._id} className="rounded-md border p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold">{plan.name}</h3>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{plan.code}</p>
                    </div>
                    <div className="text-sm font-semibold">
                      {plan.currency} {plan.price}/{plan.billingInterval}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{plan.description || 'No description'}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>Trial: {plan.trialDays} days</span>
                    <span>Boost weight: {plan.priorityBoost}</span>
                    <span>{plan.isBoostPlan ? 'Boost plan' : 'Standard plan'}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => toggleActive(plan._id, false)}>
                      Archive
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create plan</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createPlan} className="grid gap-3">
            <input className="h-10 rounded-md border bg-background px-3" placeholder="Name" value={form.name} onChange={(e) => update('name', e.target.value)} required />
            <input className="h-10 rounded-md border bg-background px-3" placeholder="Code" value={form.code} onChange={(e) => update('code', e.target.value)} required />
            <textarea className="min-h-[80px] rounded-md border bg-background px-3 py-2" placeholder="Description" value={form.description} onChange={(e) => update('description', e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <input className="h-10 rounded-md border bg-background px-3" type="number" step="0.01" min={0} placeholder="Price" value={form.price} onChange={(e) => update('price', e.target.value)} required />
              <input className="h-10 rounded-md border bg-background px-3" placeholder="Currency" value={form.currency} onChange={(e) => update('currency', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select className="h-10 rounded-md border bg-background px-3" value={form.billingInterval} onChange={(e) => update('billingInterval', e.target.value)}>
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
                <option value="year">Yearly</option>
              </select>
              <input className="h-10 rounded-md border bg-background px-3" type="number" min={1} max={12} placeholder="Interval count" value={form.intervalCount} onChange={(e) => update('intervalCount', e.target.value)} />
            </div>
            <input className="h-10 rounded-md border bg-background px-3" type="number" min={0} placeholder="Trial days" value={form.trialDays} onChange={(e) => update('trialDays', e.target.value)} />
            <input className="h-10 rounded-md border bg-background px-3" type="number" min={0} max={10} step="0.1" placeholder="Priority boost" value={form.priorityBoost} onChange={(e) => update('priorityBoost', e.target.value)} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isBoostPlan} onChange={(e) => update('isBoostPlan', e.target.checked)} /> Boost placement plan
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isDefault} onChange={(e) => update('isDefault', e.target.checked)} /> Default plan
            </label>
            <Button disabled={saving}>{saving ? 'Creating…' : 'Create plan'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
