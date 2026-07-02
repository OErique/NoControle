"use client"

import type React from "react"

import { useState } from "react"
import { Loader2, DollarSign, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AddBetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (bet: {
    bet_date: string
    amount_bet: number
    amount_won: number
    platform: string
    notes: string
  }) => void
}

const platforms = [
  "Bet365",
  "Betano",
  "Sportingbet",
  "Pixbet",
  "Stake",
  "Blaze",
  "Cassino Online",
  "Loteria",
  "Poker",
  "Outro",
]

export function AddBetDialog({ open, onOpenChange, onSubmit }: AddBetDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    bet_date: new Date().toISOString().split("T")[0],
    amount_bet: "",
    amount_won: "",
    platform: "",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await onSubmit({
        bet_date: formData.bet_date,
        amount_bet: Number.parseFloat(formData.amount_bet) || 0,
        amount_won: Number.parseFloat(formData.amount_won) || 0,
        platform: formData.platform,
        notes: formData.notes,
      })

      setFormData({
        bet_date: new Date().toISOString().split("T")[0],
        amount_bet: "",
        amount_won: "",
        platform: "",
        notes: "",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const result = (Number.parseFloat(formData.amount_won) || 0) - (Number.parseFloat(formData.amount_bet) || 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Aposta</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bet_date">Data</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="bet_date"
                  type="date"
                  value={formData.bet_date}
                  onChange={(e) => setFormData({ ...formData, bet_date: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="platform">Plataforma</Label>
              <Select
                value={formData.platform}
                onValueChange={(value) => setFormData({ ...formData, platform: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount_bet">Valor Apostado</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount_bet"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={formData.amount_bet}
                  onChange={(e) => setFormData({ ...formData, amount_bet: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount_won">Valor Ganho</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount_won"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={formData.amount_won}
                  onChange={(e) => setFormData({ ...formData, amount_won: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Result preview */}
          {(formData.amount_bet || formData.amount_won) && (
            <div className={`p-3 rounded-lg ${result >= 0 ? "bg-success/10" : "bg-danger/10"}`}>
              <p className="text-sm text-muted-foreground">Resultado:</p>
              <p className={`text-lg font-bold ${result >= 0 ? "text-success" : "text-danger"}`}>
                {result >= 0 ? "+" : ""}
                {result.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Detalhes da aposta..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
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
                "Registrar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
