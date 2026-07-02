import { sql } from "@/lib/db"

// Calculate financial health score (0-100)
export function calculateFinancialScore(data: {
  balance: number
  totalDebts: number
  totalInvestments: number
  monthlyIncome: number
  savingsRate: number
  debtToIncomeRatio: number
  hasEmergencyFund: boolean
  streakDays: number
}): number {
  let score = 50 // Base score

  // Balance factor (max +/- 15 points)
  if (data.balance > 0) {
    score += Math.min(15, Math.floor((data.balance / data.monthlyIncome) * 15))
  } else {
    score -= Math.min(15, Math.floor((Math.abs(data.balance) / data.monthlyIncome) * 15))
  }

  // Debt factor (max -25 points)
  if (data.totalDebts > 0) {
    const debtImpact = Math.min(25, Math.floor(data.debtToIncomeRatio * 25))
    score -= debtImpact
  } else {
    score += 10 // Bonus for no debts
  }

  // Savings rate factor (max +15 points)
  score += Math.min(15, Math.floor(data.savingsRate * 30))

  // Investment factor (max +10 points)
  if (data.totalInvestments > 0) {
    const investmentRatio = data.totalInvestments / (data.monthlyIncome * 3)
    score += Math.min(10, Math.floor(investmentRatio * 10))
  }

  // Emergency fund bonus (+5 points)
  if (data.hasEmergencyFund) {
    score += 5
  }

  // Streak bonus (max +5 points)
  score += Math.min(5, Math.floor(data.streakDays / 7))

  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score)))
}

// Get score color and label
export function getScoreInfo(score: number): {
  color: string
  label: string
  emoji: string
  message: string
} {
  if (score >= 80) {
    return {
      color: "success",
      label: "Excelente",
      emoji: "crown",
      message: "Suas finanças estão no caminho certo! Continue assim.",
    }
  }
  if (score >= 60) {
    return {
      color: "primary",
      label: "Bom",
      emoji: "thumbs-up",
      message: "Você está indo bem! Pequenos ajustes podem melhorar ainda mais.",
    }
  }
  if (score >= 40) {
    return {
      color: "warning",
      label: "Atenção",
      emoji: "alert-triangle",
      message: "Algumas áreas precisam de atenção. Vamos melhorar juntos?",
    }
  }
  return {
    color: "danger",
    label: "Crítico",
    emoji: "alert-circle",
    message: "Momento de focar nas finanças. Estamos aqui para ajudar!",
  }
}

// Calculate "how much can I spend today"
export function calculateDailyBudget(data: {
  monthlyIncome: number
  fixedExpenses: number
  currentMonthExpenses: number
  totalDebts: number
  minimumDebtPayment: number
  savingsGoal: number
  daysLeftInMonth: number
}): {
  dailyBudget: number
  remainingBudget: number
  spentToday: number
  isHealthy: boolean
  message: string
} {
  // Available for the month = Income - Fixed - Debt Payments - Savings Goal
  const availableMonthly = data.monthlyIncome - data.fixedExpenses - data.minimumDebtPayment - data.savingsGoal

  // Remaining = Available - Already Spent
  const remaining = availableMonthly - data.currentMonthExpenses

  // Daily budget = Remaining / Days left
  const dailyBudget = data.daysLeftInMonth > 0 ? Math.max(0, remaining / data.daysLeftInMonth) : 0

  const isHealthy = remaining > 0 && dailyBudget > 0

  let message: string
  if (remaining <= 0) {
    message = "Você já atingiu o limite do mês. Evite novos gastos."
  } else if (dailyBudget < 20) {
    message = "Orçamento apertado. Gaste apenas o essencial."
  } else if (dailyBudget < 50) {
    message = "Cuidado com gastos extras hoje."
  } else {
    message = "Você tem margem para gastar com tranquilidade."
  }

  return {
    dailyBudget: Math.round(dailyBudget * 100) / 100,
    remainingBudget: Math.round(remaining * 100) / 100,
    spentToday: 0, // Will be calculated from today's expenses
    isHealthy,
    message,
  }
}

// Get empathetic message based on context
export function getEmpatheticMessage(context: {
  type:
    | "balance_negative"
    | "high_expense"
    | "goal_missed"
    | "goal_achieved"
    | "debt_paid"
    | "first_access"
    | "no_transactions"
    | "streak_broken"
  value?: number
  extra?: string
}): { title: string; message: string; tone: "positive" | "neutral" | "supportive" } {
  const messages: Record<string, { title: string; message: string; tone: "positive" | "neutral" | "supportive" }> = {
    balance_negative: {
      title: "Vamos resolver juntos",
      message: `Você está R$ ${Math.abs(context.value || 0).toFixed(2)} no vermelho. Não se preocupe, isso acontece. Vamos criar um plano?`,
      tone: "supportive",
    },
    high_expense: {
      title: "Gasto registrado",
      message: `Compra de R$ ${(context.value || 0).toFixed(2)} registrada. Tudo bem, você ainda tem controle do seu dinheiro.`,
      tone: "neutral",
    },
    goal_missed: {
      title: "Faltou pouco!",
      message: "Você chegou perto da meta. Mês que vem você consegue!",
      tone: "supportive",
    },
    goal_achieved: {
      title: "Parabéns!",
      message: `Você bateu a meta${context.extra ? ` de ${context.extra}` : ""}! Isso é incrível!`,
      tone: "positive",
    },
    debt_paid: {
      title: "Conquista desbloqueada!",
      message: `Você quitou ${context.extra || "uma dívida"}! Cada passo conta na sua jornada.`,
      tone: "positive",
    },
    first_access: {
      title: "Bem-vindo!",
      message: "Vamos começar devagar. Qual sua maior preocupação financeira hoje?",
      tone: "neutral",
    },
    no_transactions: {
      title: "Tudo tranquilo",
      message: "Nenhuma movimentação por aqui. Seu saldo está seguro.",
      tone: "neutral",
    },
    streak_broken: {
      title: "Sentimos sua falta",
      message: "Você ficou alguns dias sem registrar. Que tal voltar ao controle hoje?",
      tone: "supportive",
    },
  }

  return messages[context.type] || messages.first_access
}

// Update user streak
export async function updateStreak(userId: string, streakType: string): Promise<{ current: number; isNew: boolean }> {
  try {
    const today = new Date().toISOString().split("T")[0]

    // Check if table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user_streaks'
      )
    `

    if (!tableCheck[0]?.exists) {
      return { current: 0, isNew: false }
    }

    // Get current streak
    const existing = await sql`
      SELECT * FROM user_streaks 
      WHERE user_id = ${userId} AND streak_type = ${streakType}
    `

    if (existing.length === 0) {
      // Create new streak
      await sql`
        INSERT INTO user_streaks (user_id, streak_type, current_streak, longest_streak, last_activity_date)
        VALUES (${userId}, ${streakType}, 1, 1, ${today})
      `
      return { current: 1, isNew: true }
    }

    const streak = existing[0]
    const lastDate = streak.last_activity_date ? new Date(streak.last_activity_date) : null
    const todayDate = new Date(today)

    if (lastDate) {
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays === 0) {
        // Already logged today
        return { current: streak.current_streak, isNew: false }
      } else if (diffDays === 1) {
        // Consecutive day - increment streak
        const newStreak = streak.current_streak + 1
        const longestStreak = Math.max(newStreak, streak.longest_streak)

        await sql`
          UPDATE user_streaks 
          SET current_streak = ${newStreak}, 
              longest_streak = ${longestStreak}, 
              last_activity_date = ${today},
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ${streak.id}
        `
        return { current: newStreak, isNew: true }
      } else {
        // Streak broken - reset to 1
        await sql`
          UPDATE user_streaks 
          SET current_streak = 1, 
              last_activity_date = ${today},
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ${streak.id}
        `
        return { current: 1, isNew: true }
      }
    }

    return { current: streak.current_streak, isNew: false }
  } catch (error) {
    console.error("Error updating streak:", error)
    return { current: 0, isNew: false }
  }
}
