"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { ComponentPropsWithoutRef, ReactNode } from "react"

interface AnimatedCardProps extends Omit<ComponentPropsWithoutRef<typeof motion.div>, "children"> {
  children: ReactNode
  className?: string
  delay?: number
  hover?: boolean
}

export function AnimatedCard({ children, className, delay = 0, hover = true, ...props }: AnimatedCardProps) {
  return (
    <motion.div
      {...props}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : undefined}
      className={cn(
        "rounded-xl border border-border bg-card p-6 shadow-lg transition-colors",
        hover && "hover:border-primary/50 hover:shadow-primary/5",
        className,
      )}
    >
      {children}
    </motion.div>
  )
}
