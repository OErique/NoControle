import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userChallengeId } = await req.json()

    // Get challenge info
    const challenges = await sql`
      SELECT uc.*, c.reward_points, c.name
      FROM user_challenges uc
      JOIN challenges c ON uc.challenge_id = c.id
      WHERE uc.id = ${userChallengeId} 
        AND uc.user_id = ${user.id}
        AND uc.status = 'active'
    `

    if (challenges.length === 0) {
      return NextResponse.json({ error: "Desafio não encontrado" }, { status: 404 })
    }

    const challenge = challenges[0]
    const targetValue = Number(challenge.target_value) || 1
    const currentValue = Number(challenge.current_value) || 0

    if (currentValue < targetValue) {
      return NextResponse.json(
        {
          error: "Desafio ainda não foi completado",
          progress: (currentValue / targetValue) * 100,
        },
        { status: 400 },
      )
    }

    // Mark as completed
    await sql`
      UPDATE user_challenges 
      SET status = 'completed', completed_at = NOW()
      WHERE id = ${userChallengeId}
    `

    // Award points
    await sql`
      UPDATE users SET total_points = total_points + ${challenge.reward_points}
      WHERE id = ${user.id}
    `

    // Log points transaction
    try {
      await sql`
        INSERT INTO points_transactions (user_id, amount, type, description)
        VALUES (${user.id}, ${challenge.reward_points}, 'challenge_complete', ${`Completou: ${challenge.name}`})
      `
    } catch (e) {
      // Table might not exist, ignore
    }

    return NextResponse.json({
      success: true,
      points: challenge.reward_points,
      message: `Parabéns! Você ganhou ${challenge.reward_points} pontos!`,
    })
  } catch (error) {
    console.error("Error completing challenge:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
