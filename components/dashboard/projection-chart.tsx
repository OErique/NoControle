"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { AlertTriangle, Info } from "lucide-react"
import { AnimatedCard } from "@/components/ui/animated-card"
import { formatCurrency } from "@/lib/utils"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"

interface ProjectionChartProps {
  currentBalance: number
  dailyExpenseAverage: number
  expectedIncome: number
  daysInMonth: number
  currentDay: number
}

export function ProjectionChart({
  currentBalance,
  dailyExpenseAverage,
  expectedIncome,
  daysInMonth,
  currentDay,
}: ProjectionChartProps) {
  const projectionData = useMemo(() => {
    const data = []
    let balance = currentBalance

    // Past days (actual)
    for (let day = 1; day <= currentDay; day++) {
      data.push({
        day,
        balance: balance + (day - 1) * dailyExpenseAverage * 0.3, // Simplified past
        type: "actual",
      })
    }

    // Future days (projected)
    balance = currentBalance
    for (let day = currentDay + 1; day <= daysInMonth; day++) {
      balance -= dailyExpenseAverage

      // Add income on typical pay days
      if (day === 5 || day === 20) {
        balance += expectedIncome / 2
      }

      data.push({
        day,
        balance: Math.round(balance * 100) / 100,
        type: "projected",
      })
    }

    return data
  }, [currentBalance, dailyExpenseAverage, expectedIncome, daysInMonth, currentDay])

  const endBalance = projectionData[projectionData.length - 1]?.balance || 0
  const lowestPoint = Math.min(...projectionData.map((d) => d.balance))
  const willGoNegative = lowestPoint < 0

  return (
    <AnimatedCard delay={0.35}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">Projeção de Saldo</h3>
            <button className="text-muted-foreground hover:text-foreground">
              <Info className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground">Próximos {daysInMonth - currentDay} dias</p>
        </div>

        <div className="text-right">
          <p className="text-sm text-muted-foreground">Saldo estimado fim do mês</p>
          <p className={`text-xl font-bold ${endBalance >= 0 ? "text-success" : "text-danger"}`}>
            {formatCurrency(endBalance)}
          </p>
        </div>
      </div>

      {/* Warning if going negative */}
      {willGoNegative && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center gap-2 rounded-lg bg-warning/10 border border-warning/30 p-3"
        >
          <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
          <p className="text-sm text-muted-foreground">
            <span className="text-warning font-medium">Atenção:</span> Sua projeção indica saldo negativo. Considere
            reduzir gastos.
          </p>
        </motion.div>
      )}

      {/* Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="oklch(0.7 0.15 160)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="oklch(0.7 0.15 160)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="oklch(0.65 0.2 25)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="oklch(0.65 0.2 25)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "oklch(0.6 0 0)", fontSize: 12 }}
              tickFormatter={(day) => `${day}`}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "oklch(0.6 0 0)", fontSize: 12 }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              width={40}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "oklch(0.2 0.02 260)",
                border: "1px solid oklch(0.3 0.02 260)",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "oklch(0.9 0 0)" }}
              formatter={(value: number) => [formatCurrency(value), "Saldo"]}
              labelFormatter={(day) => `Dia ${day}`}
            />
            <ReferenceLine y={0} stroke="oklch(0.65 0.2 25)" strokeDasharray="3 3" />
            <ReferenceLine
              x={currentDay}
              stroke="oklch(0.7 0.15 160)"
              strokeDasharray="3 3"
              label={{ value: "Hoje", fill: "oklch(0.7 0.15 160)", fontSize: 10 }}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="oklch(0.7 0.15 160)"
              strokeWidth={2}
              fill="url(#balanceGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <span>Saldo projetado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-px w-4 border-t-2 border-dashed border-primary" />
          <span>Hoje</span>
        </div>
      </div>
    </AnimatedCard>
  )
}
