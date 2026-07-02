import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"


export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership before deleting
    const [bet] = await sql`
      SELECT id FROM gambling_bets 
      WHERE id = ${id}::uuid AND user_id = ${user.id}
    `

    if (!bet) {
      return NextResponse.json({ error: "Aposta não encontrada" }, { status: 404 })
    }

    await sql`
      DELETE FROM gambling_bets 
      WHERE id = ${id}::uuid AND user_id = ${user.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting bet:", error)
    return NextResponse.json({ error: "Erro ao excluir aposta" }, { status: 500 })
  }
}
