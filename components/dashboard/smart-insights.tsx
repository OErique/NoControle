"use client"

import type React from "react"
import { motion } from "framer-motion"
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Sparkles,
  PiggyBank,
  Target,
} from "lucide-react"
import { AnimatedCard } from "@/components/ui/animated-card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"

interface SmartInsightsProps {
  data: {
    currentMonthExpenses: number
    previousMonthExpenses: number
    currentMonthIncome: number
    previousMonthIncome: number
    topCategory: { name: string; amount: number } | null
    previousTopCategory: { name: string; amount: number } | null
    balance: number
    totalDebts: number
    totalInvestments: number
    streak: number
  }
}

interface Insight {
  type: "positive" | "warning" | "danger" | "tip"
  icon: React.ElementType
  title: string
  message: string
  action?: { label: string; href: string }
}

export function SmartInsights({ data }: SmartInsightsProps) {
  const insights: Insight[] = []

  // Compare expenses with previous month
  const expenseChange =
    data.previousMonthExpenses > 0
      ? ((data.currentMonthExpenses - data.previousMonthExpenses) / data.previousMonthExpenses) * 100
      : 0

  if (expenseChange > 20) {
    insights.push({
      type: "danger",
      icon: TrendingUp,
      title: "Gastos em Alta",
      message: `Seus gastos aumentaram ${expenseChange.toFixed(0)}% em relação ao mês passado. Hora de revisar!`,
      action: { label: "Ver despesas", href: "/finances" },
    })
  } else if (expenseChange < -10) {
    insights.push({
      type: "positive",
      icon: TrendingDown,
      title: "Parabéns!",
      message: `Você economizou ${Math.abs(expenseChange).toFixed(0)}% em relação ao mês passado. Continue assim!`,
    })
  }

  // Top spending category
  if (data.topCategory) {
    const isIncrease =
      data.previousTopCategory && data.topCategory.amount > (data.previousTopCategory?.amount || 0) * 1.2

    insights.push({
      type: isIncrease ? "warning" : "tip",
      icon: isIncrease ? AlertTriangle : Lightbulb,
      title: isIncrease ? "Maior Vazamento" : "Maior Gasto",
      message: `Seu maior gasto este mês é ${data.topCategory.name}: ${formatCurrency(data.topCategory.amount)}${isIncrease ? ". Aumentou em relação ao mês anterior!" : ""}`,
      action: { label: "Analisar", href: "/finances" },
    })
  }

  // Balance insight
  if (data.balance < 0) {
    insights.push({
      type: "danger",
      icon: AlertTriangle,
      title: "Saldo Negativo",
      message: `Você está gastando mais do que ganha. Deficit de ${formatCurrency(Math.abs(data.balance))}`,
      action: { label: "Revisar finanças", href: "/finances" },
    })
  } else if (data.balance > data.currentMonthIncome * 0.2) {
    insights.push({
      type: "positive",
      icon: PiggyBank,
      title: "Ótima Economia!",
      message: `Você está guardando ${((data.balance / data.currentMonthIncome) * 100).toFixed(0)}% da sua renda. Excelente!`,
      action: { label: "Investir", href: "/investments" },
    })
  }

  // Debts insight
  if (data.totalDebts > data.currentMonthIncome * 3) {
    insights.push({
      type: "warning",
      icon: AlertTriangle,
      title: "Dívidas Elevadas",
      message: `Suas dívidas representam ${((data.totalDebts / data.currentMonthIncome) * 100).toFixed(0)}% da sua renda mensal`,
      action: { label: "Ver dívidas", href: "/debts" },
    })
  }

  // Investments tip
  if (data.totalInvestments === 0 && data.balance > 0) {
    insights.push({
      type: "tip",
      icon: Sparkles,
      title: "Hora de Investir",
      message: "Você tem saldo positivo mas ainda não investe. Que tal começar?",
      action: { label: "Começar", href: "/investments" },
    })
  }

  // Streak motivation
  if (data.streak >= 7) {
    insights.push({
      type: "positive",
      icon: Target,
      title: `${data.streak} Dias de Sequência!`,
      message: "Você está mantendo o controle financeiro há mais de uma semana. Incrível!",
    })
  }

  if (insights.length === 0) {
    insights.push({
      type: "tip",
      icon: Lightbulb,
      title: "Tudo em Ordem",
      message: "Continue monitorando suas finanças regularmente para manter o controle.",
    })
  }

  return (
    <AnimatedCard className="col-span-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Insights Inteligentes
        </h3>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {insights.slice(0, 3).map((insight, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-lg border ${
              insight.type === "positive"
                ? "bg-success/10 border-success/30"
                : insight.type === "warning"
                  ? "bg-warning/10 border-warning/30"
                  : insight.type === "danger"
                    ? "bg-danger/10 border-danger/30"
                    : "bg-primary/10 border-primary/30"
            }`}
          >
            <div className="flex items-start gap-3">
              <insight.icon
                className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                  insight.type === "positive"
                    ? "text-success"
                    : insight.type === "warning"
                      ? "text-warning"
                      : insight.type === "danger"
                        ? "text-danger"
                        : "text-primary"
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{insight.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{insight.message}</p>
                {insight.action && (
                  <Link href={insight.action.href}>
                    <Button variant="link" size="sm" className="h-auto p-0 mt-2">
                      {insight.action.label}
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </AnimatedCard>
  )
}
