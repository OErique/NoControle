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
      return NextResponse.json({ expenses: [] })
    }

    const expenses = await sql`
      SELECT ce.*, u.name as added_by_name
      FROM couple_expenses ce
      JOIN users u ON ce.added_by_user_id = u.id
      WHERE ce.shared_profile_id = ${profiles[0].id}
      ORDER BY ce.expense_date DESC, ce.created_at DESC
      LIMIT 50
    `

    return NextResponse.json({ expenses })
  } catch (error) {
    console.error("Error fetching couple expenses:", error)
    return NextResponse.json({ expenses: [] })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { description, amount, category, expense_date, split_type, owner_percentage } = await request.json()

    if (!description || !amount) {
      return NextResponse.json({ error: "Descrição e valor são obrigatórios" }, { status: 400 })
    }

    const profiles = await sql`
      SELECT id FROM shared_profiles
      WHERE (owner_user_id = ${user.id} OR partner_user_id = ${user.id})
        AND status = 'accepted'
        AND ended_at IS NULL
      LIMIT 1
    `

    if (profiles.length === 0) {
      return NextResponse.json({ error: "Nenhum perfil compartilhado encontrado" }, { status: 400 })
    }

    const ownerPct = owner_percentage || 50
    const partnerPct = 100 - ownerPct

    const result = await sql`
      INSERT INTO couple_expenses (
        shared_profile_id, 
        added_by_user_id, 
        description, 
        amount, 
        category,
        expense_date,
        split_type,
        owner_percentage,
        partner_percentage
      )
      VALUES (
        ${profiles[0].id}, 
        ${user.id}, 
        ${description}, 
        ${amount}, 
        ${category || "outros"},
        ${expense_date || new Date().toISOString().split("T")[0]},
        ${split_type || "equal"},
        ${ownerPct},
        ${partnerPct}
      )
      RETURNING *
    `

    // Log activity
    await sql`
      INSERT INTO couple_activities (shared_profile_id, user_id, activity_type, title, description)
      VALUES (${profiles[0].id}, ${user.id}, 'expense_added', 'Adicionou despesa compartilhada', ${`${description} - R$ ${amount}`})
    `

    // Check for first expense achievement
    const expenseCount = await sql`
      SELECT COUNT(*) as count FROM couple_expenses WHERE shared_profile_id = ${profiles[0].id}
    `

    if (Number(expenseCount[0]?.count) === 1) {
      await sql`
        INSERT INTO couple_achievements (shared_profile_id, achievement_type, name, description, icon, points)
        VALUES (${profiles[0].id}, 'couple_first_expense', 'Dividindo Contas', 'Registraram a primeira despesa compartilhada', 'receipt', 25)
        ON CONFLICT (shared_profile_id, achievement_type) DO NOTHING
      `
    }

    return NextResponse.json({ expense: result[0] })
  } catch (error) {
    console.error("Error creating couple expense:", error)
    return NextResponse.json({ error: "Erro ao criar despesa" }, { status: 500 })
  }
}
