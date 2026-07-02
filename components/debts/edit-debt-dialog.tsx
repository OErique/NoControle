"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import type { Debt } from "@/lib/db"

interface EditDebtDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  debt: Debt
  categories: Array<{ id: string; name: string; color: string }>
  onUpdate: (debt: Debt) => void
}

export function EditDebtDialog({ open, onOpenChange, debt, categories, onUpdate }: EditDebtDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    creditor: "",
    categoryId: "",
    currentAmount: "",
    interestRate: "",
    dueDate: "",
    minimumPayment: "",
    notes: "",
    status: "",
  })

  useEffect(() => {
    if (debt) {
      setFormData({
        creditor: debt.creditor,
        categoryId: debt.category_id || "",
        currentAmount: formatCurrencyValue(debt.current_amount),
        interestRate: debt.interest_rate?.toString() || "",
        dueDate: debt.due_date ? new Date(debt.due_date).toISOString().split("T")[0] : "",
        minimumPayment: debt.minimum_payment ? formatCurrencyValue(debt.minimum_payment) : "",
        notes: debt.notes || "",
        status: debt.status,
      })
    }
  }, [debt])

  function formatCurrencyValue(value: number) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  function formatCurrencyInput(value: string) {
    const numbers = value.replace(/\D/g, "")
    const amount = Number.parseFloat(numbers) / 100
    if (isNaN(amount)) return ""
    return formatCurrencyValue(amount)
  }

  function parseCurrency(value: string): number {
    return Number.parseFloat(value.replace(/\D/g, "")) / 100 || 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/debts/${debt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creditor: formData.creditor,
          categoryId: formData.categoryId || null,
          currentAmount: parseCurrency(formData.currentAmount),
          interestRate: Number.parseFloat(formData.interestRate) || 0,
          dueDate: formData.dueDate || null,
          minimumPayment: parseCurrency(formData.minimumPayment) || null,
          notes: formData.notes || null,
          status: formData.status,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao atualizar dívida")
      }

      const updatedDebt = await response.json()
      onUpdate(updatedDebt)
      toast.success("Dívida atualizada com sucesso!")
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar dívida")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Dívida</DialogTitle>
          <DialogDescription>Atualize os detalhes da sua dívida.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="edit-creditor">Credor / Instituição</Label>
              <Input
                id="edit-creditor"
                value={formData.creditor}
                onChange={(e) => setFormData({ ...formData, creditor: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">Categoria</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="negotiating">Em negociação</SelectItem>
                  <SelectItem value="paid">Quitada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-currentAmount">Valor Atual</Label>
              <Input
                id="edit-currentAmount"
                value={formData.currentAmount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    currentAmount: formatCurrencyInput(e.target.value),
                  })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-interestRate">Taxa de Juros (% ao mês)</Label>
              <Input
                id="edit-interestRate"
                type="number"
                step="0.01"
                value={formData.interestRate}
                onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-dueDate">Data de Vencimento</Label>
              <Input
                id="edit-dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-minimumPayment">Pagamento Mínimo</Label>
              <Input
                id="edit-minimumPayment"
                value={formData.minimumPayment}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minimumPayment: formatCurrencyInput(e.target.value),
                  })
                }
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="edit-notes">Observações</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="bg-transparent">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="gradient-primary text-primary-foreground">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
