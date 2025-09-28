import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Package, Tag, ShoppingCart, Building2, Boxes, BadgeCheck, ShieldCheck, Layers } from 'lucide-react'
import AdminGate from '@/components/AdminGate'
import { useAppSelector } from '@/store/hooks'

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/catalog', label: 'Catalog', icon: Layers, roles: ['admin', 'seller_admin', 'superadmin'] },
  { to: '/admin/products', label: 'Legacy products', icon: Package, roles: ['admin', 'seller_admin', 'superadmin'] },
  { to: '/admin/brands', label: 'Brands', icon: BadgeCheck, roles: ['admin', 'seller_admin', 'superadmin'] },
  { to: '/admin/categories', label: 'Categories', icon: Tag, roles: ['admin', 'seller_admin', 'superadmin'] },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart, roles: ['admin', 'seller_admin', 'superadmin'] },
  { to: '/admin/warehouses', label: 'Warehouses', icon: Building2, roles: ['admin', 'seller_admin', 'superadmin'] },
  { to: '/admin/inventory', label: 'Inventory', icon: Boxes, roles: ['admin', 'seller_admin', 'superadmin'] },
  { to: '/admin/users', label: 'Users', icon: ShieldCheck, roles: ['superadmin'] },
  // { to: '/admin/customers', label: 'Customers', icon: Users, disabled: true },
  // { to: '/admin/settings', label: 'Settings', icon: Settings, disabled: true },
]

export default function AdminLayout() {
  const roles = useAppSelector((state) => state.session.user?.roles || [])
  const nav = NAV_ITEMS.filter((item) => {
    if (!item.roles) return true
    if (roles.includes('superadmin')) return true
    return item.roles.some((role) => roles.includes(role))
  })

  return (
    <AdminGate>
      <div className="min-h-screen bg-background lg:grid lg:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside className="border-r bg-secondary/80">
          <div className="sticky top-0 h-full p-4">
            <div className="mb-6">
              <div className="text-lg font-semibold text-foreground">MyShop Admin</div>
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
                      isActive ? 'bg-primary/10 font-medium text-primary' : 'hover:bg-muted',
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
        <main className="p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </AdminGate>
  )
}
