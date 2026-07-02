import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"


export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const profiles = await sql`
      SELECT id FROM shared_profiles
      WHERE (owner_user_id = ${user.id} OR partner_user_id = ${user.id})
        AND status = 'accepted'
        AND ended_at IS NULL
      LIMIT 1
    `

    if (profiles.length === 0) {
      return NextResponse.json({ insights: [] })
    }

    const profileId = profiles[0].id
    const currentMonth = new Date().toISOString().slice(0, 7)
    const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7)

    // Current month expenses
    const currentExpenses = await sql`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM couple_expenses
      WHERE shared_profile_id = ${profileId}
        AND TO_CHAR(expense_date, 'YYYY-MM') = ${currentMonth}
    `

    // Last month expenses
    const lastExpenses = await sql`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM couple_expenses
      WHERE shared_profile_id = ${profileId}
        AND TO_CHAR(expense_date, 'YYYY-MM') = ${lastMonth}
    `

    // Top category
    const topCategory = await sql`
      SELECT category, SUM(amount) as total
      FROM couple_expenses
      WHERE shared_profile_id = ${profileId}
        AND TO_CHAR(expense_date, 'YYYY-MM') = ${currentMonth}
      GROUP BY category
      ORDER BY total DESC
      LIMIT 1
    `

    // Goals progress
    const goalsProgress = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) as total
      FROM shared_goals
      WHERE shared_profile_id = ${profileId}
    `

    const insights = []

    // Compare months
    const currentTotal = Number(currentExpenses[0]?.total || 0)
    const lastTotal = Number(lastExpenses[0]?.total || 0)

    if (lastTotal > 0) {
      const percentChange = ((currentTotal - lastTotal) / lastTotal) * 100
      if (percentChange > 10) {
        insights.push({
          type: "warning",
          icon: "trending-up",
          message: `Vocês gastaram ${percentChange.toFixed(0)}% a mais este mês comparado ao mês passado. Vamos ficar de olho!`,
        })
      } else if (percentChange < -10) {
        insights.push({
          type: "success",
          icon: "trending-down",
          message: `Parabéns! Vocês economizaram ${Math.abs(percentChange).toFixed(0)}% este mês comparado ao anterior. Continuem assim!`,
        })
      }
    }

    // Top category insight
    if (topCategory[0]) {
      insights.push({
        type: "info",
        icon: "pie-chart",
        message: `"${topCategory[0].category}" é a maior categoria de gastos do casal este mês.`,
      })
    }

    // Goals insight
    const completedGoals = Number(goalsProgress[0]?.completed || 0)
    const totalGoals = Number(goalsProgress[0]?.total || 0)

    if (totalGoals > 0 && completedGoals > 0) {
      insights.push({
        type: "success",
        icon: "trophy",
        message: `Vocês já completaram ${completedGoals} de ${totalGoals} metas juntos. Excelente trabalho em equipe!`,
      })
    }

    // Motivational insight
    insights.push({
      type: "motivation",
      icon: "heart",
      message: "Casais que planejam juntos, economizam mais. Continuem organizando suas finanças!",
    })

    return NextResponse.json({ insights })
  } catch (error) {
    console.error("Error fetching insights:", error)
    return NextResponse.json({ insights: [] })
  }
}
