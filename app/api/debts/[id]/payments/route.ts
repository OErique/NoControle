import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { amount, paymentDate, notes } = body

    // Verify ownership and get current debt
    const debts = await sql`
      SELECT * FROM debts WHERE id = ${id} AND user_id = ${user.id}
    `

    if (debts.length === 0) {
      return NextResponse.json({ error: "Dívida não encontrada" }, { status: 404 })
    }

    const debt = debts[0]

    if (amount > debt.current_amount) {
      return NextResponse.json({ error: "Valor do pagamento maior que o valor da dívida" }, { status: 400 })
    }

    // Create payment record
    await sql`
      INSERT INTO debt_payments (debt_id, amount, payment_date, notes)
      VALUES (${id}, ${amount}, ${paymentDate}, ${notes})
    `

    // Update debt current amount
    const newAmount = debt.current_amount - amount
    const newStatus = newAmount <= 0 ? "paid" : debt.status

    const updated = await sql`
      UPDATE debts
      SET 
        current_amount = ${Math.max(0, newAmount)},
        status = ${newStatus},
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
    console.error("Create payment error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
