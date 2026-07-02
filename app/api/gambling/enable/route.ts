import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"


export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { enabled } = body

    await sql`
      UPDATE users SET gambling_enabled = ${enabled} WHERE id = ${user.id}
    `

    // Create default alert settings if enabling
    if (enabled) {
      await sql`
        INSERT INTO gambling_alerts (user_id, monthly_limit, alert_at_percentage)
        VALUES (${user.id}, 500, 80)
        ON CONFLICT DO NOTHING
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error enabling gambling module:", error)
    return NextResponse.json({ error: "Erro ao ativar módulo" }, { status: 500 })
  }
}
