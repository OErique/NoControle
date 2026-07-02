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
        WHERE table_name = 'shared_profiles'
      )
    `

    if (!tableCheck[0]?.exists) {
      return NextResponse.json({ invites: [] })
    }

    const invites = await sql`
      SELECT sp.*, u.name as owner_name, u.avatar_url as owner_avatar
      FROM shared_profiles sp
      LEFT JOIN users u ON sp.owner_user_id = u.id
      WHERE sp.partner_email = ${user.email}
        AND sp.status = 'pending'
        AND (sp.invite_expires_at IS NULL OR sp.invite_expires_at > NOW())
    `

    return NextResponse.json({ invites })
  } catch (error) {
    console.error("Error fetching invites:", error)
    return NextResponse.json({ invites: [] })
  }
}
