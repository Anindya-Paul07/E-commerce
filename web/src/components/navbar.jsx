import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Sparkles, ShoppingCart } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { logout as logoutThunk } from '@/store/slices/sessionSlice'
import { clearCart } from '@/store/slices/cartSlice'
import { notify } from '@/lib/notify'
import SearchBar from '@/components/search-bar'

export default function Navbar() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.session.user)
  const sessionStatus = useAppSelector((state) => state.session.status)
  const cartCount = useAppSelector((state) => state.cart.items.reduce((sum, item) => sum + (item.qty || 0), 0))
  const isSeller = Boolean(user?.roles?.includes('seller'))
  const isAdmin = Boolean(user?.roles?.includes('admin'))

  async function handleLogout() {
    await dispatch(logoutThunk())
    dispatch(clearCart())
    notify.info('Signed out')
    navigate('/')
  }

  const greeting = user?.name || user?.email
  const userLoading = sessionStatus === 'loading'

  return (
    <nav className="border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="container flex h-16 items-center gap-4">
        <Link to="/" className="flex items-center gap-2 rounded-full border border-transparent px-3 py-1 text-sm font-semibold tracking-wide transition hover:border-primary/40 hover:bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
          <span>Flux Commerce</span>
        </Link>

        <div className="hidden flex-1 md:block">
          <SearchBar />
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="relative border-border/60 bg-card/60 backdrop-blur">
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
            <span className="hidden text-sm text-muted-foreground sm:inline">Syncing session…</span>
          ) : !user ? (
            <>
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild className="hidden sm:inline-flex">
                <Link to="/register">Create account</Link>
              </Button>
              <Button asChild variant="outline" className="border-primary/50 text-primary">
                <Link to="/seller/apply">Sell with us</Link>
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="hidden text-sm text-muted-foreground sm:inline">Hi, {greeting}</span>
              {isSeller && (
                <Button asChild size="sm" variant="ghost" className="border border-transparent hover:border-primary/40">
                  <Link to="/seller/dashboard">Seller hub</Link>
                </Button>
              )}
              {isAdmin && (
                <Button asChild size="sm" variant="ghost" className="border border-transparent hover:border-primary/40">
                  <Link to="/admin">Admin</Link>
                </Button>
              )}
              <Button size="sm" variant="outline" className="border-primary/40" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
