import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { FinancesModule } from "@/components/finances/finances-module"

async function getFinancesData(userId: string) {
  const currentMonth = new Date().toISOString().slice(0, 7)

  // Get incomes for current month
  const incomes = await sql`
    SELECT i.*, ic.name as category_name, ic.color as category_color
    FROM incomes i
    LEFT JOIN income_categories ic ON i.category_id = ic.id
    WHERE i.user_id = ${userId}
    AND TO_CHAR(i.date, 'YYYY-MM') = ${currentMonth}
    ORDER BY i.date DESC
  `

  // Get expenses for current month
  const expenses = await sql`
    SELECT e.*, ec.name as category_name, ec.color as category_color
    FROM expenses e
    LEFT JOIN expense_categories ec ON e.category_id = ec.id
    WHERE e.user_id = ${userId}
    AND TO_CHAR(e.date, 'YYYY-MM') = ${currentMonth}
    ORDER BY e.date DESC
  `

  const incomeCategories = await sql`
    SELECT DISTINCT ON (LOWER(TRIM(name))) *
    FROM income_categories 
    WHERE user_id IS NULL OR user_id = ${userId}
    ORDER BY LOWER(TRIM(name)), created_at
  `

  const expenseCategories = await sql`
    SELECT DISTINCT ON (LOWER(TRIM(name))) *
    FROM expense_categories 
    WHERE user_id IS NULL OR user_id = ${userId}
    ORDER BY LOWER(TRIM(name)), created_at
  `

  // Get monthly summary
  const incomeSummary = await sql`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM incomes
    WHERE user_id = ${userId}
    AND TO_CHAR(date, 'YYYY-MM') = ${currentMonth}
  `

  const expenseSummary = await sql`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM expenses
    WHERE user_id = ${userId}
    AND TO_CHAR(date, 'YYYY-MM') = ${currentMonth}
  `

  // Get expenses by category for chart
  const expensesByCategory = await sql`
    SELECT 
      ec.name as category,
      ec.color,
      COALESCE(SUM(e.amount), 0) as total
    FROM expenses e
    JOIN expense_categories ec ON e.category_id = ec.id
    WHERE e.user_id = ${userId}
    AND TO_CHAR(e.date, 'YYYY-MM') = ${currentMonth}
    GROUP BY ec.name, ec.color
    ORDER BY total DESC
  `

  // Get monthly history (last 6 months)
  const monthlyHistory = await sql`
    SELECT 
      TO_CHAR(date, 'YYYY-MM') as month,
      'income' as type,
      SUM(amount) as total
    FROM incomes
    WHERE user_id = ${userId}
    AND date >= CURRENT_DATE - INTERVAL '6 months'
    GROUP BY TO_CHAR(date, 'YYYY-MM')
    UNION ALL
    SELECT 
      TO_CHAR(date, 'YYYY-MM') as month,
      'expense' as type,
      SUM(amount) as total
    FROM expenses
    WHERE user_id = ${userId}
    AND date >= CURRENT_DATE - INTERVAL '6 months'
    GROUP BY TO_CHAR(date, 'YYYY-MM')
    ORDER BY month
  `

  return {
    incomes,
    expenses,
    incomeCategories,
    expenseCategories,
    totalIncome: Number(incomeSummary[0]?.total || 0),
    totalExpenses: Number(expenseSummary[0]?.total || 0),
    expensesByCategory,
    monthlyHistory,
    currentMonth,
  }
}

export default async function FinancesPage() {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  const data = await getFinancesData(user.id)

  return <FinancesModule data={data} userId={user.id} />
}
