"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Loader2, ArrowUpRight, ArrowDownRight, CreditCardIcon, AlertCircle } from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import type { Income, Expense } from "@/lib/db"
import { identifyBank } from "@/lib/bank-brands"

interface CreditCard {
  id: string
  name: string
  last_digits: string
  brand: string
  color: string
  credit_limit: number
  available_limit: number
}

interface AddTransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: "income" | "expense"
  categories: Array<{ id: string; name: string; color: string }>
  onTransactionAdded: (transaction: Income | Expense, type: "income" | "expense") => void
}

export function AddTransactionDialog({
  open,
  onOpenChange,
  type,
  categories,
  onTransactionAdded,
}: AddTransactionDialogProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [creditCards, setCreditCards] = useState<CreditCard[]>([])
  const [isLoadingCards, setIsLoadingCards] = useState(false)

  const getTodayDate = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    categoryId: "",
    date: getTodayDate(),
    isRecurring: false,
    recurrenceType: "monthly",
    useCreditCard: false,
    creditCardId: "",
    totalInstallments: 1,
  })

  useEffect(() => {
    if (open) {
      setFormData((prev) => ({ ...prev, date: getTodayDate() }))
    }
  }, [open])

  useEffect(() => {
    if (open && type === "expense") {
      setIsLoadingCards(true)
      fetch("/api/credit-cards")
        .then((res) => res.json())
        .then((data) => {
          const cardsArray = Array.isArray(data) ? data : data.cards || []
          setCreditCards(cardsArray)
        })
        .catch(() => {
          setCreditCards([])
        })
        .finally(() => {
          setIsLoadingCards(false)
        })
    }
  }, [open, type])

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

    if (formData.useCreditCard && !formData.creditCardId) {
      toast.error("Selecione um cartão de crédito")
      setIsLoading(false)
      return
    }

    try {
      const endpoint = type === "income" ? "/api/incomes" : "/api/expenses"
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: formData.description,
          amount: parseCurrency(formData.amount),
          categoryId: formData.categoryId || null,
          date: formData.date,
          isRecurring: formData.isRecurring,
          recurrenceType: formData.isRecurring ? formData.recurrenceType : null,
          creditCardId: formData.useCreditCard ? formData.creditCardId : null,
          totalInstallments: formData.useCreditCard ? formData.totalInstallments : null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao adicionar transação")
      }

      const newTransaction = await response.json()
      onTransactionAdded(newTransaction, type)

      if (newTransaction.totalInstallmentsCreated) {
        toast.success(`Compra parcelada adicionada!`, {
          description: `${newTransaction.totalInstallmentsCreated}x de ${formatCurrencyInput(String(Math.round((parseCurrency(formData.amount) / formData.totalInstallments) * 100)))}`,
        })
      } else {
        toast.success(`${type === "income" ? "Receita" : "Despesa"} adicionada com sucesso!`)
      }

      onOpenChange(false)
      setFormData({
        description: "",
        amount: "",
        categoryId: "",
        date: getTodayDate(),
        isRecurring: false,
        recurrenceType: "monthly",
        useCreditCard: false,
        creditCardId: "",
        totalInstallments: 1,
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao adicionar transação")
    } finally {
      setIsLoading(false)
    }
  }

  const isIncome = type === "income"
  const selectedCard = creditCards.find((c) => c.id === formData.creditCardId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg",
                isIncome ? "bg-success/20" : "bg-danger/20",
              )}
            >
              {isIncome ? (
                <ArrowUpRight className="h-5 w-5 text-success" />
              ) : (
                <ArrowDownRight className="h-5 w-5 text-danger" />
              )}
            </div>
            Nova {isIncome ? "Receita" : "Despesa"}
          </DialogTitle>
          <DialogDescription>
            {isIncome ? "Registre uma nova entrada de dinheiro" : "Registre um novo gasto"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Valor *</Label>
            <Input
              id="amount"
              placeholder="R$ 0,00"
              value={formData.amount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  amount: formatCurrencyInput(e.target.value),
                })
              }
              required
              className={cn("text-2xl font-bold h-14 text-center", isIncome ? "text-success" : "text-danger")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Input
              id="description"
              placeholder={isIncome ? "Ex: Salário, Freelance..." : "Ex: Mercado, Aluguel..."}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          {!isIncome && (
            <div className="space-y-4 rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Cartão de Crédito</p>
                    <p className="text-sm text-muted-foreground">Compra no cartão com parcelas</p>
                  </div>
                </div>
                <Switch
                  checked={formData.useCreditCard}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, useCreditCard: checked, totalInstallments: checked ? 1 : 1 })
                  }
                />
              </div>

              {formData.useCreditCard && (
                <div className="space-y-3 pt-2">
                  {isLoadingCards ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : creditCards.length > 0 ? (
                    <>
                      <div className="space-y-2">
                        <Label>Cartão</Label>
                        <Select
                          value={formData.creditCardId}
                          onValueChange={(value) => setFormData({ ...formData, creditCardId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o cartão..." />
                          </SelectTrigger>
                          <SelectContent>
                            {creditCards.map((card) => {
                              const bankInfo = identifyBank(card.name)
                              return (
                                <SelectItem key={card.id} value={card.id}>
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: bankInfo.color }} />
                                    {card.name} {card.last_digits && `(****${card.last_digits})`}
                                  </div>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Preview do cartão selecionado */}
                      {selectedCard && (
                        <div
                          className={`rounded-lg p-3 bg-gradient-to-r ${identifyBank(selectedCard.name).gradient}`}
                          style={{ color: identifyBank(selectedCard.name).textColor }}
                        >
                          <div className="flex justify-between items-center text-sm">
                            <span>{selectedCard.name}</span>
                            <span>•••• {selectedCard.last_digits}</span>
                          </div>
                          <p className="text-xs opacity-80 mt-1">
                            Disponível:{" "}
                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                              selectedCard.available_limit || selectedCard.credit_limit,
                            )}
                          </p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Parcelas</Label>
                        <Select
                          value={String(formData.totalInstallments)}
                          onValueChange={(value) => setFormData({ ...formData, totalInstallments: Number(value) })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                              <SelectItem key={num} value={String(num)}>
                                {num === 1 ? "À vista" : `${num}x sem juros`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formData.totalInstallments > 1 && formData.amount && (
                          <p className="text-sm text-muted-foreground">
                            {formData.totalInstallments}x de{" "}
                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                              parseCurrency(formData.amount) / formData.totalInstallments,
                            )}
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    /* Aviso quando não há cartões cadastrados */
                    <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-foreground">Nenhum cartão cadastrado</p>
                          <p className="text-sm text-muted-foreground">
                            Você precisa cadastrar um cartão no módulo Cartões antes de lançar despesas no crédito.
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              onOpenChange(false)
                              router.push("/cards")
                            }}
                            className="mt-2"
                          >
                            <CreditCardIcon className="mr-2 h-4 w-4" />
                            Ir para Cartões
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!formData.useCreditCard && (
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="font-medium text-foreground">Transação recorrente</p>
                <p className="text-sm text-muted-foreground">Repetir automaticamente</p>
              </div>
              <Switch
                checked={formData.isRecurring}
                onCheckedChange={(checked) => setFormData({ ...formData, isRecurring: checked })}
              />
            </div>
          )}

          {formData.isRecurring && !formData.useCreditCard && (
            <div className="space-y-2">
              <Label htmlFor="recurrence">Frequência</Label>
              <Select
                value={formData.recurrenceType}
                onValueChange={(value) => setFormData({ ...formData, recurrenceType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="bg-transparent">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || (formData.useCreditCard && creditCards.length === 0)}
              className={cn(isIncome ? "bg-success hover:bg-success/90" : "gradient-danger", "text-white")}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                `Adicionar ${isIncome ? "Receita" : "Despesa"}`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
