import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"


async function awardAchievement(
  profileId: string,
  achievementType: string,
  name: string,
  description: string,
  icon: string,
  points: number,
) {
  const inserted = await sql`
    INSERT INTO couple_achievements (shared_profile_id, achievement_type, name, description, icon, points)
    VALUES (${profileId}, ${achievementType}, ${name}, ${description}, ${icon}, ${points})
    ON CONFLICT (shared_profile_id, achievement_type) DO NOTHING
    RETURNING id
  `

  if (inserted.length > 0) {
    await sql`
      UPDATE shared_profiles
      SET couple_points = COALESCE(couple_points, 0) + ${points}
      WHERE id = ${profileId}
    `
    return true
  }
  return false
}

export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Get shared profile
    const profiles = await sql`
      SELECT * FROM shared_profiles
      WHERE (owner_user_id = ${user.id} OR partner_user_id = ${user.id})
        AND status = 'accepted'
        AND ended_at IS NULL
      LIMIT 1
    `

    if (profiles.length === 0) {
      return NextResponse.json({ error: "Nenhum perfil compartilhado" }, { status: 404 })
    }

    const profile = profiles[0]
    const newAchievements: string[] = []

    // Check: First goal created
    const goalsCount = await sql`
      SELECT COUNT(*) as count FROM shared_goals WHERE shared_profile_id = ${profile.id}
    `
    if (Number(goalsCount[0].count) >= 1) {
      const awarded = await awardAchievement(
        profile.id,
        "first_goal",
        "Primeiro Sonho",
        "Criaram a primeira meta juntos",
        "target",
        50,
      )
      if (awarded) newAchievements.push("Primeiro Sonho")
    }

    // Check: 5 goals created
    if (Number(goalsCount[0].count) >= 5) {
      const awarded = await awardAchievement(
        profile.id,
        "five_goals",
        "Sonhadores",
        "Criaram 5 metas juntos",
        "stars",
        100,
      )
      if (awarded) newAchievements.push("Sonhadores")
    }

    // Check: First expense shared
    const expensesCount = await sql`
      SELECT COUNT(*) as count FROM couple_expenses WHERE shared_profile_id = ${profile.id}
    `
    if (Number(expensesCount[0].count) >= 1) {
      const awarded = await awardAchievement(
        profile.id,
        "first_expense",
        "Contas Compartilhadas",
        "Registraram a primeira despesa compartilhada",
        "receipt",
        25,
      )
      if (awarded) newAchievements.push("Contas Compartilhadas")
    }

    // Check: 7 day streak
    if (profile.couple_streak >= 7) {
      const awarded = await awardAchievement(
        profile.id,
        "streak_7",
        "Uma Semana Juntos",
        "Mantiveram a sequência por 7 dias",
        "flame",
        75,
      )
      if (awarded) newAchievements.push("Uma Semana Juntos")
    }

    // Check: 30 day streak
    if (profile.couple_streak >= 30) {
      const awarded = await awardAchievement(
        profile.id,
        "streak_30",
        "Um Mês de Sintonia",
        "Mantiveram a sequência por 30 dias",
        "flame",
        200,
      )
      if (awarded) newAchievements.push("Um Mês de Sintonia")
    }

    // Check: Total savings in goals >= 1000
    const totalSaved = await sql`
      SELECT COALESCE(SUM(current_amount), 0) as total 
      FROM shared_goals 
      WHERE shared_profile_id = ${profile.id}
    `
    if (Number(totalSaved[0].total) >= 1000) {
      const awarded = await awardAchievement(
        profile.id,
        "saved_1000",
        "Primeiros Mil",
        "Economizaram R$ 1.000 juntos",
        "piggy-bank",
        100,
      )
      if (awarded) newAchievements.push("Primeiros Mil")
    }

    if (Number(totalSaved[0].total) >= 10000) {
      const awarded = await awardAchievement(
        profile.id,
        "saved_10000",
        "Dez Mil Conquistados",
        "Economizaram R$ 10.000 juntos",
        "trophy",
        300,
      )
      if (awarded) newAchievements.push("Dez Mil Conquistados")
    }

    const updatedProfile = await sql`
      SELECT couple_points FROM shared_profiles WHERE id = ${profile.id}
    `
    const currentPoints = updatedProfile[0]?.couple_points || 0

    let newLevel = 1
    if (currentPoints >= 1000) newLevel = 5
    else if (currentPoints >= 600) newLevel = 4
    else if (currentPoints >= 300) newLevel = 3
    else if (currentPoints >= 100) newLevel = 2

    await sql`
      UPDATE shared_profiles
      SET couple_level = ${newLevel}
      WHERE id = ${profile.id}
    `

    return NextResponse.json({
      success: true,
      newAchievements,
      totalPoints: currentPoints,
      level: newLevel,
    })
  } catch (error) {
    console.error("Error checking achievements:", error)
    return NextResponse.json({ error: "Erro ao verificar conquistas" }, { status: 500 })
  }
}
