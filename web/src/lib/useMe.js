import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export function useMe() {
  const [me, setMe] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    api.get('/auth/me')
      .then(d => { if (mounted) setMe(d.user || null) })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const isAdmin = !!me?.roles?.includes('admin')
  return { me, isAdmin, loading }
}
