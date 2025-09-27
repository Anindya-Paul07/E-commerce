export default function Footer() {
  return (
    <footer className="border-t bg-secondary/60">
      <div className="container py-6 text-sm text-muted-foreground">
        © {new Date().getFullYear()} E-Commerce. All rights reserved by Anindya Paul.
      </div>
    </footer>
  )
}
