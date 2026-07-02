import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"


export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Check if table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'shared_goals'
      )
    `

    if (!tableCheck[0]?.exists) {
      return NextResponse.json({ goals: [] })
    }

    const goals = await sql`
      SELECT 
        sg.*,
        u.name as created_by_name,
        (
          SELECT COALESCE(json_agg(
            json_build_object(
              'id', sgc.id,
              'amount', sgc.amount,
              'notes', sgc.notes,
              'created_at', sgc.created_at,
              'user_name', cu.name
            ) ORDER BY sgc.created_at DESC
          ), '[]'::json)
          FROM shared_goal_contributions sgc
          LEFT JOIN users cu ON sgc.user_id = cu.id
          WHERE sgc.goal_id = sg.id
        ) as contributions
      FROM shared_goals sg
      JOIN shared_profiles sp ON sg.shared_profile_id = sp.id
      LEFT JOIN users u ON sg.created_by_user_id = u.id
      WHERE (sp.owner_user_id = ${user.id} OR sp.partner_user_id = ${user.id})
        AND sp.status = 'accepted'
      ORDER BY sg.created_at DESC
    `

    return NextResponse.json({ goals })
  } catch (error) {
    console.error("Error fetching shared goals:", error)
    return NextResponse.json({ goals: [] })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { name, target_amount, target_date, category, contribution_type, monthly_contribution, description, icon } =
      await request.json()

    if (!name || !target_amount) {
      return NextResponse.json({ error: "Nome e valor são obrigatórios" }, { status: 400 })
    }

    // Get the shared profile
    const profiles = await sql`
      SELECT id, who_can_create_goals, owner_user_id, partner_user_id 
      FROM shared_profiles 
      WHERE (owner_user_id = ${user.id} OR partner_user_id = ${user.id})
        AND status = 'accepted'
        AND ended_at IS NULL
      LIMIT 1
    `

    if (profiles.length === 0) {
      return NextResponse.json({ error: "Nenhum perfil compartilhado encontrado" }, { status: 400 })
    }

    const profile = profiles[0]
    const isOwner = profile.owner_user_id === user.id

    // Check permission
    if (profile.who_can_create_goals === "owner" && !isOwner) {
      return NextResponse.json({ error: "Apenas o criador do perfil pode criar metas" }, { status: 403 })
    }

    // Create the goal
    const result = await sql`
      INSERT INTO shared_goals (
        shared_profile_id, 
        name, 
        target_amount, 
        current_amount, 
        target_date, 
        category, 
        contribution_type,
        monthly_contribution,
        description,
        icon,
        created_by_user_id,
        status
      )
      VALUES (
        ${profile.id}, 
        ${name}, 
        ${target_amount}, 
        0, 
        ${target_date || null}, 
        ${category || "outro"},
        ${contribution_type || "manual"},
        ${monthly_contribution || null},
        ${description || null},
        ${icon || "target"},
        ${user.id},
        'active'
      )
      RETURNING *
    `

    // Log activity
    await sql`
      INSERT INTO couple_activities (shared_profile_id, user_id, activity_type, title, description)
      VALUES (${profile.id}, ${user.id}, 'goal_created', 'Criou uma nova meta', ${`Meta "${name}" com objetivo de R$ ${target_amount}`})
    `

    // Check for first goal achievement
    const goalCount = await sql`
      SELECT COUNT(*) as count FROM shared_goals WHERE shared_profile_id = ${profile.id}
    `

    if (Number(goalCount[0]?.count) === 1) {
      await sql`
        INSERT INTO couple_achievements (shared_profile_id, achievement_type, name, description, icon, points)
        VALUES (${profile.id}, 'couple_first_goal', 'Primeira Meta Juntos', 'Criaram a primeira meta do casal', 'target', 50)
        ON CONFLICT (shared_profile_id, achievement_type) DO NOTHING
      `
    }

    return NextResponse.json({ goal: result[0] })
  } catch (error) {
    console.error("Error creating shared goal:", error)
    return NextResponse.json({ error: "Erro ao criar meta" }, { status: 500 })
  }
}
