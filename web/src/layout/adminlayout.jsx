import { Link, Outlet, useLocation } from 'react-router-dom'
import AdminGate from '@/components/AdminGate'

export default function AdminLayout() {
  const { pathname } = useLocation()
  const link = (to, label) => (
    <Link to={to}
      className={`block rounded-md px-3 py-2 text-sm hover:bg-muted ${pathname === to ? 'bg-muted font-medium' : ''}`}>
      {label}
    </Link>
  )
  return (
    <AdminGate>
      <div className="container py-8 grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="h-fit rounded-lg border p-3">
          <div className="mb-2 text-sm font-semibold">Admin</div>
          {link('/admin', 'Dashboard')}
          {link('/admin/products', 'Products')}
        </aside>
        <section>
          <Outlet />
        </section>
      </div>
    </AdminGate>
  )
}
