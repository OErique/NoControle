"use client"

import { AnimatedCard } from "@/components/ui/animated-card"
import { formatCurrency } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react"
import type { Income, Expense } from "@/lib/db"

interface MonthlyChartProps {
  data: Array<{ month: string; type: string; total: number }>
  incomes?: Income[]
  expenses?: Expense[]
}

export function MonthlyChart({ data, incomes = [], expenses = [] }: MonthlyChartProps) {
  const calculateMonthlyData = () => {
    // Group transactions by month
    const monthlyMap: Record<string, { income: number; expense: number }> = {}

    const getMonthKey = (date: string | Date | null | undefined): string | null => {
      if (!date) return null
      try {
        if (typeof date === "string") {
          return date.substring(0, 7) // YYYY-MM
        }
        if (date instanceof Date) {
          return date.toISOString().substring(0, 7)
        }
        // Try to parse as date
        const parsed = new Date(date as any)
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString().substring(0, 7)
        }
        return null
      } catch {
        return null
      }
    }

    // Process incomes
    incomes.forEach((income) => {
      const month = getMonthKey(income.date)
      if (!month) return
      if (!monthlyMap[month]) monthlyMap[month] = { income: 0, expense: 0 }
      monthlyMap[month].income += Number(income.amount)
    })

    // Process expenses
    expenses.forEach((expense) => {
      const month = getMonthKey(expense.date)
      if (!month) return
      if (!monthlyMap[month]) monthlyMap[month] = { income: 0, expense: 0 }
      monthlyMap[month].expense += Number(expense.amount)
    })

    // Convert to array and sort
    return Object.entries(monthlyMap)
      .map(([month, values]) => ({
        month,
        ...values,
        balance: values.income - values.expense,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6) // Last 6 months
  }

  // Use real-time data if available, otherwise fall back to server data
  const hasRealTimeData = incomes.length > 0 || expenses.length > 0

  const chartData = hasRealTimeData
    ? calculateMonthlyData()
    : data
        .reduce(
          (acc, item) => {
            const existing = acc.find((d) => d.month === item.month)
            if (existing) {
              if (item.type === "income") existing.income = Number(item.total)
              if (item.type === "expense") existing.expense = Number(item.total)
              existing.balance = existing.income - existing.expense
            } else {
              acc.push({
                month: item.month,
                income: item.type === "income" ? Number(item.total) : 0,
                expense: item.type === "expense" ? Number(item.total) : 0,
                balance: item.type === "income" ? Number(item.total) : -Number(item.total),
              })
            }
            return acc
          },
          [] as Array<{ month: string; income: number; expense: number; balance: number }>,
        )
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-6)

  // Calculate totals and trends
  const currentMonth = chartData[chartData.length - 1]
  const previousMonth = chartData[chartData.length - 2]

  const totalIncome = currentMonth?.income || 0
  const totalExpense = currentMonth?.expense || 0
  const currentBalance = totalIncome - totalExpense

  const prevIncome = previousMonth?.income || 0
  const prevExpense = previousMonth?.expense || 0
  const prevBalance = prevIncome - prevExpense

  const balanceChange =
    prevBalance !== 0
      ? ((currentBalance - prevBalance) / Math.abs(prevBalance)) * 100
      : currentBalance > 0
        ? 100
        : currentBalance < 0
          ? -100
          : 0

  // Max value for scaling bars
  const maxValue = Math.max(...chartData.flatMap((d) => [d.income, d.expense]), 1)

  if (chartData.length === 0) {
    return (
      <AnimatedCard delay={0.45}>
        <h3 className="mb-4 font-semibold text-foreground">Evolução Mensal</h3>
        <div className="flex h-48 items-center justify-center text-center">
          <p className="text-muted-foreground">Adicione transações para ver o histórico</p>
        </div>
      </AnimatedCard>
    )
  }

  return (
    <AnimatedCard delay={0.45}>
      <h3 className="mb-4 font-semibold text-foreground">Evolução Mensal</h3>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-success/10 rounded-xl p-3 text-center">
          <ArrowUpRight className="h-4 w-4 text-success mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Receitas</p>
          <p className="text-sm font-bold text-success">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="bg-danger/10 rounded-xl p-3 text-center">
          <ArrowDownRight className="h-4 w-4 text-danger mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Despesas</p>
          <p className="text-sm font-bold text-danger">{formatCurrency(totalExpense)}</p>
        </div>
        <div className={`rounded-xl p-3 text-center ${currentBalance >= 0 ? "bg-success/10" : "bg-danger/10"}`}>
          <Wallet className={`h-4 w-4 mx-auto mb-1 ${currentBalance >= 0 ? "text-success" : "text-danger"}`} />
          <p className="text-xs text-muted-foreground">Saldo</p>
          <p className={`text-sm font-bold ${currentBalance >= 0 ? "text-success" : "text-danger"}`}>
            {formatCurrency(currentBalance)}
          </p>
        </div>
      </div>

      {/* Visual Timeline */}
      <div className="space-y-3">
        {chartData.map((item, index) => {
          const monthLabel = new Date(item.month + "-01T12:00:00")
            .toLocaleDateString("pt-BR", {
              month: "short",
              timeZone: "America/Sao_Paulo",
            })
            .replace(".", "")
          const isCurrentMonth = index === chartData.length - 1
          const balance = item.income - item.expense

          return (
            <div
              key={item.month}
              className={`relative rounded-lg p-3 transition-all ${
                isCurrentMonth ? "bg-primary/5 ring-1 ring-primary/20" : "hover:bg-muted/50"
              }`}
            >
              {/* Month label */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-sm font-medium capitalize ${
                    isCurrentMonth ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {monthLabel}
                  {isCurrentMonth && (
                    <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Atual</span>
                  )}
                </span>
                <div className="flex items-center gap-1">
                  {balance > 0 ? (
                    <TrendingUp className="h-3 w-3 text-success" />
                  ) : balance < 0 ? (
                    <TrendingDown className="h-3 w-3 text-danger" />
                  ) : (
                    <Minus className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span className={`text-xs font-medium ${balance >= 0 ? "text-success" : "text-danger"}`}>
                    {formatCurrency(balance)}
                  </span>
                </div>
              </div>

              {/* Progress bars */}
              <div className="space-y-1.5">
                {/* Income bar */}
                <div className="flex items-center gap-2">
                  <div className="w-16 text-xs text-muted-foreground">Receitas</div>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-success rounded-full transition-all duration-500"
                      style={{ width: `${(item.income / maxValue) * 100}%` }}
                    />
                  </div>
                  <div className="w-20 text-right text-xs text-success font-medium">{formatCurrency(item.income)}</div>
                </div>

                {/* Expense bar */}
                <div className="flex items-center gap-2">
                  <div className="w-16 text-xs text-muted-foreground">Despesas</div>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-danger rounded-full transition-all duration-500"
                      style={{ width: `${(item.expense / maxValue) * 100}%` }}
                    />
                  </div>
                  <div className="w-20 text-right text-xs text-danger font-medium">{formatCurrency(item.expense)}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Trend indicator */}
      {previousMonth && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-center gap-2 text-sm">
            {balanceChange > 0 ? (
              <>
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="text-success font-medium">+{balanceChange.toFixed(0)}%</span>
                <span className="text-muted-foreground">comparado ao mês anterior</span>
              </>
            ) : balanceChange < 0 ? (
              <>
                <TrendingDown className="h-4 w-4 text-danger" />
                <span className="text-danger font-medium">{balanceChange.toFixed(0)}%</span>
                <span className="text-muted-foreground">comparado ao mês anterior</span>
              </>
            ) : (
              <>
                <Minus className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Mesmo saldo do mês anterior</span>
              </>
            )}
          </div>
        </div>
      )}
    </AnimatedCard>
  )
}
