"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, TrendingUp, TrendingDown, Wallet, PiggyBank, BarChart3, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AnimatedCard } from "@/components/ui/animated-card"
import { InvestmentCard } from "./investment-card"
import { AddInvestmentDialog } from "./add-investment-dialog"
import { InvestmentChart } from "./investment-chart"
import { AllocationChart } from "./allocation-chart"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"

interface Investment {
  id: string
  name: string
  type_id: string
  type_name: string
  type_icon?: string
  initial_amount: number
  current_amount: number
  start_date: string
  notes: string | null
  institution?: string
}

interface Stats {
  total_invested: number
  current_value: number
  total_return: number
  return_percentage: number
}

export function InvestmentsModule() {
  const [investments, setInvestments] = useState<Investment[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [types, setTypes] = useState<{ id: string; name: string; icon?: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchData = async () => {
    try {
      const [investmentsRes, typesRes] = await Promise.all([fetch("/api/investments"), fetch("/api/investments/types")])

      if (investmentsRes.ok) {
        const data = await investmentsRes.json()
        setInvestments(data.investments || [])
        setStats(data.stats)
      }

      if (typesRes.ok) {
        const data = await typesRes.json()
        setTypes(data.types || data || [])
      }
    } catch (error) {
      console.error("Error fetching investments:", error)
      toast.error("Erro ao carregar investimentos")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAddInvestment = async (data: {
    name: string
    typeId: string
    initialAmount: number
    currentAmount: number
    startDate: string
    notes?: string
    institution?: string
  }) => {
    try {
      const res = await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        toast.success("Investimento adicionado com sucesso!")
        fetchData()
        setShowAddDialog(false)
      } else {
        const error = await res.json()
        throw new Error(error.error || "Erro ao adicionar investimento")
      }
    } catch (error) {
      console.error("Error adding investment:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao adicionar investimento")
    }
  }

  const handleDeleteInvestment = async (id: string) => {
    try {
      const res = await fetch(`/api/investments/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Investimento removido")
        fetchData()
      }
    } catch (error) {
      console.error("Error deleting investment:", error)
      toast.error("Erro ao remover investimento")
    }
  }

  const handleUpdateValue = async (id: string, newValue: number) => {
    try {
      const res = await fetch(`/api/investments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentAmount: newValue }),
      })

      if (res.ok) {
        toast.success("Valor atualizado!")
        fetchData()
      }
    } catch (error) {
      console.error("Error updating investment:", error)
      toast.error("Erro ao atualizar valor")
    }
  }

  const refreshPrices = async () => {
    setIsRefreshing(true)
    try {
      const res = await fetch("/api/investments/refresh-prices", { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        toast.success(`${data.updated || 0} investimentos atualizados`)
        fetchData()
      }
    } catch (error) {
      console.error("Error refreshing prices:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const returnColor = (stats?.total_return ?? 0) >= 0 ? "text-success" : "text-danger"
  const ReturnIcon = (stats?.total_return ?? 0) >= 0 ? TrendingUp : TrendingDown

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Investimentos</h1>
          <p className="text-muted-foreground">Acompanhe seus investimentos e patrimonio</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshPrices} disabled={isRefreshing} className="gap-2 bg-transparent">
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Atualizar Precos
          </Button>
          <Button onClick={() => setShowAddDialog(true)} className="gap-2 gradient-primary">
            <Plus className="h-4 w-4" />
            Novo Investimento
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AnimatedCard delay={0}>
          <div className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Investido</p>
              <p className="text-2xl font-bold">{formatCurrency(stats?.total_invested ?? 0)}</p>
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard delay={0.1}>
          <div className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
              <PiggyBank className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor Atual</p>
              <p className="text-2xl font-bold">{formatCurrency(stats?.current_value ?? 0)}</p>
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard delay={0.2}>
          <div className="flex items-center gap-4 p-6">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ${(stats?.total_return ?? 0) >= 0 ? "bg-success/20" : "bg-danger/20"}`}
            >
              <ReturnIcon className={`h-6 w-6 ${returnColor}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Retorno Total</p>
              <p className={`text-2xl font-bold ${returnColor}`}>
                {(stats?.total_return ?? 0) >= 0 ? "+" : ""}
                {formatCurrency(stats?.total_return ?? 0)}
              </p>
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard delay={0.3}>
          <div className="flex items-center gap-4 p-6">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ${(stats?.return_percentage ?? 0) >= 0 ? "bg-success/20" : "bg-danger/20"}`}
            >
              <BarChart3 className={`h-6 w-6 ${returnColor}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rentabilidade</p>
              <p className={`text-2xl font-bold ${returnColor}`}>
                {(stats?.return_percentage ?? 0) >= 0 ? "+" : ""}
                {(stats?.return_percentage ?? 0).toFixed(2)}%
              </p>
            </div>
          </div>
        </AnimatedCard>
      </div>

      {/* Charts */}
      {investments.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <AnimatedCard delay={0.4}>
            <div className="p-6">
              <h3 className="mb-4 text-lg font-semibold">Alocacao por Tipo</h3>
              <AllocationChart investments={investments} />
            </div>
          </AnimatedCard>

          <AnimatedCard delay={0.5}>
            <div className="p-6">
              <h3 className="mb-4 text-lg font-semibold">Performance por Investimento</h3>
              <InvestmentChart investments={investments} />
            </div>
          </AnimatedCard>
        </div>
      )}

      {/* Investments List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Seus Investimentos</h3>

        {investments.length === 0 ? (
          <AnimatedCard>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">Nenhum investimento cadastrado</h3>
              <p className="mb-4 text-muted-foreground">
                Comece a construir seu patrimonio adicionando seu primeiro investimento
              </p>
              <Button onClick={() => setShowAddDialog(true)} className="gap-2 gradient-primary">
                <Plus className="h-4 w-4" />
                Adicionar Investimento
              </Button>
            </div>
          </AnimatedCard>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {investments.map((investment, index) => (
              <motion.div
                key={investment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <InvestmentCard
                  investment={investment}
                  onDelete={() => handleDeleteInvestment(investment.id)}
                  onUpdateValue={(value) => handleUpdateValue(investment.id, value)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AddInvestmentDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        types={types}
        onSubmit={handleAddInvestment}
      />
    </div>
  )
}
