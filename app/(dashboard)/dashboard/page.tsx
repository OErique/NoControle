import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { DashboardOverview } from "@/components/dashboard/overview"
import { updateStreak } from "@/lib/gamification"

type DashboardChallengeRow = {
  id: string
  name: string
  description: string
  current_value: number
  target_value: number
  end_date: Date
  reward_points: number
  icon: string
}

type RecentTransactionRow = {
  type: string
  description: string
  amount: number
  date: string | Date
  category_name: string | null
  category_color: string | null
}

type UpcomingDebtRow = {
  id: string
  creditor: string
  current_amount: number
  due_date: string | Date
  category_name: string | null
  category_color: string | null
}

async function getDashboardData(userId: string) {
  // Update login streak
  await updateStreak(userId, "daily_login")

  // Get total debts
  const debtsResult = await sql`
    SELECT 
      COALESCE(SUM(current_amount), 0) as total_debts,
      COUNT(*) as debt_count,
      COALESCE(SUM(minimum_payment), 0) as minimum_payment
    FROM debts 
    WHERE user_id = ${userId} AND status = 'active'
  `

  // Get monthly income/expense for current month
  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
  const today = new Date().toISOString().split("T")[0]

  const incomeResult = await sql`
    SELECT COALESCE(SUM(amount), 0) as total_income
    FROM incomes 
    WHERE user_id = ${userId} 
    AND TO_CHAR(date, 'YYYY-MM') = ${currentMonth}
  `

  const expenseResult = await sql`
    SELECT COALESCE(SUM(amount), 0) as total_expenses
    FROM expenses 
    WHERE user_id = ${userId} 
    AND TO_CHAR(date, 'YYYY-MM') = ${currentMonth}
  `

  const allTimeIncomeResult = await sql`
    SELECT COALESCE(SUM(amount), 0) as total_income
    FROM incomes 
    WHERE user_id = ${userId}
  `

  const allTimeExpenseResult = await sql`
    SELECT COALESCE(SUM(amount), 0) as total_expenses
    FROM expenses 
    WHERE user_id = ${userId}
  `

  // Get today's expenses
  const todayExpenseResult = await sql`
    SELECT COALESCE(SUM(amount), 0) as today_expenses
    FROM expenses 
    WHERE user_id = ${userId} 
    AND date = ${today}
  `

  // Get fixed expenses (recurring)
  const fixedExpenseResult = await sql`
    SELECT COALESCE(SUM(amount), 0) as fixed_expenses
    FROM expenses 
    WHERE user_id = ${userId} 
    AND is_recurring = true
  `

  // Get total investments
  const investmentsResult = await sql`
    SELECT COALESCE(SUM(current_amount), 0) as total_investments
    FROM investments 
    WHERE user_id = ${userId} AND status = 'active'
  `

  let creditCardPending = 0
  try {
    const cardTableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'credit_cards'
      )
    `
    if (cardTableCheck[0]?.exists) {
      const cardResult = await sql`
        SELECT COALESCE(SUM(current_balance), 0) as pending
        FROM credit_cards
        WHERE user_id = ${userId}
      `
      creditCardPending = Number(cardResult[0]?.pending || 0)
    }
  } catch {
    // Credit cards table doesn't exist
  }

  let gamblingNetResult = 0
  let gamblingGains = 0
  let gamblingLosses = 0
  let gamblingEnabled = false
  try {
    // Check if user has gambling enabled
    const userGamblingCheck = await sql`
      SELECT gambling_enabled FROM users WHERE id = ${userId}
    `
    gamblingEnabled = userGamblingCheck[0]?.gambling_enabled === true

    if (gamblingEnabled) {
      const gamblingTableCheck = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'gambling_bets'
        )
      `
      if (gamblingTableCheck[0]?.exists) {
        // Get ALL-TIME gambling results for net worth
        const gamblingResult = await sql`
          SELECT 
            COALESCE(SUM(CASE WHEN amount_won > amount_bet THEN amount_won - amount_bet ELSE 0 END), 0) as gains,
            COALESCE(SUM(CASE WHEN amount_won < amount_bet THEN amount_bet - amount_won ELSE 0 END), 0) as losses
          FROM gambling_bets
          WHERE user_id = ${userId}
        `
        gamblingGains = Number(gamblingResult[0]?.gains || 0)
        gamblingLosses = Number(gamblingResult[0]?.losses || 0)
        gamblingNetResult = gamblingGains - gamblingLosses

        // Get current month gambling for balance
        const monthlyGamblingResult = await sql`
          SELECT COALESCE(SUM(amount_won - amount_bet), 0) as net_result
          FROM gambling_bets
          WHERE user_id = ${userId}
          AND TO_CHAR(bet_date, 'YYYY-MM') = ${currentMonth}
        `
        gamblingNetResult = Number(monthlyGamblingResult[0]?.net_result || 0)
      }
    }
  } catch {
    // Gambling table doesn't exist or user column doesn't exist
  }

  // Get recent transactions (last 5)
  const recentTransactionsResult = await sql<RecentTransactionRow>`
    (SELECT 'income' as type, description, amount, date, ic.name as category_name, ic.color as category_color
     FROM incomes i
     LEFT JOIN income_categories ic ON i.category_id = ic.id
     WHERE i.user_id = ${userId}
     ORDER BY date DESC
     LIMIT 5)
    UNION ALL
    (SELECT 'expense' as type, description, amount, date, ec.name as category_name, ec.color as category_color
     FROM expenses e
     LEFT JOIN expense_categories ec ON e.category_id = ec.id
     WHERE e.user_id = ${userId}
     ORDER BY date DESC
     LIMIT 5)
    ORDER BY date DESC
    LIMIT 5
  `

  // Get upcoming debt payments (next 30 days)
  const upcomingDebtsResult = await sql<UpcomingDebtRow>`
    SELECT d.*, dc.name as category_name, dc.color as category_color
    FROM debts d
    LEFT JOIN debt_categories dc ON d.category_id = dc.id
    WHERE d.user_id = ${userId} 
    AND d.status = 'active'
    AND d.due_date <= CURRENT_DATE + INTERVAL '30 days'
    ORDER BY d.due_date ASC
    LIMIT 3
  `

  // Get user streak - with table existence check
  let streak = { current: 0, longest: 0, lastDate: undefined as string | undefined }
  try {
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user_streaks'
      )
    `
    if (tableCheck[0]?.exists) {
      const streakResult = await sql`
        SELECT current_streak, longest_streak, last_activity_date
        FROM user_streaks
        WHERE user_id = ${userId} AND streak_type = 'daily_login'
      `
      if (streakResult.length > 0) {
        streak = {
          current: streakResult[0].current_streak || 0,
          longest: streakResult[0].longest_streak || 0,
          lastDate: streakResult[0].last_activity_date?.toISOString?.()?.split("T")[0],
        }
      }
    }
  } catch {
    // Streak table doesn't exist yet
  }

  // Get active challenges - with table existence check
  let challenges: Array<{
    id: string
    name: string
    description: string
    progress: number
    target: number
    daysLeft: number
    reward: number
    icon: string
  }> = []
  try {
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user_challenges'
      )
    `
    if (tableCheck[0]?.exists) {
      const challengesResult = await sql<DashboardChallengeRow>`
        SELECT uc.*, c.name, c.description, c.target_value, c.reward_points, c.icon
        FROM user_challenges uc
        JOIN challenges c ON uc.challenge_id = c.id
        WHERE uc.user_id = ${userId} AND uc.status = 'active'
        ORDER BY uc.end_date ASC
        LIMIT 3
      `
      challenges = challengesResult.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          progress: Number(c.current_value) || 0,
          target: Number(c.target_value) || 100,
          daysLeft: Math.max(0, Math.ceil((new Date(c.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
          reward: c.reward_points,
          icon: c.icon,
        }))
    }
  } catch {
    // Challenges table doesn't exist yet
  }

  return {
    totalDebts: Number(debtsResult[0]?.total_debts || 0),
    debtCount: Number(debtsResult[0]?.debt_count || 0),
    minimumDebtPayment: Number(debtsResult[0]?.minimum_payment || 0),
    totalIncome: Number(incomeResult[0]?.total_income || 0),
    totalExpenses: Number(expenseResult[0]?.total_expenses || 0),
    allTimeIncome: Number(allTimeIncomeResult[0]?.total_income || 0),
    allTimeExpenses: Number(allTimeExpenseResult[0]?.total_expenses || 0),
    todayExpenses: Number(todayExpenseResult[0]?.today_expenses || 0),
    fixedExpenses: Number(fixedExpenseResult[0]?.fixed_expenses || 0),
    totalInvestments: Number(investmentsResult[0]?.total_investments || 0),
    gamblingNetResult,
    gamblingGains,
    gamblingLosses,
    gamblingEnabled,
    creditCardPending,
    recentTransactions: recentTransactionsResult.map((transaction) => ({
      ...transaction,
      amount: Number(transaction.amount) || 0,
      date:
        transaction.date instanceof Date
          ? transaction.date.toISOString().split("T")[0]
          : transaction.date,
    })),
    upcomingDebts: upcomingDebtsResult.map((debt) => ({
      ...debt,
      current_amount: Number(debt.current_amount) || 0,
      due_date: debt.due_date instanceof Date ? debt.due_date.toISOString().split("T")[0] : debt.due_date,
    })),
    streak,
    challenges,
  }
}

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  const data = await getDashboardData(user.id)

  const balance = data.totalIncome - data.totalExpenses + (data.gamblingEnabled ? data.gamblingNetResult : 0)

  // ATIVOS: Saldo financeiro acumulado + Investimentos + Ganhos de apostas (se ativo)
  // PASSIVOS: Dívidas + Faturas de cartão + Perdas de apostas (se ativo)
  const financialBalance = data.allTimeIncome - data.allTimeExpenses // Saldo acumulado
  const assets = financialBalance + data.totalInvestments + (data.gamblingEnabled ? data.gamblingGains : 0)
  const liabilities = data.totalDebts + data.creditCardPending + (data.gamblingEnabled ? data.gamblingLosses : 0)
  const netWorth = assets - liabilities

  // Get user's plan slug
  let planSlug = "essencial"
  try {
    const planResult = await sql`
      SELECT p.slug FROM plans p
      JOIN users u ON u.plan_id = p.id
      WHERE u.id = ${user.id}
    `
    if (planResult.length > 0) {
      planSlug = planResult[0].slug
    }
  } catch {
    // Plan not found, use default
  }

  return (
    <DashboardOverview
      user={{
        ...user,
        plan_slug: planSlug,
        financial_score: user.financial_score || undefined,
        total_points: user.total_points || 0,
      }}
      data={{
        ...data,
        balance,
        netWorth,
      }}
    />
  )
}
