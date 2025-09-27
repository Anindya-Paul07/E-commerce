import { useSession } from '@/context/SessionContext'

export function useMe() {
  const { user, userLoading, refreshUser } = useSession()
  const isAdmin = !!user?.roles?.includes('admin')
  return { me: user, isAdmin, loading: userLoading, refresh: refreshUser }
}
