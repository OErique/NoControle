"use client"

import { useState } from "react"
import { Trash2, ArrowUpRight, ArrowDownRight, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
import { formatCurrency, formatDate } from "@/lib/utils"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Transaction {
  id: string
  description: string
  amount: number
  date: string
  category_name?: string | null
  category_color?: string | null
  type: "income" | "expense"
}

interface TransactionListProps {
  transactions: Transaction[]
  onDelete: (id: string, type: "income" | "expense") => void
}

export function TransactionList({ transactions, onDelete }: TransactionListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteType, setDeleteType] = useState<"income" | "expense">("expense")
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    if (!deleteId) return
    setIsDeleting(true)

    try {
      const endpoint = deleteType === "income" ? "/api/incomes" : "/api/expenses"
      const response = await fetch(`${endpoint}/${deleteId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Erro ao excluir")

      onDelete(deleteId, deleteType)
      toast.success("Transação excluída com sucesso!")
    } catch (error) {
      toast.error("Erro ao excluir transação")
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
          <ArrowUpRight className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">Nenhuma transação encontrada</p>
        <p className="text-sm text-muted-foreground">Adicione receitas ou despesas para começar</p>
      </div>
    )
  }

  return (
    <>
      <div className="divide-y divide-border">
        {transactions.map((transaction) => (
          <div key={`${transaction.type}-${transaction.id}`} className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  transaction.type === "income" ? "bg-success/20" : "bg-danger/20",
                )}
              >
                {transaction.type === "income" ? (
                  <ArrowUpRight className="h-5 w-5 text-success" />
                ) : (
                  <ArrowDownRight className="h-5 w-5 text-danger" />
                )}
              </div>
              <div>
                <p className="font-medium text-foreground">{transaction.description}</p>
                <p className="text-sm text-muted-foreground">
                  {transaction.category_name || "Sem categoria"} • {formatDate(transaction.date)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={cn("font-semibold", transaction.type === "income" ? "text-success" : "text-danger")}>
                {transaction.type === "income" ? "+" : "-"}
                {formatCurrency(Number(transaction.amount))}
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setDeleteId(transaction.id)
                      setDeleteType(transaction.type)
                    }}
                    className="text-danger focus:text-danger"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir transação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-danger text-danger-foreground hover:bg-danger/90"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
