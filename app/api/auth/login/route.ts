import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyPassword } from "@/lib/auth-password"
import { createToken, setAuthCookie } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: "E-mail e senha são obrigatórios" }, { status: 400 })
    }

    // Find user by email
    const users = await sql`
      SELECT u.*, p.name as plan_name, p.modules_allowed
      FROM users u
      LEFT JOIN plans p ON u.plan_id = p.id
      WHERE u.email = ${email}
    `

    if (users.length === 0) {
      return NextResponse.json({ error: "E-mail ou senha incorretos" }, { status: 401 })
    }

    const user = users[0]

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash)

    if (!isValidPassword) {
      return NextResponse.json({ error: "E-mail ou senha incorretos" }, { status: 401 })
    }

    // Create and set auth token
    const token = await createToken(user.id)
    await setAuthCookie(token)

    return NextResponse.json({
      message: "Login realizado com sucesso",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        onboarding_completed: user.onboarding_completed,
        plan_name: user.plan_name,
        modules_allowed: user.modules_allowed,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
