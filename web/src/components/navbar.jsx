import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ShoppingBag, ShoppingCart } from 'lucide-react'
import { useSession } from '@/context/SessionContext'
import { notify } from '@/lib/notify'
import SearchBar from '@/components/search-bar'

export default function Navbar() {
  const navigate = useNavigate()
  const { user, cartCount, userLoading, logout } = useSession()

  async function handleLogout() {
    await logout()
    notify.info('Signed out')
    navigate('/')
  }

  const greeting = user?.name || user?.email

  return (
    <nav className="border-b bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center gap-4">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          <Link to="/" className="font-semibold">E-Commerce</Link>
        </div>

        <div className="flex-1">
          <SearchBar />
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="relative">
            <Link to="/cart" aria-label="Cart">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full border bg-primary px-1 text-xs font-medium text-primary-foreground">
                  {cartCount}
                </span>
              )}
            </Link>
          </Button>

          {userLoading ? (
            <span className="text-sm text-muted-foreground">Loading…</span>
          ) : !user ? (
            <>
              <Button asChild variant="ghost">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Register</Link>
              </Button>
            </>
          ) : (
            <>
              <span className="text-sm text-muted-foreground">Hi, {greeting}</span>
              <Button variant="outline" onClick={handleLogout}>Logout</Button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
