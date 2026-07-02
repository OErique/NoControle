"use client"

import { useState, useMemo } from "react"
import { Calculator, TrendingDown } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { formatCurrency } from "@/lib/utils"
import type { Debt } from "@/lib/db"

interface DebtSimulatorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  debts: Debt[]
}

export function DebtSimulator({ open, onOpenChange, debts }: DebtSimulatorProps) {
  const totalDebt = debts.reduce((sum, d) => sum + d.current_amount, 0)
  const avgInterest = debts.length > 0 ? debts.reduce((sum, d) => sum + (d.interest_rate || 0), 0) / debts.length : 0

  const [monthlyPayment, setMonthlyPayment] = useState(totalDebt * 0.1 || 500)

  const simulation = useMemo(() => {
    if (monthlyPayment <= 0 || totalDebt <= 0) {
      return { months: 0, totalPaid: 0, totalInterest: 0 }
    }

    let remaining = totalDebt
    let months = 0
    let totalPaid = 0
    const maxMonths = 360 // 30 years max

    while (remaining > 0 && months < maxMonths) {
      // Apply monthly interest
      const interest = remaining * (avgInterest / 100)
      remaining += interest

      // Subtract payment
      const payment = Math.min(monthlyPayment, remaining)
      remaining -= payment
      totalPaid += payment
      months++
    }

    return {
      months,
      totalPaid,
      totalInterest: totalPaid - totalDebt,
    }
  }, [monthlyPayment, totalDebt, avgInterest])

  const years = Math.floor(simulation.months / 12)
  const remainingMonths = simulation.months % 12

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Simulador de Quitação
          </DialogTitle>
          <DialogDescription>Simule quanto tempo levará para quitar todas as suas dívidas</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current debt summary */}
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total em dívidas</p>
                <p className="text-xl font-bold text-danger">{formatCurrency(totalDebt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taxa média de juros</p>
                <p className="text-xl font-bold text-warning">{avgInterest.toFixed(1)}% ao mês</p>
              </div>
            </div>
          </div>

          {/* Payment slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Pagamento mensal</Label>
              <span className="text-lg font-bold text-primary">{formatCurrency(monthlyPayment)}</span>
            </div>
            <Slider
              value={[monthlyPayment]}
              onValueChange={(value) => setMonthlyPayment(value[0])}
              min={100}
              max={Math.max(totalDebt * 0.5, 1000)}
              step={50}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatCurrency(100)}</span>
              <span>{formatCurrency(Math.max(totalDebt * 0.5, 1000))}</span>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Resultado da Simulação</h4>

            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-primary/10 p-4 text-center">
                <TrendingDown className="mx-auto mb-2 h-6 w-6 text-primary" />
                <p className="text-2xl font-bold text-foreground">
                  {years > 0 ? `${years}a ${remainingMonths}m` : `${simulation.months}m`}
                </p>
                <p className="text-xs text-muted-foreground">Tempo para quitar</p>
              </div>

              <div className="rounded-lg bg-success/10 p-4 text-center">
                <p className="text-2xl font-bold text-success">{formatCurrency(simulation.totalPaid)}</p>
                <p className="text-xs text-muted-foreground">Total a pagar</p>
              </div>

              <div className="rounded-lg bg-danger/10 p-4 text-center">
                <p className="text-2xl font-bold text-danger">{formatCurrency(simulation.totalInterest)}</p>
                <p className="text-xs text-muted-foreground">Total em juros</p>
              </div>
            </div>

            {simulation.months >= 360 && (
              <p className="text-sm text-danger">
                Com esse valor de pagamento, suas dívidas nunca serão quitadas devido aos juros. Aumente o valor mensal.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
