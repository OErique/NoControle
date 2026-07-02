import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { challengeId } = await req.json()

    if (!challengeId) {
      return NextResponse.json({ error: "Challenge ID is required" }, { status: 400 })
    }

    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'challenges'
      )
    `

    if (!tableExists[0]?.exists) {
      return NextResponse.json(
        {
          error: "Sistema de desafios não configurado. Execute o script 005-gamification-tables.sql",
        },
        { status: 503 },
      )
    }

    // Get challenge details
    const challenge = await sql`
      SELECT * FROM challenges WHERE id = ${challengeId} AND is_active = true
    `

    if (challenge.length === 0) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 })
    }

    const c = challenge[0]
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + (c.duration_days || 30))

    // Check if user already has this challenge active
    const existing = await sql`
      SELECT id FROM user_challenges 
      WHERE user_id = ${user.id} AND challenge_id = ${challengeId} AND status = 'active'
    `

    if (existing.length > 0) {
      return NextResponse.json({ error: "Desafio já está ativo" }, { status: 400 })
    }

    // Create user challenge
    const result = await sql`
      INSERT INTO user_challenges (user_id, challenge_id, start_date, end_date, current_value, status)
      VALUES (${user.id}, ${challengeId}, ${startDate.toISOString().split("T")[0]}, ${endDate.toISOString().split("T")[0]}, 0, 'active')
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error starting challenge:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
