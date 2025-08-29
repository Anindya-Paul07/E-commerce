import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Register() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setErr('')
    setLoading(true)
    try {
      await api.post('/auth/register', { name, email, password })
      navigate('/')
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Create account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="grid gap-3">
              <input className="h-10 rounded-md border bg-background px-3" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} required />
              <input className="h-10 rounded-md border bg-background px-3" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
              <input className="h-10 rounded-md border bg-background px-3" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
              <Button disabled={loading}>{loading ? 'Creating…' : 'Create'}</Button>
              {err && <p className="text-sm text-red-600">{err}</p>}
            </form>
            <p className="mt-3 text-sm text-muted-foreground">
              Already have an account? <Link to="/login" className="underline">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
