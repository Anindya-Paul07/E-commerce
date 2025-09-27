import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { notify } from '@/lib/notify'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { login as loginThunk } from '@/store/slices/sessionSlice'
import { fetchCart } from '@/store/slices/cartSlice'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const dispatch = useAppDispatch()
  const status = useAppSelector((state) => state.session.status)
  const loading = status === 'loading'

  async function onSubmit(e) {
    e.preventDefault()
    setErr('')
    try {
      const result = await dispatch(loginThunk({ email, password }))
      if (loginThunk.fulfilled.match(result)) {
        notify.success('Welcome back!')
        dispatch(fetchCart())
        const destination = result.payload?.roles?.includes('admin') ? '/admin' : '/'
        navigate(destination, { replace: true })
      } else {
        const message = result.payload || result.error.message || 'Unable to sign in'
        setErr(message)
        notify.error(message)
      }
    } catch (error) {
      const message = error.message || 'Unable to sign in'
      setErr(message)
      notify.error(message)
    }
  }

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="grid gap-3">
              <input className="h-10 rounded-md border bg-background px-3" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
              <input className="h-10 rounded-md border bg-background px-3" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
              <Button disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</Button>
              {err && <p className="text-sm text-red-600">{err}</p>}
            </form>
            <p className="mt-3 text-sm text-muted-foreground">
              New here? <Link to="/register" className="underline">Create an account</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
