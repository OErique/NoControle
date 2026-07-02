"use client"

import type React from "react"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"
import type { Debt } from "@/lib/db"

interface PayDebtDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  debt: Debt
  onUpdate: (debt: Debt) => void
}

export function PayDebtDialog({ open, onOpenChange, debt, onUpdate }: PayDebtDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    notes: "",
  })

  function formatCurrencyInput(value: string) {
    const numbers = value.replace(/\D/g, "")
    const amount = Number.parseFloat(numbers) / 100
    if (isNaN(amount)) return ""
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount)
  }

  function parseCurrency(value: string): number {
    return Number.parseFloat(value.replace(/\D/g, "")) / 100 || 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    const paymentAmount = parseCurrency(formData.amount)

    if (paymentAmount <= 0) {
      toast.error("Informe um valor válido")
      setIsLoading(false)
      return
    }

    if (paymentAmount > debt.current_amount) {
      toast.error("O valor do pagamento não pode ser maior que o valor da dívida")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/debts/${debt.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: paymentAmount,
          paymentDate: formData.paymentDate,
          notes: formData.notes || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao registrar pagamento")
      }

      const updatedDebt = await response.json()
      onUpdate(updatedDebt)
      toast.success("Pagamento registrado com sucesso!")
      onOpenChange(false)
      setFormData({
        amount: "",
        paymentDate: new Date().toISOString().split("T")[0],
        notes: "",
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao registrar pagamento")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
          <DialogDescription>
            Registre um pagamento para a dívida com <span className="font-medium">{debt.creditor}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg bg-muted/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Valor atual da dívida</span>
            <span className="font-semibold text-danger">{formatCurrency(debt.current_amount)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payment-amount">Valor do Pagamento *</Label>
            <Input
              id="payment-amount"
              placeholder="R$ 0,00"
              value={formData.amount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  amount: formatCurrencyInput(e.target.value),
                })
              }
              required
              className="text-lg font-semibold"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-date">Data do Pagamento</Label>
            <Input
              id="payment-date"
              type="date"
              value={formData.paymentDate}
              onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-notes">Observações</Label>
            <Textarea
              id="payment-notes"
              placeholder="Informações sobre o pagamento..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="bg-transparent">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="gradient-primary text-primary-foreground">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                "Registrar Pagamento"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
