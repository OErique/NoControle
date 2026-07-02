"use client"

import { motion } from "framer-motion"
import { Medal, Crown, Gem } from "lucide-react"
import { cn } from "@/lib/utils"

interface LevelBadgeProps {
  level: string
  size?: "sm" | "md" | "lg"
  animated?: boolean
  showLabel?: boolean
  className?: string
}

const levelConfig = {
  bronze: {
    icon: Medal,
    gradient: "from-amber-700 to-amber-900",
    glow: "shadow-amber-500/30",
    textColor: "text-amber-200",
    bgColor: "bg-amber-800/20",
  },
  prata: {
    icon: Medal,
    gradient: "from-slate-300 to-slate-500",
    glow: "shadow-slate-400/30",
    textColor: "text-slate-200",
    bgColor: "bg-slate-400/20",
  },
  ouro: {
    icon: Crown,
    gradient: "from-yellow-400 to-amber-500",
    glow: "shadow-yellow-400/40",
    textColor: "text-yellow-200",
    bgColor: "bg-yellow-500/20",
  },
  diamante: {
    icon: Gem,
    gradient: "from-cyan-300 to-teal-400",
    glow: "shadow-cyan-400/50",
    textColor: "text-cyan-200",
    bgColor: "bg-cyan-400/20",
  },
}

const sizeConfig = {
  sm: { badge: "h-6 w-6", icon: "h-3 w-3", text: "text-xs" },
  md: { badge: "h-10 w-10", icon: "h-5 w-5", text: "text-sm" },
  lg: { badge: "h-14 w-14", icon: "h-7 w-7", text: "text-base" },
}

export function LevelBadge({ level, size = "md", animated = true, showLabel = false, className }: LevelBadgeProps) {
  const config = levelConfig[level as keyof typeof levelConfig] || levelConfig.bronze
  const sizes = sizeConfig[size]
  const Icon = config.icon

  const badge = (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-full bg-gradient-to-br",
        config.gradient,
        sizes.badge,
        animated && "shadow-lg",
        animated && config.glow,
        className,
      )}
    >
      <Icon className={cn(sizes.icon, "text-white drop-shadow-md")} />
      {level === "diamante" && animated && (
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        />
      )}
    </div>
  )

  if (!showLabel) return badge

  return (
    <div className="flex items-center gap-2">
      {badge}
      <span className={cn("font-medium capitalize", sizes.text, config.textColor)}>{level}</span>
    </div>
  )
}
