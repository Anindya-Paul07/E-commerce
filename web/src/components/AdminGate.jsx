import { Navigate } from 'react-router-dom'
import { useMe } from '@/lib/useMe'

export default function AdminGate({ children }) {
  const { isAdmin, loading } = useMe()
  if (loading) return <div className="container py-10 text-sm text-muted-foreground">Checking access…</div>
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}
