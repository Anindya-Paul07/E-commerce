import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchSession } from '@/store/slices/sessionSlice';

export function useMe() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.session.user);
  const status = useAppSelector((state) => state.session.status);
  const refresh = () => dispatch(fetchSession());
  const roles = user?.roles || [];
  const isAdmin = roles.includes('admin') || roles.includes('superadmin');
  const isSeller = roles.includes('seller') || roles.includes('seller_admin');
  return { me: user, isAdmin, isSeller, loading: status === 'loading', refresh };
}
