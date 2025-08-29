import { cn } from "@/lib/utils"

export default function Badge({ className, children, variant = "default" }) {
  const base = "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors"
  const styles = {
    default: "border-transparent bg-secondary text-secondary-foreground",
    outline: "text-foreground",
  }
  return <span className={cn(base, styles[variant], className)}>{children}</span>
}
