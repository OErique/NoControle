import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Verify ownership
    const existing = await sql`
      SELECT id FROM debts WHERE id = ${id} AND user_id = ${user.id}
    `

    if (existing.length === 0) {
      return NextResponse.json({ error: "Dívida não encontrada" }, { status: 404 })
    }

    const { creditor, categoryId, currentAmount, interestRate, dueDate, minimumPayment, notes, status } = body

    const updated = await sql`
      UPDATE debts
      SET 
        creditor = COALESCE(${creditor}, creditor),
        category_id = ${categoryId},
        current_amount = COALESCE(${currentAmount}, current_amount),
        interest_rate = COALESCE(${interestRate}, interest_rate),
        due_date = ${dueDate},
        minimum_payment = ${minimumPayment},
        notes = ${notes},
        status = COALESCE(${status}, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    // Get category info
    if (updated[0].category_id) {
      const categories = await sql`
        SELECT name as category_name, color as category_color
        FROM debt_categories WHERE id = ${updated[0].category_id}
      `
      if (categories.length > 0) {
        return NextResponse.json({ ...updated[0], ...categories[0] })
      }
    }

    return NextResponse.json(updated[0])
  } catch (error) {
    console.error("Update debt error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const existing = await sql`
      SELECT id FROM debts WHERE id = ${id} AND user_id = ${user.id}
    `

    if (existing.length === 0) {
      return NextResponse.json({ error: "Dívida não encontrada" }, { status: 404 })
    }

    await sql`DELETE FROM debts WHERE id = ${id}`

    return NextResponse.json({ message: "Dívida excluída com sucesso" })
  } catch (error) {
    console.error("Delete debt error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
