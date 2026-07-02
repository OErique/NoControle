import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: "green" | "yellow" | "red"
  label?: string
  size?: "sm" | "md" | "lg"
}

const statusConfig = {
  green: {
    bg: "bg-success/20",
    text: "text-success",
    dot: "bg-success",
    label: "Saudável",
  },
  yellow: {
    bg: "bg-warning/20",
    text: "text-warning",
    dot: "bg-warning",
    label: "Atenção",
  },
  red: {
    bg: "bg-danger/20",
    text: "text-danger",
    dot: "bg-danger",
    label: "Crítico",
  },
}

const sizeConfig = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
  lg: "px-4 py-1.5 text-base",
}

export function StatusBadge({ status, label, size = "md" }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        config.bg,
        config.text,
        sizeConfig[size],
      )}
    >
      <span className={cn("h-2 w-2 rounded-full animate-pulse", config.dot)} />
      {label || config.label}
    </span>
  )
}
