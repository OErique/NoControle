import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"


export async function DELETE(request: Request, { params }: { params: Promise<{ responseId: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { responseId } = await params

    // Check ownership
    const responses = await sql`
      SELECT user_id, tip_id FROM tip_responses WHERE id = ${responseId}
    `

    if (responses.length === 0) {
      return NextResponse.json({ error: "Resposta não encontrada" }, { status: 404 })
    }

    if (responses[0].user_id !== user.id) {
      return NextResponse.json({ error: "Você só pode excluir suas próprias respostas" }, { status: 403 })
    }

    const tipId = responses[0].tip_id

    // Delete response
    await sql`DELETE FROM tip_responses WHERE id = ${responseId}`

    // Update tip responses count
    await sql`
      UPDATE tips SET responses_count = GREATEST(responses_count - 1, 0) WHERE id = ${tipId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting response:", error)
    return NextResponse.json({ error: "Erro ao excluir" }, { status: 500 })
  }
}
