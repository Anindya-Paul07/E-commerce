import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { notify } from '@/lib/notify';

const STATUS_OPTIONS = ['pending', 'in_progress', 'completed', 'canceled', 'exception'];

export default function AdminFulfillmentPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const { items } = await api.get('/admin/fulfillment-tasks?limit=200');
      setTasks(items || []);
    } catch (err) {
      const message = err.message || 'Failed to load tasks';
      setError(message);
      notify.error(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id, status) {
    try {
      const { task } = await api.patch(`/admin/fulfillment-tasks/${id}`, { status });
      setTasks((prev) => prev.map((item) => (item._id === task._id ? task : item)));
      notify.success('Task updated');
    } catch (err) {
      notify.error(err.message || 'Failed to update task');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fulfillment tasks</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <p className="text-sm text-muted-foreground">Loading tasks…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-left">
                <tr>
                  <th className="py-2 pr-3">Order</th>
                  <th className="py-2 pr-3">Product</th>
                  <th className="py-2 pr-3">Warehouse</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Priority</th>
                  <th className="py-2 pr-3">Updated</th>
                  <th className="py-2 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task._id} className="border-b last:border-0">
                    <td className="py-2 pr-3">{task.order}</td>
                    <td className="py-2 pr-3">{task.metadata?.title || task.product}</td>
                    <td className="py-2 pr-3">{task.warehouse}</td>
                    <td className="py-2 pr-3">{task.status}</td>
                    <td className="py-2 pr-3">{task.priority ?? 0}</td>
                    <td className="py-2 pr-3">{task.updatedAt ? new Date(task.updatedAt).toLocaleString() : '—'}</td>
                    <td className="py-2 pr-3">
                      <div className="flex flex-wrap gap-2">
                        {STATUS_OPTIONS.map((status) => (
                          <Button
                            key={status}
                            size="sm"
                            variant={task.status === status ? 'default' : 'outline'}
                            onClick={() => updateStatus(task._id, status)}
                          >
                            {status}
                          </Button>
                        ))}
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
  );
}
