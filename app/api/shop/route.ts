import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"

const defaultItems = [
  {
    id: "default-1",
    name: "Borda Dourada",
    description: "Uma borda elegante dourada para seu perfil",
    item_type: "border",
    price: 500,
    rarity: "rare",
    preview_url: "linear-gradient(135deg, #f5af19, #f12711)",
    min_level: null,
    is_active: true,
    owned: false,
  },
  {
    id: "default-2",
    name: "Borda Neon",
    description: "Borda com efeito neon vibrante",
    item_type: "border",
    price: 750,
    rarity: "epic",
    preview_url: "linear-gradient(135deg, #00f260, #0575e6)",
    min_level: "prata",
    is_active: true,
    owned: false,
  },
  {
    id: "default-3",
    name: "Tema Aurora",
    description: "Tema inspirado na aurora boreal",
    item_type: "theme",
    price: 1000,
    rarity: "legendary",
    preview_url: "linear-gradient(135deg, #11998e, #38ef7d)",
    min_level: "ouro",
    is_active: true,
    owned: false,
  },
  {
    id: "default-4",
    name: "Badge Verificado",
    description: "Mostre que você é um membro verificado",
    item_type: "badge",
    price: 300,
    rarity: "common",
    preview_url: "✓",
    min_level: null,
    is_active: true,
    owned: false,
  },
]

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
        // Return default items if table doesn't exist
        const userData = await sql`SELECT total_points FROM users WHERE id = ${user.id}`
        return NextResponse.json({
          items: defaultItems,
          userPoints: userData[0]?.total_points || 0,
          isDemo: true,
          message: "Execute o script 009-complete-fixes.sql para ativar a loja completa",
        })
      }
    } catch {
      // If check fails, return default items
      return NextResponse.json({
        items: defaultItems,
        userPoints: 0,
        isDemo: true,
        message: "Execute o script 009-complete-fixes.sql para ativar a loja completa",
      })
    }

    // Get all active shop items
    const items = await sql`
      SELECT 
        si.*,
        CASE WHEN up.id IS NOT NULL THEN true ELSE false END as owned
      FROM shop_items si
      LEFT JOIN user_purchases up ON si.id = up.item_id AND up.user_id = ${user.id}
      WHERE si.is_active = true
      ORDER BY si.item_type, si.price
    `

    // Get user's current points
    const userData = await sql`SELECT total_points FROM users WHERE id = ${user.id}`

    return NextResponse.json({
      items: items.length > 0 ? items : defaultItems,
      userPoints: userData[0]?.total_points || 0,
    })
  } catch (error) {
    console.error("Error fetching shop:", error)
    return NextResponse.json(
      {
        items: defaultItems,
        userPoints: 0,
        isDemo: true,
        error: "Erro ao carregar loja",
      },
      { status: 200 },
    )
  }
}
