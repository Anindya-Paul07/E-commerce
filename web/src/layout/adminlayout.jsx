import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Package, Tag, ShoppingCart, Users, Settings, WarehouseIcon, Store } from 'lucide-react'
import AdminGate from '@/components/AdminGate'

const nav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: Tag },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/inventory', label: 'Inventory', icon: WarehouseIcon},
  { to: '/admin/warehouses', label: 'Warehouses', icon: WarehouseIcon },
  { to: '/admin/brands', label: 'Brands', icon: Store }
  // { to: '/admin/customers', label: 'Customers', icon: Users, disabled: true },
  // { to: '/admin/settings', label: 'Settings', icon: Settings, disabled: true },
]

export default function AdminLayout() {
  return (
    <AdminGate>
      <div className="min-h-screen grid lg:grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <aside className="border-r bg-card/30">
          <div className="sticky top-0 p-4">
            <div className="mb-4">
              <div className="text-lg font-bold">MyShop Admin</div>
              <div className="text-xs text-muted-foreground">Manage your store</div>
            </div>
            <nav className="space-y-1">
              {nav.map(({ to, label, icon: Icon, disabled }) => (
                <NavLink
                  key={to}
                  to={disabled ? '#' : to}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                      isActive ? 'bg-muted font-medium' : 'hover:bg-muted',
                      disabled ? 'pointer-events-none opacity-50' : '',
                    ].join(' ')
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </AdminGate>
  )
}
