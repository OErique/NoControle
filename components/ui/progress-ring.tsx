"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface ProgressRingProps {
  progress: number
  size?: number
  strokeWidth?: number
  className?: string
  color?: "primary" | "success" | "warning" | "danger"
  showLabel?: boolean
  label?: string
}

const colorMap = {
  primary: "stroke-primary",
  success: "stroke-success",
  warning: "stroke-warning",
  danger: "stroke-danger",
}

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  className,
  color = "primary",
  showLabel = true,
  label,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className={colorMap[color]}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      {showLabel && (
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">{Math.round(progress)}%</span>
          {label && <span className="text-xs text-muted-foreground">{label}</span>}
        </div>
      )}
    </div>
  )
}
