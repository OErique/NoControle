import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"


export async function POST(request: NextRequest, { params }: { params: Promise<{ goalId: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { goalId } = await params
    const { amount, notes } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Valor inválido" }, { status: 400 })
    }

    // Verify goal belongs to user's shared profile
    const goals = await sql`
      SELECT sg.*, sp.id as profile_id
      FROM shared_goals sg
      JOIN shared_profiles sp ON sg.shared_profile_id = sp.id
      WHERE sg.id = ${goalId}
        AND (sp.owner_user_id = ${user.id} OR sp.partner_user_id = ${user.id})
        AND sp.status = 'accepted'
    `

    if (goals.length === 0) {
      return NextResponse.json({ error: "Meta não encontrada" }, { status: 404 })
    }

    const goal = goals[0]

    // Add contribution
    await sql`
      INSERT INTO shared_goal_contributions (goal_id, user_id, amount, notes)
      VALUES (${goalId}, ${user.id}, ${amount}, ${notes || null})
    `

    // Update goal current amount
    const newAmount = Number(goal.current_amount) + Number(amount)
    const isComplete = newAmount >= Number(goal.target_amount)

    await sql`
      UPDATE shared_goals
      SET current_amount = ${newAmount},
          status = ${isComplete ? "completed" : "active"},
          updated_at = NOW()
      WHERE id = ${goalId}
    `

    // Log activity
    await sql`
      INSERT INTO couple_activities (shared_profile_id, user_id, activity_type, title, description)
      VALUES (${goal.profile_id}, ${user.id}, 'goal_contribution', 'Contribuiu com a meta', ${`Adicionou R$ ${amount} na meta "${goal.name}"`})
    `

    await sql`
      UPDATE shared_profiles
      SET couple_points = COALESCE(couple_points, 0) + 10
      WHERE id = ${goal.profile_id}
    `

    // Check for goal completion achievement
    if (isComplete) {
      const achievementPoints = 150

      const inserted = await sql`
        INSERT INTO couple_achievements (shared_profile_id, achievement_type, name, description, icon, points)
        VALUES (${goal.profile_id}, 'goal_complete_${goalId}', 'Sonho Realizado', ${`Completaram a meta "${goal.name}"`}, 'trophy', ${achievementPoints})
        ON CONFLICT (shared_profile_id, achievement_type) DO NOTHING
        RETURNING id
      `

      if (inserted.length > 0) {
        await sql`
          UPDATE shared_profiles
          SET couple_points = COALESCE(couple_points, 0) + ${achievementPoints}
          WHERE id = ${goal.profile_id}
        `
      }
    }

    return NextResponse.json({
      success: true,
      newAmount,
      isComplete,
      message: isComplete
        ? "Meta concluída! Parabéns! +160 pontos do casal"
        : "Contribuição adicionada! +10 pontos do casal",
    })
  } catch (error) {
    console.error("Error contributing to goal:", error)
    return NextResponse.json({ error: "Erro ao contribuir" }, { status: 500 })
  }
}
