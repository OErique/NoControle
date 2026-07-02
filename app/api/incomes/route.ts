import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { description, amount, categoryId, date, isRecurring, recurrenceType } = body

    if (!description || !amount) {
      return NextResponse.json({ error: "Descrição e valor são obrigatórios" }, { status: 400 })
    }

    const newIncomes = await sql`
      INSERT INTO incomes (
        user_id, category_id, description, amount, date, is_recurring, recurrence_type
      )
      VALUES (
        ${user.id}, ${categoryId}, ${description}, ${amount}, ${date}, ${isRecurring}, ${recurrenceType}
      )
      RETURNING *
    `

    // Get category info
    if (categoryId) {
      const categories = await sql`
        SELECT name as category_name, color as category_color
        FROM income_categories WHERE id = ${categoryId}
      `
      if (categories.length > 0) {
        return NextResponse.json({ ...newIncomes[0], ...categories[0] })
      }
    }

    return NextResponse.json(newIncomes[0])
  } catch (error) {
    console.error("Create income error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
