"use client"

import { useState } from "react"
import { MoreVertical, TrendingUp, TrendingDown, Trash2, RefreshCw, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCurrency } from "@/lib/utils"

interface Investment {
  id: string
  name: string
  type_name: string
  invested_amount?: number
  current_value?: number
  initial_amount?: number
  current_amount?: number
  purchase_date?: string
  start_date?: string
}

interface InvestmentCardProps {
  investment: Investment
  onDelete: () => void
  onUpdateValue: (value: number) => void
}

export function InvestmentCard({ investment, onDelete, onUpdateValue }: InvestmentCardProps) {
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [newValue, setNewValue] = useState("")

  const investedAmount = investment.invested_amount ?? investment.initial_amount ?? 0
  const currentValue = investment.current_value ?? investment.current_amount ?? 0
  const purchaseDate = investment.purchase_date ?? investment.start_date

  const returnAmount = currentValue - investedAmount
  const returnPercentage = investedAmount > 0 ? (returnAmount / investedAmount) * 100 : 0
  const isPositive = returnAmount >= 0

  const handleUpdateSubmit = () => {
    const cleanValue = newValue.replace(/[^\d,]/g, "").replace(",", ".")
    const value = Number.parseFloat(cleanValue)
    if (value > 0) {
      onUpdateValue(value)
      setShowUpdateDialog(false)
      setNewValue("")
    }
  }

  const formatInputCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (!numbers) return ""
    const amount = Number.parseInt(numbers) / 100
    return amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  }

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "Data não informada"
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return "Data inválida"
      return date.toLocaleDateString("pt-BR")
    } catch {
      return "Data inválida"
    }
  }

  return (
    <>
      <Card className="group relative overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/5">
        <div className={`absolute inset-x-0 top-0 h-1 ${isPositive ? "bg-success" : "bg-danger"}`} />

        <CardContent className="p-5">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <span className="mb-1 inline-block rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {investment.type_name || "Investimento"}
              </span>
              <h4 className="font-semibold">{investment.name}</h4>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowUpdateDialog(true)}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Atualizar Valor
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-danger">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Investido</span>
              <span className="font-medium">{formatCurrency(investedAmount)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Valor Atual</span>
              <span className="font-semibold text-primary">{formatCurrency(currentValue)}</span>
            </div>

            <div className="border-t border-border pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Retorno</span>
                <div className="flex items-center gap-2">
                  {isPositive ? (
                    <TrendingUp className="h-4 w-4 text-success" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-danger" />
                  )}
                  <span className={`font-semibold ${isPositive ? "text-success" : "text-danger"}`}>
                    {isPositive ? "+" : ""}
                    {returnPercentage.toFixed(2)}%
                  </span>
                </div>
              </div>
              <p className={`text-right text-sm ${isPositive ? "text-success" : "text-danger"}`}>
                {isPositive ? "+" : ""}
                {formatCurrency(returnAmount)}
              </p>
            </div>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">Desde {formatDate(purchaseDate)}</p>
        </CardContent>
      </Card>

      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Atualizar Valor</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 h-6 w-6"
              onClick={() => setShowUpdateDialog(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Atualize o valor atual de <strong>{investment.name}</strong>
            </p>

            <div className="space-y-2">
              <Label>Novo Valor</Label>
              <Input
                placeholder="R$ 0,00"
                value={newValue}
                onChange={(e) => setNewValue(formatInputCurrency(e.target.value))}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowUpdateDialog(false)} className="bg-transparent">
              Cancelar
            </Button>
            <Button onClick={handleUpdateSubmit}>Atualizar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
