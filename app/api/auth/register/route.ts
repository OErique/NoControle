import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { hashPassword } from "@/lib/auth-password"
import { createToken, setAuthCookie } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: "E-mail e senha são obrigatórios" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "A senha deve ter pelo menos 8 caracteres" }, { status: 400 })
    }

    // Check if user already exists
    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingUsers.length > 0) {
      return NextResponse.json({ error: "Este e-mail já está cadastrado" }, { status: 400 })
    }

    // Get the free plan (Essencial)
    const plans = await sql`
      SELECT id FROM plans WHERE name = 'Essencial'
    `

    const freePlanId = plans.length > 0 ? plans[0].id : null

    // Hash password and create user
    const hashedPassword = await hashPassword(password)

    const newUsers = await sql`
      INSERT INTO users (email, password_hash, name, plan_id)
      VALUES (${email}, ${hashedPassword}, ${name || null}, ${freePlanId})
      RETURNING id, email, name, onboarding_completed
    `

    const user = newUsers[0]

    // Create and set auth token
    const token = await createToken(user.id)
    await setAuthCookie(token)

    return NextResponse.json({
      message: "Conta criada com sucesso",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        onboarding_completed: user.onboarding_completed,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
