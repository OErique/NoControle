import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params
    const currentUser = await getCurrentUser()

    // Check if user_profiles table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user_profiles'
      )
    `

    const isOwnProfile = currentUser?.id === userId

    const users = await sql`
      SELECT 
        u.id, u.name, u.email, u.avatar_url, u.total_points, u.created_at,
        u.active_border_id, u.active_theme_id, u.active_badge_id, u.active_animation_id,
        u.is_verified,
        si.image_url as active_border_url
      FROM users u
      LEFT JOIN shop_items si ON u.active_border_id = si.id
      WHERE u.id = ${userId}
    `

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = users[0]

    // Get profile settings if table exists
    let profileSettings = {
      bio: null,
      is_public: true,
      show_level: true,
      show_badges: true,
      show_streaks: true,
      show_challenges: true,
      allow_comments: true,
    }

    if (tableCheck[0]?.exists) {
      const profiles = await sql`
        SELECT * FROM user_profiles WHERE user_id = ${userId}
      `
      if (profiles.length > 0) {
        profileSettings = profiles[0]
      }
    }

    // Check privacy - if not own profile and not public, return limited data
    if (!isOwnProfile && !profileSettings.is_public) {
      return NextResponse.json({
        id: user.id,
        name: user.name,
        is_public: false,
        message: "Este perfil é privado",
      })
    }

    // Get achievements
    let achievements: any[] = []
    try {
      const achievementsResult = await sql`
        SELECT a.*, ua.earned_at
        FROM user_achievements ua
        JOIN achievements a ON a.id = ua.achievement_id
        WHERE ua.user_id = ${userId}
        ORDER BY ua.earned_at DESC
      `
      achievements = achievementsResult
    } catch (e) {
      // Table might not exist
    }

    // Get streaks
    let streaks: any[] = []
    try {
      const streaksResult = await sql`
        SELECT streak_type, current_streak, longest_streak
        FROM user_streaks
        WHERE user_id = ${userId}
      `
      streaks = streaksResult
    } catch (e) {
      // Table might not exist
    }

    // Get challenges completed count
    let challengesCompleted = 0
    try {
      const challengesResult = await sql`
        SELECT COUNT(*) as count
        FROM user_challenges
        WHERE user_id = ${userId} AND status = 'completed'
      `
      challengesCompleted = Number.parseInt(challengesResult[0]?.count || "0")
    } catch (e) {
      // Table might not exist
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: isOwnProfile ? user.email : undefined,
      avatar_url: user.avatar_url,
      bio: profileSettings.bio,
      total_points: user.total_points || 0,
      is_public: profileSettings.is_public,
      show_level: profileSettings.show_level,
      show_badges: profileSettings.show_badges,
      show_streaks: profileSettings.show_streaks,
      show_challenges: profileSettings.show_challenges,
      allow_comments: profileSettings.allow_comments,
      is_verified: user.is_verified || false,
      active_border_id: user.active_border_id,
      active_border_url: user.active_border_url,
      active_theme_id: user.active_theme_id,
      active_badge_id: user.active_badge_id,
      active_animation_id: user.active_animation_id,
      achievements: profileSettings.show_badges || isOwnProfile ? achievements : [],
      streaks: profileSettings.show_streaks || isOwnProfile ? streaks : [],
      challenges_completed: profileSettings.show_challenges || isOwnProfile ? challengesCompleted : 0,
      member_since: user.created_at,
    })
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
