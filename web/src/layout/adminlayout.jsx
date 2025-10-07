import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Package, Tag, ShoppingCart, Building2, Boxes, BadgeCheck, Sparkles, Users, Palette } from 'lucide-react';
import AdminGate from '@/components/AdminGate'

const nav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/brands', label: 'Brands', icon: BadgeCheck },
  { to: '/admin/categories', label: 'Categories', icon: Tag },
  { to: '/admin/sellers', label: 'Sellers', icon: Users },
  { to: '/admin/storefront', label: 'Storefront CMS', icon: Palette },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/warehouses', label: 'Warehouses', icon: Building2 },
  { to: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { to: '/admin/shop', label: 'Seller CMS', icon: Sparkles },
  // { to: '/admin/customers', label: 'Customers', icon: Users, disabled: true },
  // { to: '/admin/settings', label: 'Settings', icon: Settings, disabled: true },
]

export default function AdminLayout() {
  return (
    <AdminGate>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 lg:grid lg:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside className="border-r border-border/60 bg-card/80 backdrop-blur">
          <div className="sticky top-0 h-full p-4">
            <div className="mb-8">
              <div className="text-lg font-semibold text-foreground">Flux Admin Console</div>
              <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Orchestrate the flagship</div>
            </div>
            <nav className="space-y-1.5">
              {nav.map(({ to, label, icon, disabled }) => {
                const IconComponent = icon;
                const target = disabled ? '#' : to;
                return (
                  <NavLink
                    key={to}
                    to={target}
                    className={({ isActive }) =>
                      [
                        'flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition',
                        isActive
                          ? 'bg-primary/15 font-medium text-primary shadow-inner'
                          : 'hover:bg-muted',
                        disabled ? 'pointer-events-none opacity-50' : '',
                      ].join(' ')
                    }
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{label}</span>
                  </NavLink>
                );
              })}
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
