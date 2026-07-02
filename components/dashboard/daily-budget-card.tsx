"use client"

import { motion } from "framer-motion"
import { Wallet, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { AnimatedCard } from "@/components/ui/animated-card"

interface DailyBudgetCardProps {
  dailyBudget: number
  remainingBudget: number
  spentToday: number
  daysLeft: number
  isHealthy: boolean
  message: string
}

export function DailyBudgetCard({
  dailyBudget,
  remainingBudget,
  spentToday,
  daysLeft,
  isHealthy,
  message,
}: DailyBudgetCardProps) {
  const budgetUsedToday = spentToday > 0 ? (spentToday / dailyBudget) * 100 : 0
  const canSpendMore = dailyBudget - spentToday

  return (
    <AnimatedCard
      delay={0.15}
      className={`relative overflow-hidden ${
        isHealthy
          ? "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/30"
          : "bg-gradient-to-br from-warning/10 via-warning/5 to-transparent border-warning/30"
      }`}
    >
      {/* Background decoration */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                isHealthy ? "bg-primary/20" : "bg-warning/20"
              }`}
            >
              <Wallet className={`h-6 w-6 ${isHealthy ? "text-primary" : "text-warning"}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Quanto posso gastar hoje</p>
              <motion.p
                key={dailyBudget}
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`text-2xl font-bold ${isHealthy ? "text-primary" : "text-warning"}`}
              >
                {formatCurrency(Math.max(0, canSpendMore))}
              </motion.p>
            </div>
          </div>
          {isHealthy ? (
            <CheckCircle className="h-5 w-5 text-success" />
          ) : (
            <AlertCircle className="h-5 w-5 text-warning" />
          )}
        </div>

        {/* Progress bar for today */}
        {spentToday > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Gasto hoje: {formatCurrency(spentToday)}</span>
              <span>{Math.round(budgetUsedToday)}% do orçamento diário</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, budgetUsedToday)}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  budgetUsedToday > 100 ? "bg-danger" : budgetUsedToday > 80 ? "bg-warning" : "bg-primary"
                }`}
              />
            </div>
          </div>
        )}

        {/* Info row */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              {remainingBudget >= 0 ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-danger" />
              )}
              <span className="text-muted-foreground">
                Resta no mês:{" "}
                <span className={remainingBudget >= 0 ? "text-success" : "text-danger"}>
                  {formatCurrency(remainingBudget)}
                </span>
              </span>
            </div>
          </div>
          <span className="text-muted-foreground">{daysLeft} dias restantes</span>
        </div>

        {/* Message */}
        <p className="mt-3 text-sm text-muted-foreground italic">{message}</p>
      </div>
    </AnimatedCard>
  )
}
