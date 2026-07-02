import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { notFound, redirect } from "next/navigation"
import { ProfileModule } from "@/components/profile/profile-module"

interface ProfilePageProps {
  params: Promise<{ userId: string }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    redirect("/login")
  }

  const { userId } = await params

  const userResult = await sql`
    SELECT 
      u.id, 
      u.name, 
      u.email, 
      u.avatar_url, 
      u.total_points, 
      u.is_verified, 
      u.created_at,
      up.bio
    FROM users u
    LEFT JOIN user_profiles up ON up.user_id = u.id
    WHERE u.id = ${userId}
  `

  if (userResult.length === 0) {
    notFound()
  }

  const profileUser = userResult[0]
  const isOwnProfile = currentUser.id === userId

  return (
    <ProfileModule
      userId={userId}
      isOwnProfile={isOwnProfile}
      initialData={{
        id: profileUser.id,
        name: profileUser.name,
        email: isOwnProfile ? profileUser.email : undefined,
        avatar_url: profileUser.avatar_url,
        bio: profileUser.bio,
        total_points: profileUser.total_points || 0,
        is_verified: profileUser.is_verified,
        created_at: profileUser.created_at,
      }}
    />
  )
}
