import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Orders</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold">0</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Products</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold">—</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Users</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold">—</CardContent>
        </Card>
      </div>
      <p className="text-sm text-muted-foreground">We’ll wire real metrics later.</p>
    </div>
  )
}
