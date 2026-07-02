import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const existing = await sql`
      SELECT id FROM incomes WHERE id = ${id} AND user_id = ${user.id}
    `

    if (existing.length === 0) {
      return NextResponse.json({ error: "Receita não encontrada" }, { status: 404 })
    }

    await sql`DELETE FROM incomes WHERE id = ${id}`

    return NextResponse.json({ message: "Receita excluída com sucesso" })
  } catch (error) {
    console.error("Delete income error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
