import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const history = await sql`
      SELECT 
        id, file_name, file_type, total_transactions,
        imported_transactions, skipped_duplicates,
        total_income::float, total_expense::float,
        period_start, period_end, status, created_at
      FROM import_history
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT 20
    `

    return NextResponse.json(history)
  } catch (error) {
    console.error("History error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
