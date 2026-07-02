import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"
import { cookies } from "next/headers"

export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete all user data in order (due to foreign keys)
    await sql`DELETE FROM debt_payments WHERE debt_id IN (SELECT id FROM debts WHERE user_id = ${user.id})`
    await sql`DELETE FROM debts WHERE user_id = ${user.id}`
    await sql`DELETE FROM incomes WHERE user_id = ${user.id}`
    await sql`DELETE FROM expenses WHERE user_id = ${user.id}`
    await sql`DELETE FROM investments WHERE user_id = ${user.id}`
    await sql`DELETE FROM financial_goals WHERE user_id = ${user.id}`
    await sql`DELETE FROM users WHERE id = ${user.id}`

    // Clear auth cookie
    const cookieStore = await cookies()
    cookieStore.delete("auth_token")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting account:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
