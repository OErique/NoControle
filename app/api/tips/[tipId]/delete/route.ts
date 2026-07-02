import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"


export async function DELETE(request: Request, { params }: { params: Promise<{ tipId: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { tipId } = await params

    // Check ownership
    const tips = await sql`
      SELECT user_id FROM tips WHERE id = ${tipId}
    `

    if (tips.length === 0) {
      return NextResponse.json({ error: "Pergunta não encontrada" }, { status: 404 })
    }

    if (tips[0].user_id !== user.id) {
      return NextResponse.json({ error: "Você só pode excluir suas próprias perguntas" }, { status: 403 })
    }

    // Delete responses first
    await sql`DELETE FROM tip_responses WHERE tip_id = ${tipId}`

    // Delete tip
    await sql`DELETE FROM tips WHERE id = ${tipId}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting tip:", error)
    return NextResponse.json({ error: "Erro ao excluir" }, { status: 500 })
  }
}
