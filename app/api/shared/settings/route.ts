import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"


export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { share_expenses, share_incomes, share_debts, share_investments, share_goals } = body

    const updates: string[] = []
    const values: (boolean | string)[] = []

    if (share_expenses !== undefined) {
      updates.push("share_expenses")
      values.push(share_expenses)
    }
    if (share_incomes !== undefined) {
      updates.push("share_incomes")
      values.push(share_incomes)
    }
    if (share_debts !== undefined) {
      updates.push("share_debts")
      values.push(share_debts)
    }
    if (share_investments !== undefined) {
      updates.push("share_investments")
      values.push(share_investments)
    }
    if (share_goals !== undefined) {
      updates.push("share_goals")
      values.push(share_goals)
    }

    await sql`
      UPDATE shared_profiles
      SET 
        share_expenses = COALESCE(${share_expenses}, share_expenses),
        share_incomes = COALESCE(${share_incomes}, share_incomes),
        share_debts = COALESCE(${share_debts}, share_debts),
        share_investments = COALESCE(${share_investments}, share_investments),
        share_goals = COALESCE(${share_goals}, share_goals)
      WHERE owner_user_id = ${user.id} OR partner_user_id = ${user.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 })
  }
}
