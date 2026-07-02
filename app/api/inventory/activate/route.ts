import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { itemId, activate } = await request.json()

    if (!itemId) {
      return NextResponse.json({ error: "Item ID required" }, { status: 400 })
    }

    // Verify user owns the item
    const ownership = await sql`
      SELECT up.id, si.item_type, si.name
      FROM user_purchases up
      JOIN shop_items si ON up.item_id = si.id
      WHERE up.user_id = ${user.id} AND up.item_id = ${itemId}
    `

    if (ownership.length === 0) {
      return NextResponse.json({ error: "Voce nao possui este item" }, { status: 400 })
    }

    const item = ownership[0]

    if (activate) {
      // Deactivate all items of the same type first
      await sql`
        UPDATE user_purchases 
        SET is_active = false 
        WHERE user_id = ${user.id} 
          AND item_id IN (SELECT id FROM shop_items WHERE item_type = ${item.item_type})
      `

      // Activate the selected item
      await sql`
        UPDATE user_purchases 
        SET is_active = true 
        WHERE user_id = ${user.id} AND item_id = ${itemId}
      `

      // Update user's active item reference based on type
      if (item.item_type === "border") {
        await sql`UPDATE users SET active_border_id = ${itemId} WHERE id = ${user.id}`
      } else if (item.item_type === "theme") {
        await sql`UPDATE users SET active_theme_id = ${itemId} WHERE id = ${user.id}`
      } else if (item.item_type === "badge") {
        await sql`UPDATE users SET active_badge_id = ${itemId} WHERE id = ${user.id}`
      } else if (item.item_type === "animation") {
        await sql`UPDATE users SET active_animation_id = ${itemId} WHERE id = ${user.id}`
      }
    } else {
      // Deactivate the item
      await sql`
        UPDATE user_purchases 
        SET is_active = false 
        WHERE user_id = ${user.id} AND item_id = ${itemId}
      `

      // Clear user's active item reference based on type
      if (item.item_type === "border") {
        await sql`UPDATE users SET active_border_id = NULL WHERE id = ${user.id}`
      } else if (item.item_type === "theme") {
        await sql`UPDATE users SET active_theme_id = NULL WHERE id = ${user.id}`
      } else if (item.item_type === "badge") {
        await sql`UPDATE users SET active_badge_id = NULL WHERE id = ${user.id}`
      } else if (item.item_type === "animation") {
        await sql`UPDATE users SET active_animation_id = NULL WHERE id = ${user.id}`
      }
    }

    return NextResponse.json({
      success: true,
      message: activate ? `${item.name} ativado com sucesso!` : `${item.name} desativado`,
      itemType: item.item_type,
      itemName: item.name,
    })
  } catch (error) {
    console.error("Error activating item:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
