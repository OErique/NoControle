"use client"

import { AnimatedCard } from "@/components/ui/animated-card"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { formatCurrency } from "@/lib/utils"
import type { Debt } from "@/lib/db"

interface DebtChartProps {
  debts: Debt[]
  paymentHistory: Array<{ month: string; total_paid: number }>
}

export function DebtChart({ debts, paymentHistory }: DebtChartProps) {
  // Generate projected payoff data
  const totalDebt = debts.reduce((sum, d) => sum + d.current_amount, 0)
  const avgInterest = debts.length > 0 ? debts.reduce((sum, d) => sum + (d.interest_rate || 0), 0) / debts.length : 0

  // Simple projection: assume paying 10% of debt each month
  const projectionData = []
  let remainingDebt = totalDebt

  for (let i = 0; i <= 12; i++) {
    const monthDate = new Date()
    monthDate.setMonth(monthDate.getMonth() + i)
    const monthLabel = monthDate.toLocaleDateString("pt-BR", { month: "short" })

    projectionData.push({
      month: monthLabel,
      debt: Math.max(0, remainingDebt),
    })

    // Apply interest and subtract payment
    remainingDebt = remainingDebt * (1 + avgInterest / 100) - totalDebt * 0.1
  }

  return (
    <AnimatedCard delay={0.6}>
      <h3 className="mb-4 font-semibold text-foreground">Projeção de Quitação</h3>

      {totalDebt > 0 ? (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projectionData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <defs>
                <linearGradient id="debtGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--danger)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--danger)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border border-border bg-card p-2 shadow-lg">
                        <p className="text-sm font-medium">{formatCurrency(payload[0].value as number)}</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Area type="monotone" dataKey="debt" stroke="var(--danger)" strokeWidth={2} fill="url(#debtGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center text-center">
          <p className="text-muted-foreground">Adicione dívidas para ver a projeção de quitação</p>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-sm">
        <span className="text-muted-foreground">Total atual</span>
        <span className="font-semibold text-danger">{formatCurrency(totalDebt)}</span>
      </div>
    </AnimatedCard>
  )
}
