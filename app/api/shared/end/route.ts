import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"


export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Get profile
    const profiles = await sql`
      SELECT id, owner_user_id, partner_user_id
      FROM shared_profiles
      WHERE (owner_user_id = ${user.id} OR partner_user_id = ${user.id})
        AND status = 'accepted'
        AND ended_at IS NULL
      LIMIT 1
    `

    if (profiles.length === 0) {
      return NextResponse.json({ error: "Nenhum perfil compartilhado encontrado" }, { status: 404 })
    }

    const profile = profiles[0]

    // End the connection (keep data frozen)
    await sql`
      UPDATE shared_profiles
      SET status = 'ended', ended_at = NOW()
      WHERE id = ${profile.id}
    `

    // Log activity
    await sql`
      INSERT INTO couple_activities (shared_profile_id, user_id, activity_type, title, description)
      VALUES (${profile.id}, ${user.id}, 'connection_ended', 'Conexão encerrada', 'O perfil compartilhado foi encerrado')
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error ending shared profile:", error)
    return NextResponse.json({ error: "Erro ao encerrar conexão" }, { status: 500 })
  }
}
