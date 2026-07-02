"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ShoppingBag, Calculator, AlertTriangle, CheckCircle, X, TrendingDown, Calendar } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCurrency } from "@/lib/utils"

interface PurchaseSimulatorProps {
  remainingBudget: number
  dailyBudget: number
  daysLeft: number
  monthlyIncome: number
}

export function PurchaseSimulator({ remainingBudget, dailyBudget, daysLeft, monthlyIncome }: PurchaseSimulatorProps) {
  const [open, setOpen] = useState(false)
  const [purchaseAmount, setPurchaseAmount] = useState("")
  const [installments, setInstallments] = useState("1")

  const amount = Number.parseFloat(purchaseAmount.replace(/[^\d,]/g, "").replace(",", ".")) || 0
  const numInstallments = Number.parseInt(installments) || 1
  const installmentValue = amount / numInstallments

  const simulation = useMemo(() => {
    if (amount <= 0) return null

    const newRemainingBudget = remainingBudget - amount
    const newDailyBudget = daysLeft > 0 ? Math.max(0, newRemainingBudget / daysLeft) : 0
    const percentOfIncome = (amount / monthlyIncome) * 100
    const monthlyImpact = numInstallments > 1 ? installmentValue : amount

    let verdict: "safe" | "caution" | "danger"
    let message: string

    if (newRemainingBudget < 0) {
      verdict = "danger"
      message = "Esta compra vai te deixar no vermelho este mês. Considere esperar ou reduzir o valor."
    } else if (newDailyBudget < dailyBudget * 0.3) {
      verdict = "caution"
      message = "Você pode fazer, mas seu orçamento diário ficará bem apertado. Gaste com cuidado depois."
    } else if (percentOfIncome > 30) {
      verdict = "caution"
      message = "Esta compra representa mais de 30% da sua renda. Avalie se é realmente necessário."
    } else {
      verdict = "safe"
      message = "Esta compra cabe no seu orçamento! Você ainda terá margem para o resto do mês."
    }

    return {
      newRemainingBudget,
      newDailyBudget,
      percentOfIncome,
      monthlyImpact,
      installmentValue,
      verdict,
      message,
    }
  }, [amount, remainingBudget, daysLeft, dailyBudget, monthlyIncome, numInstallments, installmentValue])

  const formatInputCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    const amount = Number.parseInt(numbers) / 100
    if (isNaN(amount)) return ""
    return amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPurchaseAmount(formatInputCurrency(e.target.value))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <Calculator className="h-4 w-4" />
          Simular compra
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Simulador de Compra
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Input fields */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="amount">Valor da compra</Label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                <Input
                  id="amount"
                  value={purchaseAmount}
                  onChange={handleAmountChange}
                  className="pl-10"
                  placeholder="0,00"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="installments">Parcelas</Label>
              <select
                id="installments"
                value={installments}
                onChange={(e) => setInstallments(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="1">À vista</option>
                <option value="2">2x sem juros</option>
                <option value="3">3x sem juros</option>
                <option value="4">4x sem juros</option>
                <option value="5">5x sem juros</option>
                <option value="6">6x sem juros</option>
                <option value="7">7x sem juros</option>
                <option value="8">8x sem juros</option>
                <option value="9">9x sem juros</option>
                <option value="10">10x sem juros</option>
                <option value="11">11x sem juros</option>
                <option value="12">12x sem juros</option>
              </select>
            </div>
          </div>

          {/* Simulation result */}
          <AnimatePresence mode="wait">
            {simulation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                {/* Verdict */}
                <div
                  className={`rounded-lg p-4 ${
                    simulation.verdict === "safe"
                      ? "bg-success/10 border border-success/30"
                      : simulation.verdict === "caution"
                        ? "bg-warning/10 border border-warning/30"
                        : "bg-danger/10 border border-danger/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {simulation.verdict === "safe" ? (
                      <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
                    ) : simulation.verdict === "caution" ? (
                      <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                    ) : (
                      <X className="h-5 w-5 text-danger shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p
                        className={`font-medium ${
                          simulation.verdict === "safe"
                            ? "text-success"
                            : simulation.verdict === "caution"
                              ? "text-warning"
                              : "text-danger"
                        }`}
                      >
                        {simulation.verdict === "safe"
                          ? "Compra segura!"
                          : simulation.verdict === "caution"
                            ? "Cuidado!"
                            : "Não recomendado"}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">{simulation.message}</p>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                      <TrendingDown className="h-3 w-3" />
                      Novo saldo do mês
                    </div>
                    <p
                      className={`font-semibold ${simulation.newRemainingBudget >= 0 ? "text-foreground" : "text-danger"}`}
                    >
                      {formatCurrency(simulation.newRemainingBudget)}
                    </p>
                  </div>

                  <div className="rounded-lg bg-muted/50 p-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                      <Calendar className="h-3 w-3" />
                      Novo orçamento diário
                    </div>
                    <p
                      className={`font-semibold ${simulation.newDailyBudget > dailyBudget * 0.5 ? "text-foreground" : "text-warning"}`}
                    >
                      {formatCurrency(simulation.newDailyBudget)}
                    </p>
                  </div>

                  {numInstallments > 1 && (
                    <>
                      <div className="rounded-lg bg-muted/50 p-3">
                        <div className="text-muted-foreground text-xs mb-1">Valor da parcela</div>
                        <p className="font-semibold">{formatCurrency(simulation.installmentValue)}</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-3">
                        <div className="text-muted-foreground text-xs mb-1">Impacto mensal</div>
                        <p className="font-semibold">{formatCurrency(simulation.monthlyImpact)}</p>
                      </div>
                    </>
                  )}
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Esta compra representa {simulation.percentOfIncome.toFixed(1)}% da sua renda mensal
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
}
