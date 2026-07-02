"use client"

import { useState, useMemo } from "react"
import { Check, X, ArrowUpCircle, ArrowDownCircle, AlertTriangle, Loader2, Calendar, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn, formatCurrency, formatDate } from "@/lib/utils"
import type { ParsedTransaction } from "./import-module"

interface ImportPreviewProps {
  transactions: ParsedTransaction[]
  summary: {
    total: number
    unique: number
    duplicates: number
    totalIncome: number
    totalExpense: number
    periodStart: string
    periodEnd: string
  }
  categories: {
    expense: Array<{ id: string; name: string; color: string }>
    income: Array<{ id: string; name: string; color: string }>
  }
  onConfirm: (transactions: ParsedTransaction[]) => Promise<void>
  onCancel: () => void
  isLoading: boolean
}

export function ImportPreview({
  transactions: initialTransactions,
  summary,
  categories,
  onConfirm,
  onCancel,
  isLoading,
}: ImportPreviewProps) {
  const [transactions, setTransactions] = useState(initialTransactions)
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all")
  const [showDuplicates, setShowDuplicates] = useState(true)

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (!showDuplicates && t.isDuplicate) return false
      if (filter === "income" && t.type !== "income") return false
      if (filter === "expense" && t.type !== "expense") return false
      return true
    })
  }, [transactions, filter, showDuplicates])

  const selectedCount = transactions.filter((t) => t.selected).length
  const selectedIncome = transactions
    .filter((t) => t.selected && t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0)
  const selectedExpense = transactions
    .filter((t) => t.selected && t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0)

  const toggleAll = (checked: boolean) => {
    setTransactions((prev) =>
      prev.map((t) => ({
        ...t,
        selected: t.isDuplicate ? false : checked,
      })),
    )
  }

  const toggleTransaction = (index: number) => {
    setTransactions((prev) => prev.map((t, i) => (i === index ? { ...t, selected: !t.selected } : t)))
  }

  const updateTransaction = (index: number, field: "description" | "amount" | "categoryId", value: string | number) => {
    setTransactions((prev) =>
      prev.map((t, i) => {
        if (i !== index) return t
        if (field === "categoryId") {
          const categoryList = t.type === "income" ? categories.income : categories.expense
          const category = categoryList.find((c) => c.id === value)
          return {
            ...t,
            categoryId: value as string,
            categoryName: category?.name || "Não categorizado",
          }
        }
        return { ...t, [field]: value }
      }),
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card/50">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{summary.total}</div>
            <p className="text-sm text-muted-foreground">Transações encontradas</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-success">{formatCurrency(summary.totalIncome)}</div>
            <p className="text-sm text-muted-foreground">Total em receitas</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-danger">{formatCurrency(summary.totalExpense)}</div>
            <p className="text-sm text-muted-foreground">Total em despesas</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {formatDate(summary.periodStart)} - {formatDate(summary.periodEnd)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Período identificado</p>
          </CardContent>
        </Card>
      </div>

      {/* Duplicates warning */}
      {summary.duplicates > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-warning/50 bg-warning/10 p-4">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-warning">{summary.duplicates} transação(ões) já existe(m) no sistema</p>
            <p className="text-sm text-muted-foreground">
              Duplicatas foram desmarcadas automaticamente para evitar registros repetidos.
            </p>
          </div>
        </div>
      )}

      {/* Transactions list */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Transações para Importar</CardTitle>
              <CardDescription>Revise e edite as transações antes de confirmar</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="income">Receitas</SelectItem>
                  <SelectItem value="expense">Despesas</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => setShowDuplicates(!showDuplicates)}>
                {showDuplicates ? "Ocultar" : "Mostrar"} duplicatas
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Header */}
          <div className="flex items-center gap-4 py-3 px-2 border-b border-border text-sm font-medium text-muted-foreground">
            <Checkbox
              checked={selectedCount === transactions.filter((t) => !t.isDuplicate).length}
              onCheckedChange={(checked) => toggleAll(!!checked)}
            />
            <div className="w-24">Data</div>
            <div className="flex-1">Descrição</div>
            <div className="w-32">Categoria</div>
            <div className="w-28 text-right">Valor</div>
          </div>

          {/* Transactions */}
          <div className="max-h-[400px] overflow-y-auto">
            {filteredTransactions.map((transaction, index) => {
              const realIndex = transactions.indexOf(transaction)
              const categoryList = transaction.type === "income" ? categories.income : categories.expense

              return (
                <div
                  key={index}
                  className={cn(
                    "flex items-center gap-4 py-3 px-2 border-b border-border/50 transition-colors",
                    transaction.isDuplicate && "opacity-50 bg-muted/30",
                    transaction.selected && "bg-primary/5",
                  )}
                >
                  <Checkbox
                    checked={transaction.selected}
                    onCheckedChange={() => toggleTransaction(realIndex)}
                    disabled={transaction.isDuplicate}
                  />

                  <div className="w-24 text-sm">{formatDate(transaction.date)}</div>

                  <div className="flex-1">
                    <Input
                      value={transaction.description}
                      onChange={(e) => updateTransaction(realIndex, "description", e.target.value)}
                      className="h-8 text-sm"
                      disabled={transaction.isDuplicate}
                    />
                  </div>

                  <div className="w-32">
                    <Select
                      value={transaction.categoryId || ""}
                      onValueChange={(v) => updateTransaction(realIndex, "categoryId", v)}
                      disabled={transaction.isDuplicate}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryList.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div
                    className={cn(
                      "w-28 text-right font-medium flex items-center justify-end gap-1",
                      transaction.type === "income" ? "text-success" : "text-danger",
                    )}
                  >
                    {transaction.type === "income" ? (
                      <ArrowUpCircle className="h-4 w-4" />
                    ) : (
                      <ArrowDownCircle className="h-4 w-4" />
                    )}
                    {formatCurrency(transaction.amount)}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-border bg-card/50 p-4">
        <div>
          <p className="font-medium">{selectedCount} transação(ões) selecionada(s)</p>
          <p className="text-sm text-muted-foreground">
            Receitas: {formatCurrency(selectedIncome)} | Despesas: {formatCurrency(selectedExpense)}
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button
            onClick={() => onConfirm(transactions)}
            disabled={isLoading || selectedCount === 0}
            className="gradient-primary"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Confirmar Importação
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
