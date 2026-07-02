import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"


export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { inviteId } = await request.json()

    await sql`
      UPDATE shared_profiles
      SET status = 'accepted', partner_user_id = ${user.id}, accepted_at = NOW()
      WHERE id = ${inviteId} AND partner_email = ${user.email} AND status = 'pending'
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error accepting invite:", error)
    return NextResponse.json({ error: "Erro ao aceitar convite" }, { status: 500 })
  }
}
