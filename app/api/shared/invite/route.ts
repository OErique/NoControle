import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"
import { randomBytes } from "crypto"


export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { email } = await request.json()

    if (!email || email.toLowerCase() === user.email?.toLowerCase()) {
      return NextResponse.json({ error: "Você não pode enviar um convite para si mesmo" }, { status: 400 })
    }

    // Check if already has an active profile
    const existingProfiles = await sql`
      SELECT id FROM shared_profiles
      WHERE owner_user_id = ${user.id} AND status = 'accepted'
    `

    if (existingProfiles.length > 0) {
      return NextResponse.json({ error: "Você já possui um perfil compartilhado ativo" }, { status: 400 })
    }

    // Check if already sent a pending invite to this email
    const pendingInvites = await sql`
      SELECT id FROM shared_profiles
      WHERE owner_user_id = ${user.id} 
        AND partner_email = ${email} 
        AND status = 'pending'
    `

    if (pendingInvites.length > 0) {
      return NextResponse.json({ error: "Você já enviou um convite para este email" }, { status: 400 })
    }

    // Check if partner exists
    const partners = await sql`SELECT id FROM users WHERE email = ${email}`
    const partner = partners[0]

    // Create invite token
    const inviteToken = randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    await sql`
      INSERT INTO shared_profiles (owner_user_id, partner_user_id, partner_email, invite_token, invite_expires_at, status)
      VALUES (${user.id}, ${partner?.id || null}, ${email}, ${inviteToken}, ${expiresAt.toISOString()}, 'pending')
    `

    if (partner?.id) {
      try {
        // Check if notifications table exists
        const tableCheck = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'notifications'
          )
        `

        if (tableCheck[0]?.exists) {
          await sql`
            INSERT INTO notifications (user_id, type, title, message, action_url, read)
            VALUES (
              ${partner.id}, 
              'invite', 
              'Convite de Perfil Compartilhado', 
              ${`${user.name || "Alguém"} quer compartilhar finanças com você!`},
              '/shared',
              false
            )
          `
        }
      } catch (notifError) {
        console.error("Error creating notification:", notifError)
      }
    }

    return NextResponse.json({ success: true, message: "Convite enviado" })
  } catch (error) {
    console.error("Error sending invite:", error)
    return NextResponse.json({ error: "Erro ao enviar convite" }, { status: 500 })
  }
}
