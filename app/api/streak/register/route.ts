import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    // Get today's date in user timezone
    const today = new Date().toISOString().split("T")[0]

    // Check if already registered today
    const existing = await sql`
      SELECT * FROM user_streaks 
      WHERE user_id = ${user.id} AND streak_date = ${today}
    `

    if (existing.length > 0) {
      return NextResponse.json({ error: "Já registrado hoje", currentStreak: user.current_streak || 0 })
    }

    // Get last streak record
    const lastRecord = await sql`
      SELECT streak_date FROM user_streaks 
      WHERE user_id = ${user.id} 
      ORDER BY streak_date DESC LIMIT 1
    `

    // Calculate new streak
    let newStreak = 1
    if (lastRecord.length > 0) {
      const lastDate = new Date(lastRecord[0].streak_date)
      const todayDate = new Date(today)
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays === 1) {
        // Consecutive day
        newStreak = (user.current_streak || 0) + 1
      } else if (diffDays === 0) {
        // Same day (shouldn't happen due to check above)
        newStreak = user.current_streak || 1
      }
      // If diffDays > 1, streak resets to 1
    }

    // Award points for streak milestones
    let pointsAwarded = 5 // Base points for daily check-in
    if (newStreak === 7) pointsAwarded += 50
    if (newStreak === 14) pointsAwarded += 100
    if (newStreak === 30) pointsAwarded += 200

    const longestStreak = Math.max(newStreak, user.longest_streak || 0)

    // Insert streak record with correct columns
    await sql`
      INSERT INTO user_streaks (user_id, streak_date, streak_type, current_streak, longest_streak, last_activity_date) 
      VALUES (${user.id}, ${today}, 'daily', ${newStreak}, ${longestStreak}, ${today})
      ON CONFLICT (user_id, streak_date) DO NOTHING
    `

    // Update user's streak and add points
    await sql`
      UPDATE users SET 
        current_streak = ${newStreak},
        longest_streak = ${longestStreak},
        last_activity_date = ${today},
        total_points = COALESCE(total_points, 0) + ${pointsAwarded}
      WHERE id = ${user.id}
    `

    return NextResponse.json({
      success: true,
      currentStreak: newStreak,
      longestStreak,
      pointsAwarded,
    })
  } catch (error) {
    console.error("Streak register error:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
