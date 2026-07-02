import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { getLevelByPoints } from "@/lib/levels"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { itemId } = await request.json()

    if (!itemId) {
      return NextResponse.json({ error: "Item ID required" }, { status: 400 })
    }

    try {
      const tableCheck = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'shop_items'
        ) as exists
      `

      if (!tableCheck[0]?.exists) {
        return NextResponse.json(
          {
            error: "Loja não configurada. Execute o script 009-complete-fixes.sql",
          },
          { status: 503 },
        )
      }
    } catch {
      return NextResponse.json(
        {
          error: "Loja não configurada. Execute o script 009-complete-fixes.sql",
        },
        { status: 503 },
      )
    }

    // Get item details
    const items = await sql`SELECT * FROM shop_items WHERE id = ${itemId} AND is_active = true`
    if (items.length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    const item = items[0]

    // Get user data
    const userData = await sql`SELECT total_points FROM users WHERE id = ${user.id}`
    const userPoints = userData[0]?.total_points || 0

    // Check if already owned
    const owned = await sql`SELECT id FROM user_purchases WHERE user_id = ${user.id} AND item_id = ${itemId}`
    if (owned.length > 0) {
      return NextResponse.json({ error: "Você já possui este item" }, { status: 400 })
    }

    // Check level requirement
    if (item.min_level) {
      const userLevel = getLevelByPoints(userPoints)
      const levelOrder = ["bronze", "prata", "ouro", "diamante"]
      const userLevelIndex = levelOrder.indexOf(userLevel.slug)
      const requiredLevelIndex = levelOrder.indexOf(item.min_level)

      if (userLevelIndex < requiredLevelIndex) {
        return NextResponse.json(
          { error: `Você precisa ser nível ${item.min_level} para comprar este item` },
          { status: 400 },
        )
      }
    }

    // Check if user has enough points
    if (userPoints < item.price) {
      return NextResponse.json({ error: "Pontos insuficientes" }, { status: 400 })
    }

    // Process purchase
    await sql`UPDATE users SET total_points = total_points - ${item.price} WHERE id = ${user.id}`
    await sql`INSERT INTO user_purchases (user_id, item_id) VALUES (${user.id}, ${itemId})`

    // Log transaction (check if table exists first)
    try {
      await sql`
        INSERT INTO points_transactions (user_id, amount, transaction_type, source, source_id, description)
        VALUES (${user.id}, ${-item.price}, 'spent', 'shop_purchase', ${itemId}, ${`Comprou: ${item.name}`})
      `
    } catch {
      // Table might not exist, continue anyway
    }

    return NextResponse.json({ success: true, newBalance: userPoints - item.price })
  } catch (error) {
    console.error("Error purchasing item:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
