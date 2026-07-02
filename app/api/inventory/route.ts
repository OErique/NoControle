import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all user's purchased items with details
    const inventory = await sql`
      SELECT 
        up.id as purchase_id,
        up.item_id,
        up.is_active,
        up.purchased_at,
        si.name,
        si.description,
        si.item_type,
        si.price,
        si.image_url,
        si.rarity
      FROM user_purchases up
      JOIN shop_items si ON up.item_id = si.id
      WHERE up.user_id = ${user.id}
      ORDER BY si.item_type, up.purchased_at DESC
    `

    // Get user's active items
    const userData = await sql`
      SELECT 
        active_border_id,
        active_theme_id,
        active_badge_id,
        active_animation_id,
        profile_title
      FROM users 
      WHERE id = ${user.id}
    `

    // Group items by type
    const grouped: Record<string, any[]> = {
      border: [],
      theme: [],
      badge: [],
      animation: [],
    }

    inventory.forEach((item: any) => {
      if (grouped[item.item_type]) {
        grouped[item.item_type].push(item)
      }
    })

    return NextResponse.json({
      inventory: grouped,
      activeItems: userData[0] || {},
      totalItems: inventory.length,
    })
  } catch (error) {
    console.error("Error fetching inventory:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
