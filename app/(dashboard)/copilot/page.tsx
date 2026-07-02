import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { CopilotModule } from "@/components/copilot/copilot-module"
import { redirect } from "next/navigation"

async function getCopilotData(userId: string) {
  const currentMonth = new Date().toISOString().slice(0, 7)
  const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7)

  const [currentExpenses, lastMonthExpenses, monthlyTotals, incomeResult, debtsResult, investmentsResult] =
    await Promise.all([
      sql`
      SELECT 
        ec.name as category,
        COALESCE(SUM(e.amount), 0) as total
      FROM expenses e
      LEFT JOIN expense_categories ec ON e.category_id = ec.id
      WHERE e.user_id = ${userId}
      AND TO_CHAR(e.date, 'YYYY-MM') = ${currentMonth}
      GROUP BY ec.name
      ORDER BY total DESC
    `,
      sql`
      SELECT 
        ec.name as category,
        COALESCE(SUM(e.amount), 0) as total
      FROM expenses e
      LEFT JOIN expense_categories ec ON e.category_id = ec.id
      WHERE e.user_id = ${userId}
      AND TO_CHAR(e.date, 'YYYY-MM') = ${lastMonth}
      GROUP BY ec.name
      ORDER BY total DESC
    `,
      sql`
      SELECT 
        TO_CHAR(date, 'YYYY-MM') as month,
        SUM(amount) as total
      FROM expenses
      WHERE user_id = ${userId}
      AND date >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY TO_CHAR(date, 'YYYY-MM')
      ORDER BY month DESC
    `,
      sql`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM incomes
      WHERE user_id = ${userId}
      AND TO_CHAR(date, 'YYYY-MM') = ${currentMonth}
    `,
      sql`
      SELECT creditor, current_amount, interest_rate, due_date
      FROM debts
      WHERE user_id = ${userId} AND status = 'active'
      ORDER BY interest_rate DESC
      LIMIT 5
    `,
      sql`
      SELECT name, initial_amount, current_amount
      FROM investments
      WHERE user_id = ${userId} AND status = 'active'
    `,
    ])

  const currentTotal = currentExpenses.reduce((sum: number, e: any) => sum + Number(e.total), 0)
  const lastTotal = lastMonthExpenses.reduce((sum: number, e: any) => sum + Number(e.total), 0)

  return {
    currentExpenses: currentExpenses.map((e: any) => ({
      category: e.category || "Sem categoria",
      total: Number(e.total),
    })),
    lastMonthExpenses: lastMonthExpenses.map((e: any) => ({
      category: e.category || "Sem categoria",
      total: Number(e.total),
    })),
    monthlyTotals: monthlyTotals.map((m: any) => ({ month: m.month, total: Number(m.total) })),
    currentTotal,
    lastTotal,
    percentChange: lastTotal > 0 ? ((currentTotal - lastTotal) / lastTotal) * 100 : 0,
    income: Number(incomeResult[0]?.total) || 0,
    debts: debtsResult.map((d: any) => ({
      creditor: d.creditor,
      amount: Number(d.current_amount),
      interestRate: Number(d.interest_rate),
      dueDate: d.due_date,
    })),
    investments: investmentsResult.map((i: any) => ({
      name: i.name,
      initialAmount: Number(i.initial_amount),
      currentAmount: Number(i.current_amount),
    })),
  }
}

export default async function CopilotPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  // Get user plan
  const planResult = await sql`
    SELECT p.slug FROM plans p
    JOIN users u ON u.plan_id = p.id
    WHERE u.id = ${user.id}
  `

  const planSlug = planResult[0]?.slug || "essencial"
  const hasAccess = planSlug === "completo" || planSlug === "total"

  const data = await getCopilotData(user.id)

  return <CopilotModule data={data} user={{ ...user, plan_slug: planSlug }} hasAccess={hasAccess} />
}
