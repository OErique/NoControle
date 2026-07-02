"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  AlertTriangle,
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  PiggyBank,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from "lucide-react"
import { StatCard } from "@/components/ui/stat-card"
import { StatusBadge } from "@/components/ui/status-badge"
import { AnimatedCard } from "@/components/ui/animated-card"
import { Button } from "@/components/ui/button"
import { DailyBudgetCard } from "./daily-budget-card"
import { FinancialScoreCard } from "./financial-score-card"
import { StreakCard } from "./streak-card"
import { ChallengesCard } from "./challenges-card"
import { formatCurrency, formatDate, getFinancialStatus } from "@/lib/utils"
import { calculateDailyBudget, calculateFinancialScore, getEmpatheticMessage } from "@/lib/gamification"

interface DashboardOverviewProps {
  user: {
    name?: string | null
    monthly_income?: number | null
    main_goal?: string
    plan_slug?: string
    financial_score?: number
    total_points?: number
  }
  data: {
    totalDebts: number
    debtCount: number
    totalIncome: number
    totalExpenses: number
    totalInvestments: number
    balance: number
    netWorth: number
    allTimeIncome?: number
    allTimeExpenses?: number
    creditCardPending?: number
    gamblingGains?: number
    gamblingLosses?: number
    gamblingEnabled?: boolean
    fixedExpenses: number
    minimumDebtPayment: number
    todayExpenses: number
    streak: {
      current: number
      longest: number
      lastDate?: string
    }
    challenges: Array<{
      id: string
      name: string
      description: string
      progress: number
      target: number
      daysLeft: number
      reward: number
      icon: string
    }>
    recentTransactions: Array<{
      type: string
      description: string
      amount: number
      date: string
      category_name: string | null
      category_color: string | null
    }>
    upcomingDebts: Array<{
      id: string
      creditor: string
      current_amount: number
      due_date: string
      category_name: string | null
      category_color: string | null
    }>
  }
}

const goalModules = {
  sair_do_vermelho: { href: "/debts", label: "Ver dívidas", icon: AlertTriangle },
  organizar_financas: { href: "/finances", label: "Ver finanças", icon: Wallet },
  investir: { href: "/investments", label: "Ver investimentos", icon: TrendingUp },
}

export function DashboardOverview({ user, data }: DashboardOverviewProps) {
  const status = getFinancialStatus(data.balance, data.totalDebts)
  const goalModule = user.main_goal
    ? goalModules[user.main_goal as keyof typeof goalModules]
    : goalModules.organizar_financas

  // Calculate days left in month
  const today = new Date()
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  const daysLeft = lastDay.getDate() - today.getDate()

  // Calculate daily budget
  const monthlyIncome = user.monthly_income || data.totalIncome || 0
  const dailyBudgetData = calculateDailyBudget({
    monthlyIncome,
    fixedExpenses: data.fixedExpenses || 0,
    currentMonthExpenses: data.totalExpenses,
    totalDebts: data.totalDebts,
    minimumDebtPayment: data.minimumDebtPayment || 0,
    savingsGoal: monthlyIncome * 0.1, // 10% savings goal
    daysLeftInMonth: daysLeft,
  })

  // Calculate financial score
  const savingsRate = monthlyIncome > 0 ? (monthlyIncome - data.totalExpenses) / monthlyIncome : 0
  const debtToIncomeRatio = monthlyIncome > 0 ? data.totalDebts / (monthlyIncome * 12) : 0

  const financialScore = calculateFinancialScore({
    balance: data.balance,
    totalDebts: data.totalDebts,
    totalInvestments: data.totalInvestments,
    monthlyIncome,
    savingsRate: Math.max(0, savingsRate),
    debtToIncomeRatio,
    hasEmergencyFund: data.totalInvestments > monthlyIncome * 3,
    streakDays: data.streak?.current || 0,
  })

  // Get empathetic greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Bom dia"
    if (hour < 18) return "Boa tarde"
    return "Boa noite"
  }

  const getStatusMessage = () => {
    if (status === "red") {
      return getEmpatheticMessage({ type: "balance_negative", value: Math.abs(data.balance) })
    }
    if (status === "yellow") {
      return {
        title: "Atenção",
        message: "Algumas áreas precisam de cuidado. Vamos melhorar juntos?",
        tone: "supportive" as const,
      }
    }
    return {
      title: "Tudo certo!",
      message: "Suas finanças estão saudáveis. Continue assim!",
      tone: "positive" as const,
    }
  }

  const statusMessage = getStatusMessage()

  const getNextStep = () => {
    if (data.totalDebts > 0 && status === "red") {
      return { message: "Priorize quitar a dívida com maior juros", action: "/debts" }
    }
    if (data.balance < 0) {
      return { message: "Reduza suas despesas para equilibrar o orçamento", action: "/finances" }
    }
    if (data.totalInvestments === 0 && data.balance > 0) {
      return { message: "Comece a investir seu dinheiro disponível", action: "/investments" }
    }
    return { message: "Continue acompanhando suas finanças regularmente", action: "/dashboard" }
  }

  const nextStep = getNextStep()
  const isPremium = user.plan_slug !== "essencial"

  const hasFinancialData =
    data.totalIncome > 0 ||
    data.totalExpenses > 0 ||
    data.totalDebts > 0 ||
    data.totalInvestments > 0 ||
    (data.allTimeIncome && data.allTimeIncome > 0) ||
    (data.allTimeExpenses && data.allTimeExpenses > 0)

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            {getGreeting()}, {user.name?.split(" ")[0] || "Usuário"}!
          </h1>
          <p className={`text-muted-foreground ${statusMessage.tone === "positive" ? "text-success" : ""}`}>
            {statusMessage.message}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {user.total_points !== undefined && user.total_points > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-yellow-500/20 px-3 py-1.5">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium text-yellow-500">{user.total_points} pts</span>
            </div>
          )}
          <StatusBadge status={status} size="lg" />
        </div>
      </motion.div>

      {/* Daily Budget Card - Most important feature */}
      <DailyBudgetCard
        dailyBudget={dailyBudgetData.dailyBudget}
        remainingBudget={dailyBudgetData.remainingBudget}
        spentToday={data.todayExpenses || 0}
        daysLeft={daysLeft}
        isHealthy={dailyBudgetData.isHealthy}
        message={dailyBudgetData.message}
      />

      {/* Score and Streak row */}
      <div className="grid gap-4 md:grid-cols-2">
        <FinancialScoreCard
          score={financialScore}
          previousScore={user.financial_score}
          isLocked={!isPremium}
          planSlug={user.plan_slug}
        />
        <StreakCard
          currentStreak={data.streak?.current || 0}
          longestStreak={data.streak?.longest || 0}
          lastActivityDate={data.streak?.lastDate}
        />
      </div>

      {/* Next step recommendation */}
      <AnimatedCard delay={0.1} className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
              <goalModule.icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Próximo passo recomendado</p>
              <p className="font-medium text-foreground">{nextStep.message}</p>
            </div>
          </div>
          <Link href={goalModule.href}>
            <Button className="gradient-primary text-primary-foreground w-full sm:w-auto">
              {goalModule.label}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </AnimatedCard>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Saldo do Mês"
          value={data.balance}
          icon={data.balance >= 0 ? TrendingUp : TrendingDown}
          color={data.balance >= 0 ? "success" : "danger"}
          delay={0.2}
        />
        <StatCard
          title="Total em Dívidas"
          value={data.totalDebts}
          icon={AlertTriangle}
          color={data.totalDebts > 0 ? "danger" : "success"}
          delay={0.3}
        />
        <StatCard title="Investimentos" value={data.totalInvestments} icon={PiggyBank} color="default" delay={0.4} />
        <AnimatedCard delay={0.5} className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  data.netWorth >= 0 ? "bg-success/20" : "bg-warning/20"
                }`}
              >
                <Wallet className={`h-5 w-5 ${data.netWorth >= 0 ? "text-success" : "text-warning"}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Patrimônio Líquido</p>
                {hasFinancialData ? (
                  <>
                    <p
                      className={`text-xl font-bold ${
                        data.netWorth > 0 ? "text-success" : data.netWorth < 0 ? "text-warning" : "text-foreground"
                      }`}
                    >
                      {formatCurrency(data.netWorth)}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {data.netWorth > 0 ? (
                        <TrendingUp className="h-3 w-3 text-success" />
                      ) : data.netWorth < 0 ? (
                        <TrendingDown className="h-3 w-3 text-warning" />
                      ) : null}
                      <span className="text-xs text-muted-foreground">
                        {data.netWorth > 0 ? "Positivo" : data.netWorth < 0 ? "Negativo" : "Neutro"}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="mt-1">
                    <p className="text-sm text-muted-foreground">
                      Adicione receitas, despesas ou dívidas para calcular seu patrimônio
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Tooltip with breakdown */}
          {hasFinancialData && (
            <div className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Ativos</span>
                <span className="text-success">
                  {formatCurrency(
                    (data.allTimeIncome || 0) -
                      (data.allTimeExpenses || 0) +
                      data.totalInvestments +
                      (data.gamblingEnabled ? data.gamblingGains || 0 : 0),
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Passivos</span>
                <span className="text-danger">
                  {formatCurrency(
                    data.totalDebts +
                      (data.creditCardPending || 0) +
                      (data.gamblingEnabled ? data.gamblingLosses || 0 : 0),
                  )}
                </span>
              </div>
            </div>
          )}
        </AnimatedCard>
      </div>

      {/* Three column layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent transactions */}
        <AnimatedCard delay={0.6} className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Transações Recentes</h3>
            <Link href="/finances" className="text-sm text-primary hover:underline">
              Ver todas
            </Link>
          </div>

          {data.recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {data.recentTransactions.map((transaction, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        transaction.type === "income" ? "bg-success/20" : "bg-danger/20"
                      }`}
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
                  <span className={`font-semibold ${transaction.type === "income" ? "text-success" : "text-danger"}`}>
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Wallet className="mb-2 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">Tudo tranquilo por aqui</p>
              <p className="text-sm text-muted-foreground mb-2">Nenhuma movimentação ainda</p>
              <Link href="/finances">
                <Button variant="link" className="mt-2">
                  Adicionar transação
                </Button>
              </Link>
            </div>
          )}
        </AnimatedCard>

        {/* Challenges */}
        <ChallengesCard
          activeChallenges={data.challenges || []}
          availableChallenges={5 - (data.challenges?.length || 0)}
        />
      </div>

      {/* Upcoming debts */}
      {data.upcomingDebts.length > 0 && (
        <AnimatedCard delay={0.7}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Próximos Vencimentos</h3>
            <Link href="/debts" className="text-sm text-primary hover:underline">
              Ver todas
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.upcomingDebts.map((debt) => {
              const dueDate = new Date(debt.due_date)
              const todayDate = new Date()
              const daysUntilDue = Math.ceil((dueDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24))
              const isOverdue = daysUntilDue < 0
              const isUrgent = daysUntilDue <= 7

              return (
                <div
                  key={debt.id}
                  className={`rounded-lg border p-4 ${
                    isOverdue
                      ? "border-danger/50 bg-danger/10"
                      : isUrgent
                        ? "border-warning/50 bg-warning/10"
                        : "border-border bg-card/50"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar
                      className={`h-5 w-5 ${
                        isOverdue ? "text-danger" : isUrgent ? "text-warning" : "text-muted-foreground"
                      }`}
                    />
                    <span className="font-medium text-foreground">{debt.creditor}</span>
                  </div>
                  <p className="text-lg font-bold text-danger mb-1">{formatCurrency(debt.current_amount)}</p>
                  <p className="text-sm text-muted-foreground">
                    {isOverdue ? (
                      <span className="text-danger">Vencido há {Math.abs(daysUntilDue)} dias</span>
                    ) : daysUntilDue === 0 ? (
                      <span className="text-warning">Vence hoje</span>
                    ) : (
                      `Vence em ${daysUntilDue} dias`
                    )}
                  </p>
                </div>
              )
            })}
          </div>
        </AnimatedCard>
      )}
    </div>
  )
}
