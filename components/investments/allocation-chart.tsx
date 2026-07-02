"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { formatCurrency } from "@/lib/utils"

interface Investment {
  id: string
  type_name: string
  current_value?: number
  current_amount?: number
  initial_amount?: number
  invested_amount?: number
}

interface AllocationChartProps {
  investments: Investment[]
}

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"]

export function AllocationChart({ investments }: AllocationChartProps) {
  const allocationData = investments.reduce(
    (acc, inv) => {
      const value =
        Number(inv.current_value) ||
        Number(inv.current_amount) ||
        Number(inv.initial_amount) ||
        Number(inv.invested_amount) ||
        0

      if (value <= 0 || isNaN(value)) return acc

      const typeName = inv.type_name || "Outros"
      const existing = acc.find((item) => item.name === typeName)
      if (existing) {
        existing.value += value
      } else {
        acc.push({ name: typeName, value })
      }
      return acc
    },
    [] as { name: string; value: number }[],
  )

  const total = allocationData.reduce((sum, item) => sum + item.value, 0)

  const dataWithPercentage = allocationData.map((item) => ({
    ...item,
    percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0",
  }))

  if (dataWithPercentage.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        Nenhum investimento para exibir
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={dataWithPercentage}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
        >
          {dataWithPercentage.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload
              return (
                <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
                  <p className="font-medium">{data.name}</p>
                  <p className="text-sm text-muted-foreground">{formatCurrency(data.value)}</p>
                  <p className="text-sm font-semibold text-primary">{data.percentage}%</p>
                </div>
              )
            }
            return null
          }}
        />
        <Legend
          formatter={(value, entry: any) => (
            <span className="text-sm text-foreground">
              {value} ({entry.payload.percentage}%)
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
