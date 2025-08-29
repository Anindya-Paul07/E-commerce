import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Badge from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const demo = [
  { id: 1, title: "Cotton Tee", price: 19.99, tag: "New" },
  { id: 2, title: "Denim Jacket", price: 59.99, tag: "Hot" },
  { id: 3, title: "Running Shoes", price: 89.99, tag: "Sale" },
  { id: 4, title: "Backpack", price: 39.99, tag: "New" },
]

export default function Home() {
  return (
    <div className="container space-y-10 py-10">
      {/* Hero */}
      <section className="rounded-lg bg-gradient-to-r from-muted to-transparent p-8">
        <h2 className="text-3xl font-bold tracking-tight">End-of-Season Sale</h2>
        <p className="mt-1 text-muted-foreground">Up to 40% off on selected styles.</p>
        <div className="mt-6 flex gap-3">
          <Button>Shop now</Button>
          <Button variant="outline">Explore categories</Button>
        </div>
      </section>

      {/* Products */}
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h3 className="text-xl font-semibold">Featured</h3>
          <Button variant="link" className="px-0">View all</Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {demo.map(p => (
            <Card key={p.id} className="group">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="truncate">{p.title}</CardTitle>
                  <Badge variant="default">{p.tag}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="aspect-square w-full rounded-md bg-muted/60 group-hover:bg-muted transition-colors" />
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-semibold">${p.price.toFixed(2)}</span>
                  <Button size="sm">Add to cart</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
