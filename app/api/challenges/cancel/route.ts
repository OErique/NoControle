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

    if (!userChallengeId) {
      return NextResponse.json({ error: "ID do desafio é obrigatório" }, { status: 400 })
    }

    const result = await sql`
      UPDATE user_challenges 
      SET status = 'cancelled'
      WHERE id = ${userChallengeId} 
        AND user_id = ${user.id}
        AND status = 'active'
      RETURNING challenge_id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Desafio não encontrado ou já finalizado" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Desafio cancelado com sucesso." })
  } catch (error) {
    console.error("Error cancelling challenge:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
