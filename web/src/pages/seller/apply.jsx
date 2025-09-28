import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { notify } from '@/lib/notify';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchSession } from '@/store/slices/sessionSlice';

const EMPTY = {
  displayName: '',
  legalName: '',
  phone: '',
  supportEmail: '',
  warehouseInstructions: '',
  nidNumber: '',
  selfieUrl: '',
  payoutMethod: 'bank_transfer',
  accountName: '',
  accountNumber: '',
  bankName: '',
  bankBranch: '',
  notes: '',
  shopName: '',
  shopTagline: '',
  shopDescription: '',
};

export default function SellerApplicationPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.session.user);
  const sessionStatus = useAppSelector((state) => state.session.status);

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isVerifiedSeller = useMemo(() => user?.roles?.includes('seller'), [user]);

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (!user) {
      navigate('/login', { replace: true, state: { next: '/seller/apply' } });
      return;
    }
    (async () => {
      try {
        const { seller, shop } = await api.get('/sellers/me');
        if (seller) {
          setForm({
            displayName: seller.displayName || '',
            legalName: seller.legalName || '',
            phone: seller.contact?.phone || '',
            supportEmail: seller.contact?.supportEmail || seller.contact?.email || '',
            warehouseInstructions: seller.warehousePreferences?.inboundInstructions || '',
            nidNumber: seller.kyc?.nidNumber || '',
            selfieUrl: seller.kyc?.selfieUrl || '',
            payoutMethod: seller.payout?.method || 'bank_transfer',
            accountName: seller.payout?.accountName || '',
            accountNumber: seller.payout?.accountNumber || '',
            bankName: seller.payout?.bankName || '',
            bankBranch: seller.payout?.bankBranch || '',
            notes: seller.notes || '',
            shopName: shop?.name || seller.displayName || '',
            shopTagline: shop?.tagLine || '',
            shopDescription: shop?.description || '',
          });
        }
      } catch (err) {
        // ignore 404 (no profile yet)
      } finally {
        setLoading(false);
      }
    })();
  }, [user, sessionStatus, navigate]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submitApplication(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        displayName: form.displayName,
        legalName: form.legalName,
        contact: {
          phone: form.phone,
          email: user?.email,
          supportEmail: form.supportEmail,
        },
        warehousePreferences: {
          inboundInstructions: form.warehouseInstructions,
        },
        kyc: {
          nidNumber: form.nidNumber,
          selfieUrl: form.selfieUrl,
        },
        payout: {
          method: form.payoutMethod,
          accountName: form.accountName,
          accountNumber: form.accountNumber,
          bankName: form.bankName,
          bankBranch: form.bankBranch,
        },
        notes: form.notes,
        shop: {
          name: form.shopName || form.displayName,
          tagLine: form.shopTagline,
          description: form.shopDescription,
        },
      };

      await api.post('/sellers/apply', payload);
      notify.success('Seller application submitted. We will review it shortly.');
      await dispatch(fetchSession());
    } catch (err) {
      const message = err.message || 'Failed to submit application';
      setError(message);
      notify.error(message);
    } finally {
      setSaving(false);
    }
  }

  if (sessionStatus === 'loading' || loading) {
    return <div className="container py-10 text-sm text-muted-foreground">Loading seller profile…</div>;
  }

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Become a Seller</h1>
          <p className="text-sm text-muted-foreground">
            Share your business details and we will review your application. Once approved you can manage products,
            inventory, and subscriptions from the seller dashboard.
          </p>
          {isVerifiedSeller && (
            <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              Your seller profile is already under review or approved.
            </div>
          )}
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Seller details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitApplication} className="grid gap-4 md:grid-cols-2">
              <input
                className="h-10 rounded-md border bg-background px-3"
                placeholder="Display name *"
                value={form.displayName}
                onChange={(event) => update('displayName', event.target.value)}
                required
              />
              <input
                className="h-10 rounded-md border bg-background px-3"
                placeholder="Legal name"
                value={form.legalName}
                onChange={(event) => update('legalName', event.target.value)}
              />

              <input
                className="h-10 rounded-md border bg-background px-3"
                placeholder="Phone *"
                value={form.phone}
                onChange={(event) => update('phone', event.target.value)}
                required
              />
              <input
                className="h-10 rounded-md border bg-background px-3"
                placeholder="Support email"
                value={form.supportEmail}
                onChange={(event) => update('supportEmail', event.target.value)}
              />

              <textarea
                className="min-h-[80px] rounded-md border bg-background px-3 py-2 md:col-span-2"
                placeholder="Inbound warehouse instructions"
                value={form.warehouseInstructions}
                onChange={(event) => update('warehouseInstructions', event.target.value)}
              />

              <input
                className="h-10 rounded-md border bg-background px-3"
                placeholder="National ID (NID)"
                value={form.nidNumber}
                onChange={(event) => update('nidNumber', event.target.value)}
              />
              <input
                className="h-10 rounded-md border bg-background px-3"
                placeholder="Selfie verification URL"
                value={form.selfieUrl}
                onChange={(event) => update('selfieUrl', event.target.value)}
              />

              <select
                className="h-10 rounded-md border bg-background px-3"
                value={form.payoutMethod}
                onChange={(event) => update('payoutMethod', event.target.value)}
              >
                <option value="bank_transfer">Bank transfer</option>
                <option value="bkash">bKash</option>
                <option value="nagad">Nagad</option>
                <option value="payoneer">Payoneer</option>
                <option value="manual">Manual</option>
              </select>
              <input
                className="h-10 rounded-md border bg-background px-3"
                placeholder="Account holder name"
                value={form.accountName}
                onChange={(event) => update('accountName', event.target.value)}
              />

              <input
                className="h-10 rounded-md border bg-background px-3"
                placeholder="Account number"
                value={form.accountNumber}
                onChange={(event) => update('accountNumber', event.target.value)}
              />
              <input
                className="h-10 rounded-md border bg-background px-3"
                placeholder="Bank name"
                value={form.bankName}
                onChange={(event) => update('bankName', event.target.value)}
              />
              <input
                className="h-10 rounded-md border bg-background px-3"
                placeholder="Bank branch"
                value={form.bankBranch}
                onChange={(event) => update('bankBranch', event.target.value)}
              />

              <textarea
                className="min-h-[80px] rounded-md border bg-background px-3 py-2 md:col-span-2"
                placeholder="Additional notes"
                value={form.notes}
                onChange={(event) => update('notes', event.target.value)}
              />

              <div className="md:col-span-2 space-y-2">
                <h2 className="text-sm font-semibold text-muted-foreground">Storefront</h2>
                <input
                  className="h-10 rounded-md border bg-background px-3"
                  placeholder="Shop name"
                  value={form.shopName}
                  onChange={(event) => update('shopName', event.target.value)}
                />
                <input
                  className="h-10 rounded-md border bg-background px-3"
                  placeholder="Shop tagline"
                  value={form.shopTagline}
                  onChange={(event) => update('shopTagline', event.target.value)}
                />
                <textarea
                  className="min-h-[80px] rounded-md border bg-background px-3 py-2"
                  placeholder="Shop description"
                  value={form.shopDescription}
                  onChange={(event) => update('shopDescription', event.target.value)}
                />
              </div>

              <div className="md:col-span-2 flex gap-3">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Submitting…' : 'Submit application'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setForm(EMPTY)} disabled={saving}>
                  Reset
                </Button>
              </div>
              {error && <p className="md:col-span-2 text-sm text-red-600">{error}</p>}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
