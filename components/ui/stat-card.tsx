"use client"

import { motion } from "framer-motion"
import { cn, formatCurrency } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: number
  icon: LucideIcon
  trend?: number
  format?: "currency" | "number" | "percent"
  color?: "default" | "success" | "warning" | "danger"
  delay?: number
}

const colorMap = {
  default: "from-primary/20 to-accent/20 border-primary/30",
  success: "from-success/20 to-success/5 border-success/30",
  warning: "from-warning/20 to-warning/5 border-warning/30",
  danger: "from-danger/20 to-danger/5 border-danger/30",
}

const iconColorMap = {
  default: "text-primary",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  format = "currency",
  color = "default",
  delay = 0,
}: StatCardProps) {
  const formattedValue =
    format === "currency" ? formatCurrency(value) : format === "percent" ? `${value}%` : value.toLocaleString("pt-BR")

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        "relative overflow-hidden rounded-xl border bg-gradient-to-br p-6 shadow-lg transition-all",
        colorMap[color],
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{formattedValue}</p>
          {trend !== undefined && (
            <p className={cn("text-sm font-medium", trend >= 0 ? "text-success" : "text-danger")}>
              {trend >= 0 ? "+" : ""}
              {trend}% este mês
            </p>
          )}
        </div>
        <div className={cn("rounded-lg bg-card/50 p-3", iconColorMap[color])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </motion.div>
  )
}
