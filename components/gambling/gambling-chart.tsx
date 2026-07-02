"use client"

import { AnimatedCard } from "@/components/ui/animated-card"
import { TrendingUp, TrendingDown, Minus, DollarSign } from "lucide-react"

interface GamblingChartProps {
  data: Array<{
    month: string
    bet: number
    won: number
    lost: number
    net?: number
  }>
}

export function GamblingChart({ data }: GamblingChartProps) {
  if (data.length === 0) {
    return (
      <AnimatedCard>
        <h3 className="font-semibold mb-4">Evolução Mensal</h3>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          Registre apostas para ver a evolução
        </div>
      </AnimatedCard>
    )
  }

  // Calcular totais do mês atual
  const currentMonth = data[data.length - 1]
  const totalWon = currentMonth?.won || 0
  const totalLost = currentMonth?.lost || 0
  const netResult = totalWon - totalLost
  const totalBet = currentMonth?.bet || totalWon + totalLost

  // Calcular taxa de retorno
  const returnRate = totalBet > 0 ? ((totalWon / totalBet) * 100).toFixed(1) : "0"

  // Calcular tendência comparando com mês anterior
  const previousMonth = data.length > 1 ? data[data.length - 2] : null
  const previousNet = previousMonth ? previousMonth.won - previousMonth.lost : 0
  const trend = previousMonth ? netResult - previousNet : 0

  return (
    <AnimatedCard>
      <h3 className="font-semibold mb-4">Resumo do Mês - {currentMonth?.month}</h3>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Ganhos */}
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-500 mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium">Ganhos</span>
          </div>
          <p className="text-xl font-bold text-green-500">
            {totalWon.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </div>

        {/* Perdas */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-500 mb-1">
            <TrendingDown className="h-4 w-4" />
            <span className="text-xs font-medium">Perdas</span>
          </div>
          <p className="text-xl font-bold text-red-500">
            {totalLost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </div>
      </div>

      {/* Saldo líquido - destaque */}
      <div
        className={`rounded-lg p-4 mb-4 ${
          netResult >= 0
            ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30"
            : "bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Saldo Líquido</p>
            <p className={`text-2xl font-bold ${netResult >= 0 ? "text-green-500" : "text-red-500"}`}>
              {netResult >= 0 ? "+" : ""}
              {netResult.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
          </div>
          <div
            className={`h-12 w-12 rounded-full flex items-center justify-center ${
              netResult >= 0 ? "bg-green-500/20" : "bg-red-500/20"
            }`}
          >
            {netResult > 0 ? (
              <TrendingUp className={`h-6 w-6 text-green-500`} />
            ) : netResult < 0 ? (
              <TrendingDown className={`h-6 w-6 text-red-500`} />
            ) : (
              <Minus className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Barra de proporção visual */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Proporção Ganhos/Perdas</span>
            <span>{returnRate}% retorno</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden flex">
            {totalBet > 0 && (
              <>
                <div
                  className="bg-green-500 h-full transition-all duration-500"
                  style={{ width: `${(totalWon / (totalWon + totalLost)) * 100}%` }}
                />
                <div
                  className="bg-red-500 h-full transition-all duration-500"
                  style={{ width: `${(totalLost / (totalWon + totalLost)) * 100}%` }}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Comparação com mês anterior */}
      {previousMonth && (
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">vs {previousMonth.month}:</span>
          <span className={`font-medium ${trend >= 0 ? "text-green-500" : "text-red-500"}`}>
            {trend >= 0 ? "+" : ""}
            {trend.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </span>
        </div>
      )}

      {/* Histórico simplificado */}
      {data.length > 1 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Histórico</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {data.slice(-6).map((month, index) => {
              const monthNet = month.won - month.lost
              return (
                <div
                  key={index}
                  className={`flex-shrink-0 px-3 py-2 rounded-lg text-center min-w-[70px] ${
                    monthNet >= 0
                      ? "bg-green-500/10 border border-green-500/20"
                      : "bg-red-500/10 border border-red-500/20"
                  }`}
                >
                  <p className="text-xs text-muted-foreground">{month.month}</p>
                  <p className={`text-sm font-semibold ${monthNet >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {monthNet >= 0 ? "+" : ""}
                    {(monthNet / 1000).toFixed(1)}k
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </AnimatedCard>
  )
}
