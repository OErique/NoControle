import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ cardId: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { cardId } = await params

    if (!isValidUUID(cardId)) {
      return NextResponse.json({ error: "Invalid card ID" }, { status: 400 })
    }

    const cards = await sql`
      SELECT * FROM credit_cards
      WHERE id = ${cardId} AND user_id = ${user.id}
    `

    if (cards.length === 0) {
      return NextResponse.json({ error: "Cartão não encontrado" }, { status: 404 })
    }

    return NextResponse.json({ card: cards[0] })
  } catch (error) {
    console.error("Error fetching credit card:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ cardId: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { cardId } = await params

    if (!isValidUUID(cardId)) {
      return NextResponse.json({ error: "Invalid card ID" }, { status: 400 })
    }

    const body = await request.json()

    // Verify ownership
    const existing = await sql`
      SELECT id, current_balance FROM credit_cards WHERE id = ${cardId} AND user_id = ${user.id}
    `
    if (existing.length === 0) {
      return NextResponse.json({ error: "Cartão não encontrado" }, { status: 404 })
    }

    const currentBalance = existing[0].current_balance || 0
    const newLimit = body.credit_limit ? Number(body.credit_limit) : null

    const result = await sql`
      UPDATE credit_cards
      SET 
        name = COALESCE(${body.name}, name),
        brand = COALESCE(${body.brand}, brand),
        last_digits = COALESCE(${body.last_digits}, last_digits),
        credit_limit = COALESCE(${newLimit}, credit_limit),
        available_limit = COALESCE(${newLimit ? newLimit - currentBalance : null}, available_limit),
        closing_day = COALESCE(${body.closing_day ? Number(body.closing_day) : null}, closing_day),
        due_day = COALESCE(${body.due_day ? Number(body.due_day) : null}, due_day),
        color = COALESCE(${body.color}, color)
      WHERE id = ${cardId} AND user_id = ${user.id}
      RETURNING *
    `

    return NextResponse.json({ success: true, card: result[0] })
  } catch (error) {
    console.error("Error updating credit card:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ cardId: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { cardId } = await params

    if (!isValidUUID(cardId)) {
      return NextResponse.json({ error: "Invalid card ID" }, { status: 400 })
    }

    // Soft delete - just deactivate
    await sql`
      UPDATE credit_cards
      SET is_active = false
      WHERE id = ${cardId} AND user_id = ${user.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting credit card:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
