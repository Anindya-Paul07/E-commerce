export default function Footer() {
  return (
    <footer className="border-t">
      <div className="container py-6 text-sm text-muted-foreground">
        © {new Date().getFullYear()} E-Commerce. All rights reserved.
      </div>
    </footer>
  )
}
