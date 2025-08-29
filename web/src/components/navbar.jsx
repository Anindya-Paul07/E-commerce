import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { ShoppingBag } from 'lucide-react'

export default function Navbar() {
  const [me, setMe] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/auth/me').then(d => setMe(d.user)).catch(()=>{})
  }, [])

  async function handleLogout() {
    await api.post('/auth/logout', {})
    setMe(null)
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
