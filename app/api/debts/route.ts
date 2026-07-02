import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const debts = await sql`
      SELECT d.*, dc.name as category_name, dc.color as category_color
      FROM debts d
      LEFT JOIN debt_categories dc ON d.category_id = dc.id
      WHERE d.user_id = ${user.id}
      ORDER BY d.created_at DESC
    `

    return NextResponse.json(debts)
  } catch (error) {
    console.error("Get debts error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { creditor, categoryId, originalAmount, currentAmount, interestRate, dueDate, minimumPayment, notes } = body

    if (!creditor || !originalAmount) {
      return NextResponse.json({ error: "Credor e valor original são obrigatórios" }, { status: 400 })
    }

    const newDebts = await sql`
      INSERT INTO debts (
        user_id, category_id, creditor, original_amount, current_amount,
        interest_rate, due_date, minimum_payment, notes
      )
      VALUES (
        ${user.id}, ${categoryId}, ${creditor}, ${originalAmount},
        ${currentAmount || originalAmount}, ${interestRate || 0},
        ${dueDate || null}, ${minimumPayment || null}, ${notes || null}
      )
      RETURNING *
    `

    // Get category info
    if (categoryId) {
      const categories = await sql`
        SELECT name as category_name, color as category_color
        FROM debt_categories WHERE id = ${categoryId}
      `
      if (categories.length > 0) {
        return NextResponse.json({ ...newDebts[0], ...categories[0] })
      }
    }

    return NextResponse.json(newDebts[0])
  } catch (error) {
    console.error("Create debt error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
