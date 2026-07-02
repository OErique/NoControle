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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import type { Debt } from "@/lib/db"

interface AddDebtDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Array<{ id: string; name: string; color: string }>
  onDebtAdded: (debt: Debt) => void
}

export function AddDebtDialog({ open, onOpenChange, categories, onDebtAdded }: AddDebtDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    creditor: "",
    categoryId: "",
    originalAmount: "",
    currentAmount: "",
    interestRate: "",
    dueDate: "",
    minimumPayment: "",
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

    try {
      const response = await fetch("/api/debts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creditor: formData.creditor,
          categoryId: formData.categoryId || null,
          originalAmount: parseCurrency(formData.originalAmount),
          currentAmount: parseCurrency(formData.currentAmount || formData.originalAmount),
          interestRate: Number.parseFloat(formData.interestRate) || 0,
          dueDate: formData.dueDate || null,
          minimumPayment: parseCurrency(formData.minimumPayment) || null,
          notes: formData.notes || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao adicionar dívida")
      }

      const newDebt = await response.json()
      onDebtAdded(newDebt)
      toast.success("Dívida adicionada com sucesso!")
      onOpenChange(false)
      setFormData({
        creditor: "",
        categoryId: "",
        originalAmount: "",
        currentAmount: "",
        interestRate: "",
        dueDate: "",
        minimumPayment: "",
        notes: "",
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao adicionar dívida")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Dívida</DialogTitle>
          <DialogDescription>Preencha os detalhes da sua dívida para começar a gerenciá-la.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="creditor">Credor / Instituição *</Label>
              <Input
                id="creditor"
                placeholder="Ex: Banco XYZ, Cartão Visa..."
                value={formData.creditor}
                onChange={(e) => setFormData({ ...formData, creditor: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
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
              <Label htmlFor="interestRate">Taxa de Juros (% ao mês)</Label>
              <Input
                id="interestRate"
                type="number"
                step="0.01"
                placeholder="Ex: 12.5"
                value={formData.interestRate}
                onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="originalAmount">Valor Original *</Label>
              <Input
                id="originalAmount"
                placeholder="R$ 0,00"
                value={formData.originalAmount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    originalAmount: formatCurrencyInput(e.target.value),
                  })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentAmount">Valor Atual</Label>
              <Input
                id="currentAmount"
                placeholder="R$ 0,00 (mesmo que original)"
                value={formData.currentAmount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    currentAmount: formatCurrencyInput(e.target.value),
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Data de Vencimento</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minimumPayment">Pagamento Mínimo</Label>
              <Input
                id="minimumPayment"
                placeholder="R$ 0,00"
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
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Informações adicionais sobre a dívida..."
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
                "Adicionar Dívida"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
