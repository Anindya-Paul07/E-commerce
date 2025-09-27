import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchSession } from '@/store/slices/sessionSlice';

export function useMe() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.session.user);
  const status = useAppSelector((state) => state.session.status);
  const refresh = () => dispatch(fetchSession());
  const isAdmin = !!user?.roles?.includes('admin');
  return { me: user, isAdmin, loading: status === 'loading', refresh };
}
