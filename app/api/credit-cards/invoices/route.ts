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
        WHERE table_name = 'credit_card_invoices'
      )
    `

    if (!tableCheck[0]?.exists) {
      return NextResponse.json({ invoices: [] })
    }

    const invoices = await sql`
      SELECT i.* FROM credit_card_invoices i
      JOIN credit_cards c ON i.credit_card_id = c.id
      WHERE c.user_id = ${user.id}
      ORDER BY i.reference_year DESC, i.reference_month DESC
      LIMIT 20
    `

    return NextResponse.json({ invoices })
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return NextResponse.json({ invoices: [] })
  }
}
