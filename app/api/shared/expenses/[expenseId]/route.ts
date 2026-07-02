import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"


export async function PUT(request: Request, { params }: { params: Promise<{ expenseId: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { expenseId } = await params
    const { description, amount, category, expense_date, split_type, owner_percentage } = await request.json()

    // Verify ownership
    const expense = await sql`
      SELECT ce.*, sp.owner_user_id, sp.partner_user_id
      FROM couple_expenses ce
      JOIN shared_profiles sp ON ce.shared_profile_id = sp.id
      WHERE ce.id = ${expenseId}
    `

    if (expense.length === 0) {
      return NextResponse.json({ error: "Despesa não encontrada" }, { status: 404 })
    }

    // Only the person who added can edit, or if they are part of the couple
    const isPartOfCouple = expense[0].owner_user_id === user.id || expense[0].partner_user_id === user.id
    if (!isPartOfCouple) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
    }

    const ownerPct = owner_percentage || 50
    const partnerPct = 100 - ownerPct

    const result = await sql`
      UPDATE couple_expenses
      SET 
        description = ${description},
        amount = ${amount},
        category = ${category || "outros"},
        expense_date = ${expense_date},
        split_type = ${split_type || "equal"},
        owner_percentage = ${ownerPct},
        partner_percentage = ${partnerPct},
        updated_at = NOW()
      WHERE id = ${expenseId}
      RETURNING *
    `

    return NextResponse.json({ expense: result[0] })
  } catch (error) {
    console.error("Error updating expense:", error)
    return NextResponse.json({ error: "Erro ao atualizar despesa" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ expenseId: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { expenseId } = await params

    // Verify ownership
    const expense = await sql`
      SELECT ce.*, sp.owner_user_id, sp.partner_user_id
      FROM couple_expenses ce
      JOIN shared_profiles sp ON ce.shared_profile_id = sp.id
      WHERE ce.id = ${expenseId}
    `

    if (expense.length === 0) {
      return NextResponse.json({ error: "Despesa não encontrada" }, { status: 404 })
    }

    // Only the person who added can delete, or if they are part of the couple
    const isPartOfCouple = expense[0].owner_user_id === user.id || expense[0].partner_user_id === user.id
    if (!isPartOfCouple) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
    }

    await sql`DELETE FROM couple_expenses WHERE id = ${expenseId}`

    // Log activity
    await sql`
      INSERT INTO couple_activities (shared_profile_id, user_id, activity_type, title, description)
      VALUES (${expense[0].shared_profile_id}, ${user.id}, 'expense_deleted', 'Removeu despesa', ${expense[0].description})
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting expense:", error)
    return NextResponse.json({ error: "Erro ao excluir despesa" }, { status: 500 })
  }
}
