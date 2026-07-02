"use client"

import { useState, useCallback } from "react"
import { motion } from "framer-motion"
import { ArrowUpRight, ArrowDownRight, Wallet, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatCard } from "@/components/ui/stat-card"
import { AnimatedCard } from "@/components/ui/animated-card"
import { TransactionList } from "./transaction-list"
import { AddTransactionDialog } from "./add-transaction-dialog"
import { ExpenseChart } from "./expense-chart"
import { MonthlyChart } from "./monthly-chart"
import { EmpatheticMessage } from "@/components/ui/empathetic-message"
import { PurchaseSimulator } from "@/components/dashboard/purchase-simulator"
import { toast } from "sonner"
import type { Income, Expense } from "@/lib/db"

interface FinancesModuleProps {
  data: {
    incomes: Income[]
    expenses: Expense[]
    incomeCategories: Array<{ id: string; name: string; color: string }>
    expenseCategories: Array<{ id: string; name: string; color: string }>
    totalIncome: number
    totalExpenses: number
    expensesByCategory: Array<{ category: string; color: string; total: number }>
    monthlyHistory: Array<{ month: string; type: string; total: number }>
    currentMonth: string
    monthlyIncome?: number
  }
  userId: string
}

export function FinancesModule({ data, userId }: FinancesModuleProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [transactionType, setTransactionType] = useState<"income" | "expense">("expense")
  const [incomes, setIncomes] = useState(data.incomes)
  const [expenses, setExpenses] = useState(data.expenses)
  const [expensesByCategory, setExpensesByCategory] = useState(data.expensesByCategory)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount), 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const balance = totalIncome - totalExpenses

  const today = new Date()
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  const daysLeft = lastDay.getDate() - today.getDate()
  const dailyBudget = daysLeft > 0 ? Math.max(0, balance / daysLeft) : 0

  const recalculateExpensesByCategory = useCallback((expenseList: Expense[]) => {
    const categoryTotals: Record<string, { category: string; color: string; total: number }> = {}

    expenseList.forEach((exp) => {
      const categoryName = exp.category_name || "Outros"
      const categoryColor = exp.category_color || "#888888"

      if (!categoryTotals[categoryName]) {
        categoryTotals[categoryName] = { category: categoryName, color: categoryColor, total: 0 }
      }
      categoryTotals[categoryName].total += Number(exp.amount)
    })

    return Object.values(categoryTotals).sort((a, b) => b.total - a.total)
  }, [])

  const updateChallengeProgress = async (type: "income" | "expense", amount: number) => {
    try {
      await fetch("/api/challenges/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeType: type === "expense" ? "reduce_expense" : "save_amount",
          value: amount,
        }),
      })
    } catch (error) {
      console.error("Error updating challenge progress:", error)
    }
  }

  const handleTransactionAdded = (transaction: Income | Expense, type: "income" | "expense") => {
    if (type === "income") {
      setIncomes((prev) => [transaction as Income, ...prev])
      toast.success("Receita registrada!", {
        description: "Continue acompanhando suas entradas.",
      })
    } else {
      const newExpenses = [transaction as Expense, ...expenses]
      setExpenses(newExpenses)
      setExpensesByCategory(recalculateExpensesByCategory(newExpenses))
      toast("Despesa registrada", {
        description: "Tudo sob controle. Você está no caminho certo!",
      })
    }

    updateChallengeProgress(type, Number((transaction as any).amount))
  }

  const handleTransactionDeleted = (id: string, type: "income" | "expense") => {
    if (type === "income") {
      setIncomes((prev) => prev.filter((i) => i.id !== id))
    } else {
      const newExpenses = expenses.filter((e) => e.id !== id)
      setExpenses(newExpenses)
      setExpensesByCategory(recalculateExpensesByCategory(newExpenses))
    }
    toast.success("Transação removida")
  }

  const refreshData = async () => {
    setIsRefreshing(true)
    try {
      const res = await fetch(`/api/finances/summary?month=${data.currentMonth}`)
      if (res.ok) {
        const newData = await res.json()
        if (newData.incomes) setIncomes(newData.incomes)
        if (newData.expenses) {
          setExpenses(newData.expenses)
          setExpensesByCategory(recalculateExpensesByCategory(newData.expenses))
        }
        toast.success("Dados atualizados!")
      }
    } catch (error) {
      console.error("Error refreshing data:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const currentMonthLabel = new Date(data.currentMonth + "-01T12:00:00").toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  })

  const getEmpatheticContent = () => {
    const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0

    if (balance < 0) {
      return {
        type: "warning" as const,
        title: "Vamos ajustar juntos",
        message: `Você está R$ ${Math.abs(balance).toFixed(2)} no vermelho este mês. Pequenos ajustes podem fazer diferença!`,
        action: { label: "Ver onde cortar", href: "#expenses" },
      }
    }
    if (savingsRate >= 20) {
      return {
        type: "success" as const,
        title: "Excelente controle!",
        message: `Você está economizando ${savingsRate.toFixed(0)}% da sua renda. Continue assim!`,
      }
    }
    if (savingsRate >= 10) {
      return {
        type: "tip" as const,
        title: "Bom progresso",
        message: "Você está no caminho certo. Que tal tentar economizar um pouco mais?",
      }
    }
    return null
  }

  const empatheticContent = getEmpatheticContent()

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Controle Financeiro</h1>
          <p className="text-muted-foreground capitalize">{currentMonthLabel}</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Button variant="outline" size="sm" onClick={refreshData} disabled={isRefreshing} className="bg-transparent">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
          <PurchaseSimulator
            remainingBudget={balance}
            dailyBudget={dailyBudget}
            daysLeft={daysLeft}
            monthlyIncome={data.monthlyIncome || totalIncome}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTransactionType("income")
              setIsAddDialogOpen(true)
            }}
            className="bg-transparent border-success/50 text-success hover:bg-success/10"
          >
            <ArrowUpRight className="mr-1 sm:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Receita</span>
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setTransactionType("expense")
              setIsAddDialogOpen(true)
            }}
            className="gradient-danger text-danger-foreground"
          >
            <ArrowDownRight className="mr-1 sm:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Despesa</span>
          </Button>
        </div>
      </motion.div>

      {empatheticContent && (
        <EmpatheticMessage
          type={empatheticContent.type}
          title={empatheticContent.title}
          message={empatheticContent.message}
          action={empatheticContent.action}
        />
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Receitas do Mês" value={totalIncome} icon={ArrowUpRight} color="success" delay={0.1} />
        <StatCard title="Despesas do Mês" value={totalExpenses} icon={ArrowDownRight} color="danger" delay={0.2} />
        <StatCard
          title="Saldo do Mês"
          value={balance}
          icon={Wallet}
          color={balance >= 0 ? "success" : "danger"}
          delay={0.3}
        />
      </div>

      {/* Charts - using real-time state */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ExpenseChart data={expensesByCategory} />
        <MonthlyChart data={data.monthlyHistory} incomes={incomes} expenses={expenses} />
      </div>

      {/* Transactions */}
      <AnimatedCard delay={0.5} id="expenses">
        <Tabs defaultValue="all" className="w-full">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
            <h3 className="font-semibold text-foreground">Transações</h3>
            <TabsList>
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="incomes">Receitas</TabsTrigger>
              <TabsTrigger value="expenses">Despesas</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="mt-0">
            <TransactionList
              transactions={[
                ...incomes.map((i) => ({ ...i, type: "income" as const })),
                ...expenses.map((e) => ({ ...e, type: "expense" as const })),
              ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())}
              onDelete={handleTransactionDeleted}
            />
          </TabsContent>

          <TabsContent value="incomes" className="mt-0">
            <TransactionList
              transactions={incomes.map((i) => ({ ...i, type: "income" as const }))}
              onDelete={handleTransactionDeleted}
            />
          </TabsContent>

          <TabsContent value="expenses" className="mt-0">
            <TransactionList
              transactions={expenses.map((e) => ({ ...e, type: "expense" as const }))}
              onDelete={handleTransactionDeleted}
            />
          </TabsContent>
        </Tabs>
      </AnimatedCard>

      {/* Add transaction dialog */}
      <AddTransactionDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        type={transactionType}
        categories={transactionType === "income" ? data.incomeCategories : data.expenseCategories}
        onTransactionAdded={handleTransactionAdded}
      />
    </div>
  )
}
