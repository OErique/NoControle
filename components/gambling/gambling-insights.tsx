"use client"

import { AlertTriangle, TrendingDown, TrendingUp, Lightbulb, Calendar } from "lucide-react"
import { AnimatedCard } from "@/components/ui/animated-card"
import { formatCurrency } from "@/lib/utils"

interface GamblingInsightsProps {
  stats: {
    totalBet: number
    totalWon: number
    totalLost: number
    netResult: number
    betCount: number
    monthlyData: Array<{
      month: string
      bet: number
      won: number
      lost: number
    }>
  } | null
  monthlyLimit: number
  currentMonthSpent: number
}

export function GamblingInsights({ stats, monthlyLimit, currentMonthSpent }: GamblingInsightsProps) {
  if (!stats) return null

  const insights = []

  // Calculate insights
  const winRate =
    stats.betCount > 0 ? (((stats.totalWon > stats.totalBet ? 1 : 0) / stats.betCount) * 100).toFixed(0) : 0

  if (stats.netResult < 0) {
    insights.push({
      type: "warning",
      icon: TrendingDown,
      title: "Saldo Negativo",
      message: `Você perdeu mais do que ganhou. Prejuízo total: ${formatCurrency(Math.abs(stats.netResult))}`,
    })
  }

  if (stats.monthlyData.length >= 2) {
    const lastMonth = stats.monthlyData[stats.monthlyData.length - 1]
    const prevMonth = stats.monthlyData[stats.monthlyData.length - 2]

    if (lastMonth.lost > prevMonth.lost) {
      insights.push({
        type: "danger",
        icon: AlertTriangle,
        title: "Aumento de Perdas",
        message: `Suas perdas aumentaram ${(((lastMonth.lost - prevMonth.lost) / prevMonth.lost) * 100).toFixed(0)}% em relação ao mês anterior`,
      })
    }
  }

  if (currentMonthSpent > 0) {
    const remainingLimit = monthlyLimit - currentMonthSpent
    insights.push({
      type: remainingLimit > 0 ? "info" : "danger",
      icon: Calendar,
      title: "Limite Mensal",
      message:
        remainingLimit > 0
          ? `Você ainda pode gastar ${formatCurrency(remainingLimit)} este mês`
          : `Você ultrapassou seu limite em ${formatCurrency(Math.abs(remainingLimit))}`,
    })
  }

  // Add positive insight if winning
  if (stats.netResult > 0) {
    insights.push({
      type: "success",
      icon: TrendingUp,
      title: "Saldo Positivo",
      message: `Você está com lucro de ${formatCurrency(stats.netResult)}. Mas lembre-se: sorte não é estratégia.`,
    })
  }

  // General tip
  insights.push({
    type: "tip",
    icon: Lightbulb,
    title: "Dica",
    message: "Defina um limite fixo para apostas e nunca aposte mais do que pode perder.",
  })

  return (
    <AnimatedCard>
      <h3 className="font-semibold mb-4">Insights</h3>
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border ${
              insight.type === "warning"
                ? "bg-warning/10 border-warning/30"
                : insight.type === "danger"
                  ? "bg-danger/10 border-danger/30"
                  : insight.type === "success"
                    ? "bg-success/10 border-success/30"
                    : insight.type === "tip"
                      ? "bg-primary/10 border-primary/30"
                      : "bg-muted/50 border-border"
            }`}
          >
            <div className="flex items-start gap-3">
              <insight.icon
                className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                  insight.type === "warning"
                    ? "text-warning"
                    : insight.type === "danger"
                      ? "text-danger"
                      : insight.type === "success"
                        ? "text-success"
                        : "text-primary"
                }`}
              />
              <div>
                <p className="font-medium text-sm">{insight.title}</p>
                <p className="text-sm text-muted-foreground">{insight.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AnimatedCard>
  )
}
