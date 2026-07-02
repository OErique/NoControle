"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Loader2, CreditCard, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { identifyBank } from "@/lib/bank-brands"

interface EditCardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  card: {
    id: string
    name: string
    brand: string
    last_digits: string
    credit_limit: number
    closing_day: number
    due_day: number
    color?: string
  }
  onSuccess: () => void
}

const brands = [
  { value: "visa", label: "Visa" },
  { value: "mastercard", label: "Mastercard" },
  { value: "elo", label: "Elo" },
  { value: "amex", label: "American Express" },
  { value: "hipercard", label: "Hipercard" },
]

export function EditCardDialog({ open, onOpenChange, card, onSuccess }: EditCardDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    last_digits: "",
    credit_limit: "",
    closing_day: "",
    due_day: "",
  })

  // Preview do banco identificado
  const identifiedBank = identifyBank(formData.name)

  useEffect(() => {
    if (open && card) {
      setFormData({
        name: card.name || "",
        brand: card.brand || "",
        last_digits: card.last_digits || "",
        credit_limit: String(card.credit_limit || ""),
        closing_day: String(card.closing_day || ""),
        due_day: String(card.due_day || ""),
      })
    }
  }, [open, card])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch(`/api/credit-cards/${card.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          brand: formData.brand || "visa",
          last_digits: formData.last_digits || "0000",
          credit_limit: Number(formData.credit_limit),
          closing_day: Number(formData.closing_day) || 15,
          due_day: Number(formData.due_day) || 25,
          color: identifiedBank.color,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        toast.success("Cartão atualizado com sucesso!")
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error(data.error || "Erro ao atualizar cartão")
      }
    } catch (error) {
      toast.error("Erro ao atualizar cartão")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Editar Cartão
          </DialogTitle>
          <DialogDescription>Atualize as informações do seu cartão</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Preview do cartão */}
          <div className={`relative rounded-xl bg-gradient-to-br ${identifiedBank.gradient} p-4 text-white shadow-lg`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm opacity-80">{identifiedBank.name}</span>
              <Palette className="h-4 w-4 opacity-60" />
            </div>
            <p className="text-lg font-semibold truncate">{formData.name || "Nome do Cartão"}</p>
            <p className="text-sm opacity-80 mt-2">•••• •••• •••• {formData.last_digits || "0000"}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome do Cartão *</Label>
            <Input
              id="name"
              placeholder="Ex: Nubank, Inter, C6..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">A cor será identificada automaticamente pelo nome do banco</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Bandeira</Label>
              <Select value={formData.brand} onValueChange={(value) => setFormData({ ...formData, brand: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand.value} value={brand.value}>
                      {brand.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_digits">Últimos 4 Dígitos</Label>
              <Input
                id="last_digits"
                placeholder="0000"
                maxLength={4}
                value={formData.last_digits}
                onChange={(e) => setFormData({ ...formData, last_digits: e.target.value.replace(/\D/g, "") })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="credit_limit">Limite de Crédito *</Label>
            <Input
              id="credit_limit"
              type="number"
              step="0.01"
              min="1"
              placeholder="5000.00"
              value={formData.credit_limit}
              onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="closing_day">Dia de Fechamento</Label>
              <Input
                id="closing_day"
                type="number"
                min="1"
                max="31"
                placeholder="15"
                value={formData.closing_day}
                onChange={(e) => setFormData({ ...formData, closing_day: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_day">Dia de Vencimento</Label>
              <Input
                id="due_day"
                type="number"
                min="1"
                max="31"
                placeholder="25"
                value={formData.due_day}
                onChange={(e) => setFormData({ ...formData, due_day: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
