import { Navigate } from 'react-router-dom';
import { useMe } from '@/lib/useMe';

export default function SellerGate({ children }) {
  const { isSeller, loading } = useMe();
  if (loading) return <div className="container py-10 text-sm text-muted-foreground">Checking access…</div>;
  if (!isSeller) return <Navigate to="/seller/apply" replace />;
  return children;
}
