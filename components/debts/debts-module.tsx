"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Plus, AlertTriangle, TrendingDown, Target, Calculator } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/ui/stat-card"
import { AnimatedCard } from "@/components/ui/animated-card"
import { DebtCard } from "./debt-card"
import { AddDebtDialog } from "./add-debt-dialog"
import { DebtSimulator } from "./debt-simulator"
import { DebtChart } from "./debt-chart"
import type { Debt } from "@/lib/db"

interface DebtsModuleProps {
  data: {
    debts: Debt[]
    categories: Array<{ id: string; name: string; color: string; icon: string }>
    stats: {
      total_active: number
      total_paid: number
      active_count: number
      paid_count: number
      avg_interest: number
    }
    paymentHistory: Array<{ month: string; total_paid: number }>
  }
  userId: string
}

export function DebtsModule({ data, userId }: DebtsModuleProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false)
  const [debts, setDebts] = useState(data.debts)

  const activeDebts = debts.filter((d) => d.status === "active")
  const paidDebts = debts.filter((d) => d.status === "paid")

  // Sort by priority (highest interest rate first)
  const prioritizedDebts = [...activeDebts].sort((a, b) => (b.interest_rate || 0) - (a.interest_rate || 0))

  const handleDebtAdded = (newDebt: Debt) => {
    setDebts([newDebt, ...debts])
  }

  const handleDebtUpdated = (updatedDebt: Debt) => {
    setDebts(debts.map((d) => (d.id === updatedDebt.id ? updatedDebt : d)))
  }

  const handleDebtDeleted = (debtId: string) => {
    setDebts(debts.filter((d) => d.id !== debtId))
  }

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
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Sair do Vermelho</h1>
          <p className="text-muted-foreground">Gerencie suas dívidas e crie um plano para quitá-las</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setIsSimulatorOpen(true)} className="bg-transparent">
            <Calculator className="mr-2 h-4 w-4" />
            Simular
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} className="gradient-primary text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" />
            Nova Dívida
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total em Dívidas"
          value={Number(data.stats.total_active)}
          icon={AlertTriangle}
          color="danger"
          delay={0.1}
        />
        <StatCard
          title="Dívidas Ativas"
          value={Number(data.stats.active_count)}
          icon={Target}
          format="number"
          color="warning"
          delay={0.2}
        />
        <StatCard
          title="Taxa Média de Juros"
          value={Number(data.stats.avg_interest)}
          icon={TrendingDown}
          format="percent"
          color="danger"
          delay={0.3}
        />
        <StatCard
          title="Total Já Pago"
          value={Number(data.stats.total_paid)}
          icon={Target}
          color="success"
          delay={0.4}
        />
      </div>

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Debts list */}
        <div className="lg:col-span-2 space-y-6">
          {/* Priority recommendation */}
          {prioritizedDebts.length > 0 && prioritizedDebts[0].interest_rate > 0 && (
            <AnimatedCard delay={0.5} className="border-warning/30 bg-gradient-to-r from-warning/10 to-warning/5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-warning/20">
                  <AlertTriangle className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Prioridade de Pagamento</h3>
                  <p className="text-sm text-muted-foreground">
                    Recomendamos quitar primeiro a dívida{" "}
                    <span className="font-medium text-warning">{prioritizedDebts[0].creditor}</span> com{" "}
                    <span className="font-medium text-warning">{prioritizedDebts[0].interest_rate}%</span> de juros ao
                    mês. Isso economizará mais dinheiro a longo prazo.
                  </p>
                </div>
              </div>
            </AnimatedCard>
          )}

          {/* Active debts */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-foreground">Dívidas Ativas ({activeDebts.length})</h2>
            {activeDebts.length > 0 ? (
              <div className="space-y-4">
                {prioritizedDebts.map((debt, index) => (
                  <DebtCard
                    key={debt.id}
                    debt={debt}
                    priority={index + 1}
                    categories={data.categories}
                    onUpdate={handleDebtUpdated}
                    onDelete={handleDebtDeleted}
                  />
                ))}
              </div>
            ) : (
              <AnimatedCard className="text-center py-12">
                <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                <h3 className="font-semibold text-foreground">Nenhuma dívida cadastrada</h3>
                <p className="mt-1 text-sm text-muted-foreground">Adicione suas dívidas para começar a gerenciá-las</p>
                <Button
                  onClick={() => setIsAddDialogOpen(true)}
                  className="mt-4 gradient-primary text-primary-foreground"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Dívida
                </Button>
              </AnimatedCard>
            )}
          </div>

          {/* Paid debts */}
          {paidDebts.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-foreground">Dívidas Quitadas ({paidDebts.length})</h2>
              <div className="space-y-4">
                {paidDebts.map((debt) => (
                  <DebtCard
                    key={debt.id}
                    debt={debt}
                    categories={data.categories}
                    onUpdate={handleDebtUpdated}
                    onDelete={handleDebtDeleted}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment evolution chart */}
          <DebtChart debts={activeDebts} paymentHistory={data.paymentHistory} />

          {/* Quick tips */}
          <AnimatedCard delay={0.7}>
            <h3 className="mb-4 font-semibold text-foreground">Dicas para Sair do Vermelho</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span className="text-muted-foreground">
                  Pague primeiro as dívidas com <span className="text-foreground">maiores taxas de juros</span>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span className="text-muted-foreground">
                  Negocie suas dívidas para <span className="text-foreground">reduzir juros e parcelas</span>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span className="text-muted-foreground">
                  Evite fazer <span className="text-foreground">novas dívidas</span> enquanto quita as atuais
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span className="text-muted-foreground">
                  Reserve pelo menos <span className="text-foreground">30% da renda</span> para quitar dívidas
                </span>
              </li>
            </ul>
          </AnimatedCard>
        </div>
      </div>

      {/* Dialogs */}
      <AddDebtDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        categories={data.categories}
        onDebtAdded={handleDebtAdded}
      />

      <DebtSimulator open={isSimulatorOpen} onOpenChange={setIsSimulatorOpen} debts={activeDebts} />
    </div>
  )
}
