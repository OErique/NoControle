import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"


export async function PATCH(request: NextRequest, { params }: { params: Promise<{ goalId: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { goalId } = await params
    const updates = await request.json()

    // Verify goal belongs to user's shared profile
    const goals = await sql`
      SELECT sg.*, sp.who_can_edit_goals, sp.owner_user_id
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
    const isOwner = goal.owner_user_id === user.id

    // Check edit permission
    if (goal.who_can_edit_goals === "owner" && !isOwner) {
      return NextResponse.json({ error: "Apenas o criador do perfil pode editar metas" }, { status: 403 })
    }

    // Update goal
    await sql`
      UPDATE shared_goals
      SET 
        name = COALESCE(${updates.name}, name),
        target_amount = COALESCE(${updates.target_amount}, target_amount),
        target_date = COALESCE(${updates.target_date}, target_date),
        category = COALESCE(${updates.category}, category),
        description = COALESCE(${updates.description}, description),
        is_paused = COALESCE(${updates.is_paused}, is_paused),
        updated_at = NOW()
      WHERE id = ${goalId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating goal:", error)
    return NextResponse.json({ error: "Erro ao atualizar meta" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ goalId: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { goalId } = await params

    // Verify goal belongs to user's shared profile
    const goals = await sql`
      SELECT sg.id
      FROM shared_goals sg
      JOIN shared_profiles sp ON sg.shared_profile_id = sp.id
      WHERE sg.id = ${goalId}
        AND (sp.owner_user_id = ${user.id} OR sp.partner_user_id = ${user.id})
        AND sp.status = 'accepted'
    `

    if (goals.length === 0) {
      return NextResponse.json({ error: "Meta não encontrada" }, { status: 404 })
    }

    await sql`DELETE FROM shared_goals WHERE id = ${goalId}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting goal:", error)
    return NextResponse.json({ error: "Erro ao excluir meta" }, { status: 500 })
  }
}
