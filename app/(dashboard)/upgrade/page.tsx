"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Check, Crown, Zap, Shield, ArrowRight, ShieldCheck, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AnimatedCard } from "@/components/ui/animated-card"
import { cn } from "@/lib/utils"

interface Plan {
  id: string
  name: string
  slug: string
  price: number
  modules_allowed: number
  features: string[]
}

const planFeatures = {
  essencial: {
    icon: Shield,
    color: "border-muted",
    gradient: "from-slate-500/20 to-gray-500/20",
    iconBg: "bg-muted text-muted-foreground",
    highlights: [
      { text: "1 módulo à sua escolha", included: true },
      { text: "Dashboard básico", included: true },
      { text: "Desafios mensais", included: true },
      { text: "30 transações/mês", included: true },
      { text: "Score Financeiro", included: false },
      { text: "Importação de extratos", included: false },
      { text: "Alfred por voz", included: false },
      { text: "Projeções avançadas", included: false },
    ],
  },
  completo: {
    icon: Zap,
    color: "border-primary",
    gradient: "from-primary/20 to-accent/20",
    iconBg: "bg-primary/20 text-primary",
    highlights: [
      { text: "Todos os 3 módulos", included: true },
      { text: "Dashboard completo", included: true },
      { text: "Desafios ilimitados", included: true },
      { text: "Transações ilimitadas", included: true },
      { text: "Score Financeiro", included: true },
      { text: "Importação de extratos", included: true },
      { text: "Alfred por voz", included: false },
      { text: "Projeções avançadas", included: true },
    ],
  },
  total: {
    icon: Crown,
    color: "border-emerald-500",
    gradient: "from-emerald-500/15 to-amber-500/15",
    iconBg: "bg-emerald-500/15 text-emerald-400",
    highlights: [
      { text: "Todos os 3 módulos", included: true },
      { text: "Dashboard premium", included: true },
      { text: "Desafios ilimitados", included: true },
      { text: "Transações ilimitadas", included: true },
      { text: "Score Financeiro", included: true },
      { text: "Importação de extratos", included: true },
      { text: "Alfred por voz", included: true },
      { text: "Projeções avançadas", included: true },
    ],
  },
}

const comparisons = [
  {
    feature: "Módulos disponíveis",
    essencial: "1",
    completo: "3",
    total: "3",
  },
  {
    feature: "Transações por mês",
    essencial: "30",
    completo: "Ilimitado",
    total: "Ilimitado",
  },
  {
    feature: "Score Financeiro",
    essencial: false,
    completo: true,
    total: true,
  },
  {
    feature: "Quanto posso gastar hoje",
    essencial: true,
    completo: true,
    total: true,
  },
  {
    feature: "Simulador de compras",
    essencial: false,
    completo: true,
    total: true,
  },
  {
    feature: "Projeção de saldo",
    essencial: false,
    completo: true,
    total: true,
  },
  {
    feature: "Importação de extratos",
    essencial: false,
    completo: true,
    total: true,
  },
  {
    feature: "Desafios mensais",
    essencial: "3/mês",
    completo: "Ilimitado",
    total: "Ilimitado",
  },
  {
    feature: "Alfred por voz",
    essencial: false,
    completo: false,
    total: true,
  },
  {
    feature: "Relatório PDF mensal",
    essencial: false,
    completo: false,
    total: true,
  },
  {
    feature: "Suporte prioritário",
    essencial: false,
    completo: false,
    total: true,
  },
]

export default function UpgradePage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null)
  const [currentPlanSlug, setCurrentPlanSlug] = useState<string>("essencial")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, userRes] = await Promise.all([fetch("/api/plans"), fetch("/api/auth/me")])

        if (plansRes.ok) {
          const data = await plansRes.json()
          setPlans(data.plans)
        }

        if (userRes.ok) {
          const data = await userRes.json()
          setCurrentPlanId(data.user.plan_id)
          // Find current plan slug
          if (data.user.plan_id && plansRes.ok) {
            const plansData = await plansRes.json().catch(() => ({ plans: [] }))
            const currentPlan = plansData.plans?.find((p: Plan) => p.id === data.user.plan_id)
            if (currentPlan) {
              setCurrentPlanSlug(currentPlan.slug)
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleUpgrade = async (planId: string) => {
    setSelectedPlan(planId)
    try {
      const res = await fetch("/api/user/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: planId }),
      })

      if (res.ok) {
        window.location.href = "/dashboard"
      }
    } catch (error) {
      console.error("Error upgrading:", error)
    } finally {
      setSelectedPlan(null)
    }
  }

  const getYearlyPrice = (monthlyPrice: number) => {
    return monthlyPrice * 10 // 2 months free
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20"
        >
          <ShieldCheck className="h-8 w-8 text-primary" />
        </motion.div>
        <motion.h1
          className="text-3xl font-bold md:text-4xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Escolha o plano ideal para você
        </motion.h1>
        <motion.p
          className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Desbloqueie recursos avançados e acelere sua jornada para a liberdade financeira
        </motion.p>

        {/* Billing toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 inline-flex items-center gap-3 rounded-full border border-border bg-card p-1"
        >
          <button
            onClick={() => setBillingCycle("monthly")}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              billingCycle === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            Mensal
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2",
              billingCycle === "yearly" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            Anual
            <span className="rounded-full bg-success/20 px-2 py-0.5 text-xs text-success">-17%</span>
          </button>
        </motion.div>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan, index) => {
          const config = planFeatures[plan.slug as keyof typeof planFeatures] || planFeatures.essencial
          const Icon = config.icon
          const isCurrentPlan = plan.id === currentPlanId
          const isPopular = plan.slug === "completo"
          const isPremium = plan.slug === "total"
          const displayPrice = billingCycle === "yearly" && plan.price > 0 ? getYearlyPrice(plan.price) : plan.price

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div
                className={cn(
                  "relative flex h-full flex-col rounded-2xl border-2 p-6 transition-all bg-gradient-to-b",
                  config.color,
                  config.gradient,
                  isPopular && "shadow-xl shadow-primary/20 scale-105 z-10",
                  isPremium && "shadow-xl shadow-emerald-950/40",
                )}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-sm font-medium text-primary-foreground">
                    Mais Popular
                  </div>
                )}
                {isPremium && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-700 to-amber-700 px-4 py-1 text-sm font-medium text-white">
                    Completo + IA
                  </div>
                )}

                <div className="mb-6">
                  <div className={cn("mb-4 flex h-12 w-12 items-center justify-center rounded-xl", config.iconBg)}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    {plan.price === 0 ? (
                      <span className="text-4xl font-bold">Grátis</span>
                    ) : (
                      <>
                        <span className="text-4xl font-bold">
                          R$ {billingCycle === "yearly" ? (displayPrice / 12).toFixed(0) : plan.price}
                        </span>
                        <span className="text-muted-foreground">/mês</span>
                      </>
                    )}
                  </div>
                  {plan.price > 0 && billingCycle === "yearly" && (
                    <p className="mt-1 text-sm text-success">R$ {displayPrice}/ano (2 meses grátis)</p>
                  )}
                </div>

                <div className="mb-6 flex-1 space-y-3">
                  {config.highlights.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      {item.included ? (
                        <Check className="h-4 w-4 shrink-0 text-success" />
                      ) : (
                        <X className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                      )}
                      <span className={item.included ? "" : "text-muted-foreground/50"}>{item.text}</span>
                    </div>
                  ))}
                </div>

                <Button
                  className={cn(
                    "w-full gap-2",
                    isPremium && "bg-gradient-to-r from-emerald-700 to-amber-700 hover:from-emerald-600 hover:to-amber-600",
                    isPopular && !isPremium && "gradient-primary",
                  )}
                  size="lg"
                  variant={isCurrentPlan ? "outline" : plan.price === 0 ? "secondary" : "default"}
                  disabled={isCurrentPlan || selectedPlan === plan.id}
                  onClick={() => handleUpgrade(plan.id)}
                >
                  {isCurrentPlan ? (
                    "Plano Atual"
                  ) : selectedPlan === plan.id ? (
                    "Processando..."
                  ) : (
                    <>
                      {plan.price === 0 ? "Começar Grátis" : "Assinar Agora"}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>

                {plan.price > 0 && !isCurrentPlan && (
                  <p className="mt-3 text-center text-xs text-muted-foreground">7 dias de teste grátis</p>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Feature Comparison Table */}
      <AnimatedCard delay={0.4}>
        <div className="p-6">
          <h3 className="mb-6 text-xl font-bold text-center">Comparativo de Funcionalidades</h3>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-4 text-left font-medium text-muted-foreground">Funcionalidade</th>
                  <th className="pb-4 text-center font-medium">Essencial</th>
                  <th className="pb-4 text-center font-medium text-primary">Completo</th>
                  <th className="pb-4 text-center font-medium text-emerald-400">Total</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((row, index) => (
                  <tr key={index} className="border-b border-border/50">
                    <td className="py-3 text-sm">{row.feature}</td>
                    <td className="py-3 text-center">
                      {typeof row.essencial === "boolean" ? (
                        row.essencial ? (
                          <Check className="h-5 w-5 text-success mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground/30 mx-auto" />
                        )
                      ) : (
                        <span className="text-sm">{row.essencial}</span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      {typeof row.completo === "boolean" ? (
                        row.completo ? (
                          <Check className="h-5 w-5 text-success mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground/30 mx-auto" />
                        )
                      ) : (
                        <span className="text-sm">{row.completo}</span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      {typeof row.total === "boolean" ? (
                        row.total ? (
                          <Check className="h-5 w-5 text-success mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground/30 mx-auto" />
                        )
                      ) : (
                        <span className="text-sm">{row.total}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AnimatedCard>

      {/* Social proof */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-center py-8"
      >
        <p className="text-sm text-muted-foreground mb-3">Mais de 10.000 usuários já transformaram suas finanças</p>
        <div className="flex items-center justify-center gap-8 text-sm">
          <div>
            <p className="text-2xl font-bold text-success">R$ 2.4M</p>
            <p className="text-muted-foreground">em dívidas quitadas</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-2xl font-bold text-primary">89%</p>
            <p className="text-muted-foreground">saíram do vermelho</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-2xl font-bold text-accent">4.9/5</p>
            <p className="text-muted-foreground">avaliação média</p>
          </div>
        </div>
      </motion.div>

      {/* FAQ Section */}
      <AnimatedCard delay={0.6}>
        <div className="p-6">
          <h3 className="mb-6 text-xl font-bold text-center">Perguntas Frequentes</h3>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Posso trocar de plano depois?</h4>
              <p className="text-sm text-muted-foreground">
                Sim! Você pode fazer upgrade ou downgrade a qualquer momento. O valor será ajustado proporcionalmente.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Como funciona o período de teste?</h4>
              <p className="text-sm text-muted-foreground">
                Todos os planos pagos possuem 7 dias de teste gratuito. Se não gostar, cancele sem custo.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Meus dados são seguros?</h4>
              <p className="text-sm text-muted-foreground">
                Absolutamente! Utilizamos criptografia de ponta a ponta e seguimos as melhores práticas de segurança.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Posso cancelar quando quiser?</h4>
              <p className="text-sm text-muted-foreground">
                Sim, sem multas ou taxas. Você continua com acesso até o fim do período pago.
              </p>
            </div>
          </div>
        </div>
      </AnimatedCard>
    </div>
  )
}
