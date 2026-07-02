import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { monthlyIncome, hasDebts, mainGoal } = body

    // Update user profile
    await sql`
      UPDATE users
      SET 
        monthly_income = ${monthlyIncome},
        has_debts = ${hasDebts},
        main_goal = ${mainGoal},
        onboarding_completed = true,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${user.id}
    `

    return NextResponse.json({
      message: "Onboarding concluído com sucesso",
      mainGoal,
    })
  } catch (error) {
    console.error("Onboarding error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
