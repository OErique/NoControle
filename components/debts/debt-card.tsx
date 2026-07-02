"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { MoreVertical, Edit, Trash2, CheckCircle, Calendar, Percent, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ProgressRing } from "@/components/ui/progress-ring"
import { formatCurrency, formatDate } from "@/lib/utils"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { Debt } from "@/lib/db"
import { EditDebtDialog } from "./edit-debt-dialog"
import { PayDebtDialog } from "./pay-debt-dialog"

interface DebtCardProps {
  debt: Debt
  priority?: number
  categories: Array<{ id: string; name: string; color: string; icon: string }>
  onUpdate: (debt: Debt) => void
  onDelete: (debtId: string) => void
}

export function DebtCard({ debt, priority, categories, onUpdate, onDelete }: DebtCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isPayOpen, setIsPayOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const progress = ((debt.original_amount - debt.current_amount) / debt.original_amount) * 100
  const isPaid = debt.status === "paid"

  const dueDate = debt.due_date ? new Date(debt.due_date) : null
  const today = new Date()
  const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0
  const isUrgent = daysUntilDue !== null && daysUntilDue <= 7 && daysUntilDue >= 0

  async function handleMarkAsPaid() {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/debts/${debt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid", current_amount: 0 }),
      })

      if (!response.ok) throw new Error("Erro ao atualizar dívida")

      const updatedDebt = await response.json()
      onUpdate(updatedDebt)
      toast.success("Dívida marcada como quitada!")
    } catch (error) {
      toast.error("Erro ao atualizar dívida")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete() {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/debts/${debt.id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Erro ao excluir dívida")

      onDelete(debt.id)
      toast.success("Dívida excluída com sucesso!")
    } catch (error) {
      toast.error("Erro ao excluir dívida")
    } finally {
      setIsLoading(false)
      setIsDeleteOpen(false)
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative rounded-xl border p-4 transition-all hover:shadow-lg",
          isPaid
            ? "border-success/30 bg-success/5"
            : isOverdue
              ? "border-danger/50 bg-danger/5"
              : isUrgent
                ? "border-warning/50 bg-warning/5"
                : "border-border bg-card hover:border-border/80",
        )}
      >
        {/* Priority badge */}
        {priority && !isPaid && (
          <div className="absolute -left-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-danger text-xs font-bold text-danger-foreground">
            {priority}
          </div>
        )}

        <div className="flex items-start gap-4">
          {/* Progress ring */}
          <ProgressRing
            progress={progress}
            size={80}
            strokeWidth={6}
            color={isPaid ? "success" : progress > 50 ? "warning" : "danger"}
            showLabel={false}
          />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground truncate">{debt.creditor}</h3>
                  {isPaid && (
                    <span className="flex items-center gap-1 rounded-full bg-success/20 px-2 py-0.5 text-xs font-medium text-success">
                      <CheckCircle className="h-3 w-3" />
                      Quitada
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{debt.category_name || "Sem categoria"}</p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsPayOpen(true)}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Registrar pagamento
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  {!isPaid && (
                    <DropdownMenuItem onClick={handleMarkAsPaid}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Marcar como quitada
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setIsDeleteOpen(true)} className="text-danger focus:text-danger">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Stats */}
            <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Valor atual</p>
                <p className="font-semibold text-danger">{formatCurrency(debt.current_amount)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valor original</p>
                <p className="font-medium text-foreground">{formatCurrency(debt.original_amount)}</p>
              </div>
              {debt.interest_rate > 0 && (
                <div className="flex items-center gap-1">
                  <Percent className="h-3 w-3 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Juros/mês</p>
                    <p className="font-medium text-warning">{debt.interest_rate}%</p>
                  </div>
                </div>
              )}
              {dueDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Vencimento</p>
                    <p
                      className={cn(
                        "font-medium",
                        isOverdue ? "text-danger" : isUrgent ? "text-warning" : "text-foreground",
                      )}
                    >
                      {formatDate(dueDate)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{progress.toFixed(0)}% pago</span>
                <span className="text-muted-foreground">Faltam {formatCurrency(debt.current_amount)}</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className={cn(
                    "h-full rounded-full",
                    isPaid ? "bg-success" : progress > 50 ? "bg-warning" : "bg-danger",
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Dialogs */}
      <EditDebtDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        debt={debt}
        categories={categories}
        onUpdate={onUpdate}
      />

      <PayDebtDialog open={isPayOpen} onOpenChange={setIsPayOpen} debt={debt} onUpdate={onUpdate} />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir dívida</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a dívida com {debt.creditor}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-danger text-danger-foreground hover:bg-danger/90"
            >
              {isLoading ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
