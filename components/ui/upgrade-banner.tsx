"use client"

import { motion } from "framer-motion"
import { Sparkles, ArrowRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState } from "react"

interface UpgradeBannerProps {
  feature: string
  planRequired: "completo" | "total"
}

export function UpgradeBanner({ feature, planRequired }: UpgradeBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  if (isDismissed) return null

  const planName = planRequired === "total" ? "Total" : "Completo"
  const gradient = planRequired === "total" ? "from-purple-500/20 to-pink-500/20" : "from-primary/20 to-accent/20"
  const borderColor = planRequired === "total" ? "border-purple-500/30" : "border-primary/30"

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`relative rounded-xl border bg-gradient-to-r p-4 ${gradient} ${borderColor}`}
    >
      <button
        onClick={() => setIsDismissed(true)}
        className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background/50">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">Desbloqueie {feature}</p>
            <p className="text-sm text-muted-foreground">Disponível no plano {planName} e acima</p>
          </div>
        </div>

        <Link href="/upgrade">
          <Button size="sm" className="gradient-primary text-primary-foreground gap-1">
            Ver planos
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </motion.div>
  )
}
