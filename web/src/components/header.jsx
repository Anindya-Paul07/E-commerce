export default function Header() {
  return (
    <header className="border-b bg-secondary/70 backdrop-blur">
      <div className="container flex flex-col gap-2 py-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Discover your next favorite
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Fresh arrivals, fair prices, and a checkout experience built for modern commerce.
        </p>
      </div>
    </header>
  )
}
