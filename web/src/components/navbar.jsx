import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { ShoppingBag, ShoppingCart } from 'lucide-react'

export default function Navbar() {
  const [me, setMe] = useState(null)
  const [count, setCount] = useState(0)
  const navigate = useNavigate()

  // auth
  useEffect(() => {
    let active = true
    api.get('/auth/me').then(d => { if (active) setMe(d.user) }).catch(()=>{})
    return () => { active = false }
  }, [])

  // cart count helpers
  async function refreshCartCount() {
    try {
      const { cart } = await api.get('/cart')
      const c = (cart?.items || []).reduce((sum, it) => sum + (it.qty || 0), 0)
      setCount(c)
    } catch {
      setCount(0) // not logged in or no cart yet
    }
  }

  // load on mount, when tab re-appears, and on custom 'cart:updated' events
  useEffect(() => {
    refreshCartCount()

    const onVis = () => { if (document.visibilityState === 'visible') refreshCartCount() }
    const onCart = () => refreshCartCount()

    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('cart:updated', onCart)

    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('cart:updated', onCart)
    }
  }, [])

  async function handleLogout() {
    await api.post('/auth/logout', {})
    setMe(null)
    setCount(0)
    navigate('/')
  }

  return (
    <nav className="border-b">
      <div className="container flex h-14 items-center">
        <div className="mr-6 flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          <Link to="/" className="font-semibold">E-Commerce</Link>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Cart button (always visible) */}
          <Button asChild variant="outline" className="relative">
            <Link to="/cart" aria-label="Cart">
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full border bg-primary px-1 text-xs font-medium text-primary-foreground">
                  {count}
                </span>
              )}
            </Link>
          </Button>

          {!me ? (
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
              <span className="text-sm text-muted-foreground">Hi, {me.name || me.email}</span>
              <Button variant="outline" onClick={handleLogout}>Logout</Button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
