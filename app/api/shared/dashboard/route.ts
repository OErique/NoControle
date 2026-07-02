import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"


export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const currentMonth = new Date().toISOString().slice(0, 7)

    // Get shared profile first
    const profiles = await sql`
      SELECT id, owner_user_id, partner_user_id, couple_level, couple_points, couple_streak, longest_couple_streak
      FROM shared_profiles
      WHERE (owner_user_id = ${user.id} OR partner_user_id = ${user.id})
        AND status = 'accepted'
        AND ended_at IS NULL
      LIMIT 1
    `

    if (profiles.length === 0) {
      return NextResponse.json({ error: "Nenhum perfil compartilhado" }, { status: 404 })
    }

    const profile = profiles[0]
    const partnerId = profile.owner_user_id === user.id ? profile.partner_user_id : profile.owner_user_id

    const [expensesResult, goalsResult, activities, achievements] = await Promise.all([
      sql`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM couple_expenses
        WHERE shared_profile_id = ${profile.id}
          AND TO_CHAR(expense_date, 'YYYY-MM') = ${currentMonth}
      `,
      sql`
        SELECT COUNT(*) as count
        FROM shared_goals
        WHERE shared_profile_id = ${profile.id}
          AND status = 'active'
          AND is_paused = false
      `,
      sql`
        SELECT ca.*, u.name as user_name, u.avatar_url
        FROM couple_activities ca
        JOIN users u ON ca.user_id = u.id
        WHERE ca.shared_profile_id = ${profile.id}
        ORDER BY ca.created_at DESC
        LIMIT 10
      `,
      sql`
        SELECT * FROM couple_achievements
        WHERE shared_profile_id = ${profile.id}
        ORDER BY earned_at DESC
      `,
    ])

    // Get last partner activity from activities array
    const lastPartnerActivity = activities.find((a: any) => a.user_id === partnerId) || null

    return NextResponse.json({
      stats: {
        totalExpenses: Number(expensesResult[0]?.total || 0),
        activeGoals: Number(goalsResult[0]?.count || 0),
        monthlySavings: 0,
        coupleLevel: profile.couple_level || 1,
        couplePoints: profile.couple_points || 0,
        coupleStreak: profile.couple_streak || 0,
        longestStreak: profile.longest_couple_streak || 0,
      },
      lastPartnerActivity,
      activities,
      chartData: [],
      achievements,
    })
  } catch (error: any) {
    console.error("Error fetching dashboard:", error)
    if (error.message?.includes("Too Many") || error.status === 429) {
      return NextResponse.json({ error: "Muitas requisições. Tente novamente em alguns segundos." }, { status: 429 })
    }
    return NextResponse.json({ error: "Erro ao carregar dashboard" }, { status: 500 })
  }
}
