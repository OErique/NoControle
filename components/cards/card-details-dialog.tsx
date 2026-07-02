"use client"

import { CreditCard, Calendar, Receipt } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { formatCurrency } from "@/lib/utils"

interface CardDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  card: {
    id: string
    name: string
    brand: string
    last_digits: string
    credit_limit: number
    current_balance: number
    available_limit: number
    closing_day: number
    due_day: number
  }
  invoices: Array<{
    id: string
    reference_month: number
    reference_year: number
    total_amount: number
    status: string
    due_date: string
  }>
}

export function CardDetailsDialog({ open, onOpenChange, card, invoices }: CardDetailsDialogProps) {
  const usagePercent = card.credit_limit > 0 ? (card.current_balance / card.credit_limit) * 100 : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            {card.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Card info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Bandeira</p>
              <p className="font-medium">{card.brand?.toUpperCase() || "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Final</p>
              <p className="font-medium">•••• {card.last_digits || "0000"}</p>
            </div>
          </div>

          {/* Usage */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Utilização</span>
              <span className="font-medium">{usagePercent.toFixed(0)}%</span>
            </div>
            <Progress value={usagePercent} className="h-3" />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Limite</p>
                <p className="font-semibold text-sm">{formatCurrency(card.credit_limit)}</p>
              </div>
              <div className="p-3 rounded-lg bg-danger/10">
                <p className="text-xs text-muted-foreground mb-1">Usado</p>
                <p className="font-semibold text-sm text-danger">{formatCurrency(card.current_balance)}</p>
              </div>
              <div className="p-3 rounded-lg bg-success/10">
                <p className="text-xs text-muted-foreground mb-1">Disponível</p>
                <p className="font-semibold text-sm text-success">
                  {formatCurrency(card.credit_limit - card.current_balance)}
                </p>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Fechamento</p>
                <p className="font-medium">Dia {card.closing_day}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
              <Receipt className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Vencimento</p>
                <p className="font-medium">Dia {card.due_day}</p>
              </div>
            </div>
          </div>

          {/* Invoices history */}
          {invoices.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Histórico de Faturas</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-2 rounded border border-border">
                    <span className="text-sm">
                      {invoice.reference_month}/{invoice.reference_year}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatCurrency(invoice.total_amount)}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          invoice.status === "paid" ? "bg-success/20 text-success" : "bg-warning/20 text-warning"
                        }`}
                      >
                        {invoice.status === "paid" ? "Pago" : "Aberto"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
