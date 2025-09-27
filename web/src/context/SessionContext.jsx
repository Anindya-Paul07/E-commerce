import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'

const SessionContext = createContext(null)

function computeCount(cart) {
  return (cart?.items || []).reduce((sum, it) => sum + (it.qty || 0), 0)
}

export function SessionProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userLoading, setUserLoading] = useState(true)
  const [cart, setCartState] = useState(null)
  const [cartCount, setCartCount] = useState(0)
  const [cartLoading, setCartLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    setUserLoading(true)
    try {
      const data = await api.get('/auth/me')
      setUser(data.user || null)
    } catch (error) {
      setUser(null)
    } finally {
      setUserLoading(false)
    }
  }, [])

  const setCart = useCallback((next) => {
    setCartState(next)
    setCartCount(computeCount(next))
  }, [])

  const refreshCart = useCallback(async () => {
    setCartLoading(true)
    try {
      const { cart: fresh } = await api.get('/cart')
      setCart(fresh)
    } catch (error) {
      setCart(null)
    } finally {
      setCartLoading(false)
    }
  }, [setCart])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  useEffect(() => {
    if (!user) {
      setCart(null)
      setCartLoading(false)
      return
    }
    refreshCart()
  }, [user, refreshCart, setCart])

  useEffect(() => {
    const onCart = () => refreshCart()
    const onVis = () => {
      if (document.visibilityState === 'visible') refreshCart()
    }
    window.addEventListener('cart:updated', onCart)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('cart:updated', onCart)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [refreshCart])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout', {})
    } finally {
      setUser(null)
      setCart(null)
    }
  }, [setCart])

  const value = useMemo(() => ({
    user,
    setUser,
    userLoading,
    refreshUser,
    cart,
    setCart,
    cartCount,
    cartLoading,
    refreshCart,
    logout,
  }), [user, userLoading, refreshUser, cart, setCart, cartCount, cartLoading, refreshCart, logout])

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}
