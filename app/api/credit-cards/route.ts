import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const cards = await sql`
      SELECT * FROM credit_cards
      WHERE user_id = ${user.id} AND is_active = true
      ORDER BY name
    `

    return NextResponse.json({ cards: cards || [] })
  } catch (error) {
    console.error("Error fetching credit cards:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const name = body.name
    const lastDigits = body.last_digits || body.lastDigits || ""
    const brand = body.brand || ""
    const creditLimit = Number(body.credit_limit || body.creditLimit || 0)
    const closingDay = Number(body.closing_day || body.closingDay || 1)
    const dueDay = Number(body.due_day || body.dueDay || 10)
    const color = body.color || null

    if (!name) {
      return NextResponse.json({ error: "Nome do cartão é obrigatório" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO credit_cards (user_id, name, last_digits, brand, credit_limit, closing_day, due_day, color, current_balance, available_limit, is_active)
      VALUES (${user.id}, ${name}, ${lastDigits}, ${brand}, ${creditLimit}, ${closingDay}, ${dueDay}, ${color}, 0, ${creditLimit}, true)
      RETURNING *
    `

    return NextResponse.json({ success: true, card: result[0] }, { status: 201 })
  } catch (error) {
    console.error("Error creating credit card:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
