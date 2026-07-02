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
      SET status = 'rejected'
      WHERE id = ${inviteId} AND partner_email = ${user.email}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error rejecting invite:", error)
    return NextResponse.json({ error: "Erro ao recusar convite" }, { status: 500 })
  }
}
