import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"


export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear

    // Current month expenses
    const [currentExpenses] = await sql`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE user_id = ${user.id}
        AND EXTRACT(MONTH FROM date) = ${currentMonth}
        AND EXTRACT(YEAR FROM date) = ${currentYear}
    `

    // Previous month expenses
    const [previousExpenses] = await sql`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE user_id = ${user.id}
        AND EXTRACT(MONTH FROM date) = ${previousMonth}
        AND EXTRACT(YEAR FROM date) = ${previousYear}
    `

    // Current month income
    const [currentIncome] = await sql`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM incomes
      WHERE user_id = ${user.id}
        AND EXTRACT(MONTH FROM date) = ${currentMonth}
        AND EXTRACT(YEAR FROM date) = ${currentYear}
    `

    // Previous month income
    const [previousIncome] = await sql`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM incomes
      WHERE user_id = ${user.id}
        AND EXTRACT(MONTH FROM date) = ${previousMonth}
        AND EXTRACT(YEAR FROM date) = ${previousYear}
    `

    // Top category this month
    const [topCategory] = await sql`
      SELECT c.name, COALESCE(SUM(e.amount), 0) as amount
      FROM expenses e
      LEFT JOIN expense_categories c ON e.category_id = c.id
      WHERE e.user_id = ${user.id}
        AND EXTRACT(MONTH FROM e.date) = ${currentMonth}
        AND EXTRACT(YEAR FROM e.date) = ${currentYear}
      GROUP BY c.name
      ORDER BY amount DESC
      LIMIT 1
    `

    // Top category previous month
    const [previousTopCategory] = await sql`
      SELECT c.name, COALESCE(SUM(e.amount), 0) as amount
      FROM expenses e
      LEFT JOIN expense_categories c ON e.category_id = c.id
      WHERE e.user_id = ${user.id}
        AND EXTRACT(MONTH FROM e.date) = ${previousMonth}
        AND EXTRACT(YEAR FROM e.date) = ${previousYear}
      GROUP BY c.name
      ORDER BY amount DESC
      LIMIT 1
    `

    // Debts
    const [debts] = await sql`
      SELECT COALESCE(SUM(current_amount), 0) as total
      FROM debts
      WHERE user_id = ${user.id} AND status != 'paid'
    `

    // Investments
    const [investments] = await sql`
      SELECT COALESCE(SUM(current_amount), 0) as total
      FROM investments
      WHERE user_id = ${user.id} AND status = 'active'
    `

    const balance = Number(currentIncome?.total || 0) - Number(currentExpenses?.total || 0)

    return NextResponse.json({
      currentMonthExpenses: Number(currentExpenses?.total || 0),
      previousMonthExpenses: Number(previousExpenses?.total || 0),
      currentMonthIncome: Number(currentIncome?.total || 0),
      previousMonthIncome: Number(previousIncome?.total || 0),
      topCategory: topCategory?.name ? { name: topCategory.name, amount: Number(topCategory.amount) } : null,
      previousTopCategory: previousTopCategory?.name
        ? { name: previousTopCategory.name, amount: Number(previousTopCategory.amount) }
        : null,
      balance,
      totalDebts: Number(debts?.total || 0),
      totalInvestments: Number(investments?.total || 0),
      streak: user.current_streak || 0,
    })
  } catch (error) {
    console.error("Error fetching insights:", error)
    return NextResponse.json({
      currentMonthExpenses: 0,
      previousMonthExpenses: 0,
      currentMonthIncome: 0,
      previousMonthIncome: 0,
      topCategory: null,
      previousTopCategory: null,
      balance: 0,
      totalDebts: 0,
      totalInvestments: 0,
      streak: 0,
    })
  }
}
