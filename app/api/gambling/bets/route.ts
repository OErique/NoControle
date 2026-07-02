import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"


export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const bets = await sql`
      SELECT * FROM gambling_bets 
      WHERE user_id = ${user.id}
      ORDER BY bet_date DESC, created_at DESC
      LIMIT 50
    `

    return NextResponse.json({ bets })
  } catch (error) {
    console.error("Error fetching bets:", error)
    return NextResponse.json({ bets: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { bet_date, amount_bet, amount_won, platform, notes } = body

    const [bet] = await sql`
      INSERT INTO gambling_bets (user_id, bet_date, amount_bet, amount_won, platform, notes)
      VALUES (${user.id}, ${bet_date}, ${amount_bet}, ${amount_won || 0}, ${platform}, ${notes})
      RETURNING *
    `

    return NextResponse.json({ bet })
  } catch (error) {
    console.error("Error creating bet:", error)
    return NextResponse.json({ error: "Erro ao registrar aposta" }, { status: 500 })
  }
}
