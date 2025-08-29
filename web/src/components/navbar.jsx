import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function Navbar() {
  const [me, setMe] = useState(null)

  useEffect(() => {
    api.get('/auth/me').then(d => setMe(d.user)).catch(()=>{})
  }, [])

  async function handleLogout() {
    await api.post('/auth/logout', {})
    setMe(null)
  }

  return (
    <nav style={{ display:'flex', gap:16, padding:'12px 16px', borderBottom:'1px solid #eee' }}>
      <Link to="/">Home</Link>
      {!me && <Link to="/login">Login</Link>}
      {!me && <Link to="/register">Register</Link>}
      <span style={{ marginLeft:'auto' }}>
        {me ? (
          <>
            <strong>{me?.name || me?.email}</strong>
            <button style={{ marginLeft:12 }} onClick={handleLogout}>Logout</button>
          </>
        ) : 'Guest'}
      </span>
    </nav>
  )
}
