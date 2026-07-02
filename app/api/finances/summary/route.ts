import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const month = searchParams.get("month") || new Date().toISOString().slice(0, 7)

    const startDate = `${month}-01`
    const endDate = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).toISOString().split("T")[0]

    // Fetch incomes with category info
    const incomes = await sql`
      SELECT i.*, ic.name as category_name, ic.color as category_color
      FROM incomes i
      LEFT JOIN income_categories ic ON i.category_id = ic.id
      WHERE i.user_id = ${user.id}
        AND i.date >= ${startDate}
        AND i.date <= ${endDate}
      ORDER BY i.date DESC
    `

    // Fetch expenses with category info
    const expenses = await sql`
      SELECT e.*, ec.name as category_name, ec.color as category_color
      FROM expenses e
      LEFT JOIN expense_categories ec ON e.category_id = ec.id
      WHERE e.user_id = ${user.id}
        AND e.date >= ${startDate}
        AND e.date <= ${endDate}
      ORDER BY e.date DESC
    `

    // Calculate totals
    const totalIncome = incomes.reduce((sum: number, i: any) => sum + Number(i.amount), 0)
    const totalExpenses = expenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0)

    // Group expenses by category
    const expensesByCategory = expenses.reduce((acc: any[], exp: any) => {
      const categoryName = exp.category_name || "Outros"
      const existing = acc.find((c) => c.category === categoryName)
      if (existing) {
        existing.total += Number(exp.amount)
      } else {
        acc.push({
          category: categoryName,
          color: exp.category_color || "#888888",
          total: Number(exp.amount),
        })
      }
      return acc
    }, [])

    return NextResponse.json({
      incomes,
      expenses,
      totalIncome,
      totalExpenses,
      expensesByCategory,
      currentMonth: month,
    })
  } catch (error) {
    console.error("Error fetching finances summary:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
