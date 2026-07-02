import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"


export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    await sql`
      DELETE FROM shared_profiles
      WHERE owner_user_id = ${user.id} OR partner_user_id = ${user.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error unlinking profile:", error)
    return NextResponse.json({ error: "Erro ao desvincular" }, { status: 500 })
  }
}
