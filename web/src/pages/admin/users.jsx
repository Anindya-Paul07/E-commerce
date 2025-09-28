import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { notify } from '@/lib/notify';
import { api } from '@/lib/api';

const ALL_ROLES = ['customer', 'seller', 'seller_admin', 'admin', 'superadmin'];

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { items } = await api.get('/admin/users?limit=200');
        setUsers(items || []);
      } catch (err) {
        const message = err.message || 'Failed to load users';
        setError(message);
        notify.error(message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function toggleRole(userId, role, hasRole) {
    try {
      const target = users.find((user) => user._id === userId);
      if (!target) return;
      const nextRoles = hasRole
        ? target.roles.filter((r) => r !== role)
        : [...target.roles, role];
      const { user } = await api.patch(`/admin/users/${userId}/roles`, { roles: nextRoles });
      setUsers((prev) => prev.map((u) => (u._id === userId ? user : u)));
      notify.success('Roles updated');
    } catch (err) {
      notify.error(err.message || 'Failed to update roles');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Roles</h1>
          <p className="text-sm text-muted-foreground">Superadmins can grant or revoke platform roles.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left">
                  <tr>
                    <th className="py-2 pr-3">User</th>
                    <th className="py-2 pr-3">Roles</th>
                    <th className="py-2 pr-3">Assign</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="border-b last:border-0">
                      <td className="py-2 pr-3">
                        <div className="font-medium">{user.name || user.email}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </td>
                      <td className="py-2 pr-3">{user.roles.join(', ')}</td>
                      <td className="py-2 pr-3">
                        <div className="flex flex-wrap gap-2">
                          {ALL_ROLES.map((role) => {
                            const active = user.roles.includes(role);
                            return (
                              <Button
                                key={role}
                                size="sm"
                                variant={active ? 'default' : 'outline'}
                                onClick={() => toggleRole(user._id, role, active)}
                              >
                                {role}
                              </Button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
