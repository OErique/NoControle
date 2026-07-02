import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { ChallengesModule } from "@/components/challenges/challenges-module"
import { redirect } from "next/navigation"

type ActiveChallengeRow = {
  id: string
  user_challenge_id?: string
  challenge_id?: string
  name: string
  description: string
  challenge_type?: string
  target_value?: number
  target?: number
  progress?: number
  current_value?: number
  start_date?: Date
  end_date?: Date
  duration_days?: number
  reward_points: number
  icon: string
}

async function getChallengesData(userId: string) {
  // Check if tables exist
  const tableCheck = await sql`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'challenges'
    )
  `

  if (!tableCheck[0]?.exists) {
    return {
      availableChallenges: [],
      activeChallenges: [],
      completedChallenges: [],
      userPoints: 0,
    }
  }

  // Get available challenges
  const availableChallenges = await sql<ActiveChallengeRow>`
    SELECT c.* FROM challenges c
    WHERE c.is_active = true
    AND c.id NOT IN (
      SELECT challenge_id FROM user_challenges 
      WHERE user_id = ${userId} AND status = 'active'
    )
    ORDER BY c.reward_points DESC
  `

  // Get user's active challenges
  const activeChallenges = await sql<ActiveChallengeRow>`
    SELECT uc.*, c.name, c.description, c.challenge_type, c.target_value, c.reward_points, c.icon
    FROM user_challenges uc
    JOIN challenges c ON uc.challenge_id = c.id
    WHERE uc.user_id = ${userId} AND uc.status = 'active'
    ORDER BY uc.end_date ASC
  `

  // Get completed challenges
  const completedChallenges = await sql<ActiveChallengeRow>`
    SELECT uc.*, c.name, c.description, c.reward_points, c.icon
    FROM user_challenges uc
    JOIN challenges c ON uc.challenge_id = c.id
    WHERE uc.user_id = ${userId} AND uc.status = 'completed'
    ORDER BY uc.completed_at DESC
    LIMIT 10
  `

  // Get user total points
  const pointsResult = await sql`
    SELECT COALESCE(SUM(points), 0) as total
    FROM user_points
    WHERE user_id = ${userId}
  `

  return {
    availableChallenges,
    activeChallenges: activeChallenges.map((c) => ({
        ...c,
        progress: Number(c.current_value) || 0,
        target: Number(c.target_value) || 100,
        daysLeft: c.end_date
          ? Math.max(0, Math.ceil((new Date(c.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
          : c.duration_days || 30,
      })),
    completedChallenges,
    userPoints: Number(pointsResult[0]?.total) || 0,
  }
}

export default async function ChallengesPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const data = await getChallengesData(user.id)

  return <ChallengesModule data={data} userId={user.id} />
}
