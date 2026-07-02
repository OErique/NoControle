"use client"

import { AnimatedCard } from "@/components/ui/animated-card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { formatCurrency } from "@/lib/utils"

interface ExpenseChartProps {
  data: Array<{ category: string; color: string; total: number }>
}

export function ExpenseChart({ data }: ExpenseChartProps) {
  const total = data.reduce((sum, item) => sum + Number(item.total), 0)

  if (data.length === 0) {
    return (
      <AnimatedCard delay={0.4}>
        <h3 className="mb-4 font-semibold text-foreground">Despesas por Categoria</h3>
        <div className="flex h-48 items-center justify-center text-center">
          <p className="text-muted-foreground">Adicione despesas para ver o gráfico</p>
        </div>
      </AnimatedCard>
    )
  }

  return (
    <AnimatedCard delay={0.4}>
      <h3 className="mb-4 font-semibold text-foreground">Despesas por Categoria</h3>

      <div className="flex items-center gap-6">
        <div className="h-48 w-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={2}
                dataKey="total"
                nameKey="category"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || `hsl(${index * 45}, 70%, 50%)`} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    const percentage = ((Number(data.total) / total) * 100).toFixed(1)
                    return (
                      <div className="rounded-lg border border-border bg-card p-2 shadow-lg">
                        <p className="font-medium">{data.category}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(Number(data.total))} ({percentage}%)
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-2">
          {data.slice(0, 5).map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-muted-foreground">{item.category}</span>
              </div>
              <span className="text-sm font-medium text-foreground">{formatCurrency(Number(item.total))}</span>
            </div>
          ))}
        </div>
      </div>
    </AnimatedCard>
  )
}
