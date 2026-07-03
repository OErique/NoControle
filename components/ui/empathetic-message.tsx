"use client"

import { motion } from "framer-motion"
import { Heart, Lightbulb, Trophy, Target, AlertTriangle, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmpatheticMessageProps {
  type: "encouragement" | "tip" | "celebration" | "warning" | "success" | "support"
  title: string
  message: string
  action?: {
    label: string
    href: string
  }
  className?: string
}

const typeConfig = {
  encouragement: {
    icon: Heart,
    bgClass: "from-pink-500/10 to-rose-500/10 border-pink-500/30",
    iconClass: "bg-pink-500/20 text-pink-500",
  },
  tip: {
    icon: Lightbulb,
    bgClass: "from-yellow-500/10 to-amber-500/10 border-yellow-500/30",
    iconClass: "bg-yellow-500/20 text-yellow-500",
  },
  celebration: {
    icon: Trophy,
    bgClass: "from-purple-500/10 to-violet-500/10 border-purple-500/30",
    iconClass: "bg-purple-500/20 text-purple-500",
  },
  warning: {
    icon: AlertTriangle,
    bgClass: "from-orange-500/10 to-amber-500/10 border-orange-500/30",
    iconClass: "bg-orange-500/20 text-orange-500",
  },
  success: {
    icon: CheckCircle,
    bgClass: "from-green-500/10 to-emerald-500/10 border-green-500/30",
    iconClass: "bg-green-500/20 text-green-500",
  },
  support: {
    icon: Target,
    bgClass: "from-blue-500/10 to-cyan-500/10 border-blue-500/30",
    iconClass: "bg-blue-500/20 text-blue-500",
  },
}

export function EmpatheticMessage({ type, title, message, action, className }: EmpatheticMessageProps) {
  const config = typeConfig[type]
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("rounded-xl border bg-gradient-to-r p-4", config.bgClass, className)}
    >
      <div className="flex items-start gap-3">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", config.iconClass)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-foreground">{title}</h4>
          <p className="text-sm text-muted-foreground mt-0.5">{message}</p>
          {action && (
            <a href={action.href} className="inline-block mt-2 text-sm font-medium text-primary hover:underline">
              {action.label} →
            </a>
          )}
        </div>
      </div>
    </motion.div>
  )
}
