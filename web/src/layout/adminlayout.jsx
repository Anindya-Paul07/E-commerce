import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Package, Tag, ShoppingCart, Building2, Boxes, BadgeCheck, Sparkles } from 'lucide-react'
import AdminGate from '@/components/AdminGate'

const nav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/brands', label: 'Brands', icon: BadgeCheck },
  { to: '/admin/categories', label: 'Categories', icon: Tag },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/warehouses', label: 'Warehouses', icon: Building2 },
  { to: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { to: '/admin/shop', label: 'Shop CMS', icon: Sparkles },
  // { to: '/admin/customers', label: 'Customers', icon: Users, disabled: true },
  // { to: '/admin/settings', label: 'Settings', icon: Settings, disabled: true },
]

export default function AdminLayout() {
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
