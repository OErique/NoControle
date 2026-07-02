"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { formatCurrency } from "@/lib/utils"

interface Investment {
  id: string
  name: string
  invested_amount?: number
  current_value?: number
  initial_amount?: number
  current_amount?: number
}

interface InvestmentChartProps {
  investments: Investment[]
}

export function InvestmentChart({ investments }: InvestmentChartProps) {
  const chartData = investments
    .map((inv) => {
      const invested = Number(inv.invested_amount) || Number(inv.initial_amount) || 0
      const current = Number(inv.current_value) || Number(inv.current_amount) || 0
      const returnValue = current - invested
      const returnPercentage = invested > 0 ? (returnValue / invested) * 100 : 0

      return {
        name: inv.name.length > 12 ? inv.name.substring(0, 12) + "..." : inv.name,
        fullName: inv.name,
        return: isNaN(returnPercentage) ? 0 : Number.parseFloat(returnPercentage.toFixed(2)),
        invested: isNaN(invested) ? 0 : invested,
        current: isNaN(current) ? 0 : current,
        returnValue: isNaN(returnValue) ? 0 : returnValue,
      }
    })
    .filter((item) => item.invested > 0)
    .sort((a, b) => b.return - a.return)

  if (chartData.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        Nenhum investimento para exibir
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ left: 10, right: 20, top: 20, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          tickFormatter={(value) => `${value.toFixed(0)}%`}
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload
              return (
                <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
                  <p className="font-medium mb-2">{data.fullName}</p>
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">Investido: {formatCurrency(data.invested)}</p>
                    <p className="text-muted-foreground">Atual: {formatCurrency(data.current)}</p>
                    <p className={`font-semibold ${data.return >= 0 ? "text-green-500" : "text-red-500"}`}>
                      Retorno: {data.return >= 0 ? "+" : ""}
                      {data.return.toFixed(2)}% ({data.returnValue >= 0 ? "+" : ""}
                      {formatCurrency(data.returnValue)})
                    </p>
                  </div>
                </div>
              )
            }
            return null
          }}
        />
        <Line
          type="monotone"
          dataKey="return"
          stroke="hsl(var(--primary))"
          strokeWidth={3}
          dot={{ r: 6, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "hsl(var(--background))" }}
          activeDot={{ r: 8, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "hsl(var(--background))" }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
