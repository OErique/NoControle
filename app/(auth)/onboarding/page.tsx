"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, ArrowLeft, Loader2, TrendingUp, Wallet, Target, AlertTriangle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type OnboardingStep = "income" | "debts" | "goal" | "complete"

type Goal = "sair_do_vermelho" | "organizar_financas" | "investir"

const goals = [
  {
    id: "sair_do_vermelho" as Goal,
    title: "Sair do Vermelho",
    description: "Quitar dívidas e recuperar saúde financeira",
    icon: AlertTriangle,
    color: "danger",
    bgColor: "from-danger/20 to-danger/5",
    borderColor: "border-danger/30 hover:border-danger/60",
  },
  {
    id: "organizar_financas" as Goal,
    title: "Organizar Finanças",
    description: "Controlar gastos e criar orçamento",
    icon: Wallet,
    color: "primary",
    bgColor: "from-primary/20 to-primary/5",
    borderColor: "border-primary/30 hover:border-primary/60",
  },
  {
    id: "investir" as Goal,
    title: "Começar a Investir",
    description: "Fazer o dinheiro trabalhar para você",
    icon: TrendingUp,
    color: "accent",
    bgColor: "from-accent/20 to-accent/5",
    borderColor: "border-accent/30 hover:border-accent/60",
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<OnboardingStep>("income")
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    monthlyIncome: "",
    hasDebts: null as boolean | null,
    mainGoal: null as Goal | null,
  })

  const steps: OnboardingStep[] = ["income", "debts", "goal", "complete"]
  const currentStepIndex = steps.indexOf(step)

  function nextStep() {
    if (currentStepIndex < steps.length - 1) {
      setStep(steps[currentStepIndex + 1])
    }
  }

  function prevStep() {
    if (currentStepIndex > 0) {
      setStep(steps[currentStepIndex - 1])
    }
  }

  async function handleComplete() {
    setIsLoading(true)

    try {
      const response = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthlyIncome: Number.parseFloat(formData.monthlyIncome.replace(/\D/g, "")) / 100,
          hasDebts: formData.hasDebts,
          mainGoal: formData.mainGoal,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao salvar dados")
      }

      toast.success("Perfil configurado com sucesso!")

      // Redirect based on goal
      if (formData.mainGoal === "sair_do_vermelho") {
        router.push("/dashboard?module=debts")
      } else if (formData.mainGoal === "organizar_financas") {
        router.push("/dashboard?module=finances")
      } else {
        router.push("/dashboard?module=investments")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar dados")
    } finally {
      setIsLoading(false)
    }
  }

  function formatCurrencyInput(value: string) {
    const numbers = value.replace(/\D/g, "")
    const amount = Number.parseFloat(numbers) / 100
    if (isNaN(amount)) return ""
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount)
  }

  const canProceed = () => {
    switch (step) {
      case "income":
        return formData.monthlyIncome.length > 0
      case "debts":
        return formData.hasDebts !== null
      case "goal":
        return formData.mainGoal !== null
      default:
        return true
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      {/* Progress bar */}
      <div className="mb-8 w-full max-w-md">
        <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Passo {currentStepIndex + 1} de {steps.length}
          </span>
          <span>{Math.round(((currentStepIndex + 1) / steps.length) * 100)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full gradient-primary"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {/* Step 1: Income */}
          {step === "income" && (
            <motion.div
              key="income"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20">
                  <Wallet className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Qual é sua renda mensal?</h2>
                <p className="mt-2 text-muted-foreground">Isso nos ajuda a personalizar suas metas e recomendações</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="income">Renda mensal (aproximada)</Label>
                <Input
                  id="income"
                  type="text"
                  placeholder="R$ 0,00"
                  value={formData.monthlyIncome}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      monthlyIncome: formatCurrencyInput(e.target.value),
                    })
                  }
                  className="h-14 text-center text-2xl font-bold bg-muted/50"
                />
              </div>

              <Button
                onClick={nextStep}
                disabled={!canProceed()}
                className="h-12 w-full gradient-primary text-primary-foreground"
              >
                Continuar
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          )}

          {/* Step 2: Debts */}
          {step === "debts" && (
            <motion.div
              key="debts"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/20">
                  <AlertTriangle className="h-8 w-8 text-danger" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Você possui dívidas?</h2>
                <p className="mt-2 text-muted-foreground">Cartão de crédito, empréstimos, financiamentos, etc.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setFormData({ ...formData, hasDebts: true })}
                  className={cn(
                    "flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all",
                    formData.hasDebts === true
                      ? "border-danger bg-danger/10"
                      : "border-border bg-card hover:border-danger/50",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full",
                      formData.hasDebts === true ? "bg-danger text-danger-foreground" : "bg-muted",
                    )}
                  >
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <span className="font-medium text-foreground">Sim, tenho dívidas</span>
                </button>

                <button
                  onClick={() => setFormData({ ...formData, hasDebts: false })}
                  className={cn(
                    "flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all",
                    formData.hasDebts === false
                      ? "border-success bg-success/10"
                      : "border-border bg-card hover:border-success/50",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full",
                      formData.hasDebts === false ? "bg-success text-success-foreground" : "bg-muted",
                    )}
                  >
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <span className="font-medium text-foreground">Não tenho dívidas</span>
                </button>
              </div>

              <div className="flex gap-4">
                <Button onClick={prevStep} variant="outline" className="h-12 flex-1 bg-transparent">
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Voltar
                </Button>
                <Button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="h-12 flex-1 gradient-primary text-primary-foreground"
                >
                  Continuar
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Goal */}
          {step === "goal" && (
            <motion.div
              key="goal"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/20">
                  <Target className="h-8 w-8 text-accent" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Qual é seu objetivo principal?</h2>
                <p className="mt-2 text-muted-foreground">Vamos direcionar você para o módulo ideal</p>
              </div>

              <div className="space-y-3">
                {goals.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => setFormData({ ...formData, mainGoal: goal.id })}
                    className={cn(
                      "flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all",
                      `bg-gradient-to-r ${goal.bgColor}`,
                      formData.mainGoal === goal.id
                        ? goal.borderColor.replace("hover:", "")
                        : `border-border ${goal.borderColor}`,
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                        formData.mainGoal === goal.id ? `bg-${goal.color} text-${goal.color}-foreground` : "bg-muted",
                      )}
                    >
                      <goal.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{goal.title}</h3>
                      <p className="text-sm text-muted-foreground">{goal.description}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-4">
                <Button onClick={prevStep} variant="outline" className="h-12 flex-1 bg-transparent">
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Voltar
                </Button>
                <Button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="h-12 flex-1 gradient-primary text-primary-foreground"
                >
                  Continuar
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Complete */}
          {step === "complete" && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 text-center"
            >
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/20">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground">Tudo pronto!</h2>
                <p className="mt-2 text-muted-foreground">
                  Seu perfil foi configurado. Vamos começar sua jornada financeira!
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 text-left">
                <h3 className="mb-3 font-semibold text-foreground">Resumo do seu perfil:</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center justify-between">
                    <span className="text-muted-foreground">Renda mensal:</span>
                    <span className="font-medium text-foreground">{formData.monthlyIncome}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-muted-foreground">Possui dívidas:</span>
                    <span className="font-medium text-foreground">{formData.hasDebts ? "Sim" : "Não"}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-muted-foreground">Objetivo:</span>
                    <span className="font-medium text-foreground">
                      {goals.find((g) => g.id === formData.mainGoal)?.title}
                    </span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-4">
                <Button onClick={prevStep} variant="outline" className="h-12 flex-1 bg-transparent">
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Voltar
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={isLoading}
                  className="h-12 flex-1 gradient-primary text-primary-foreground"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      Começar
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
