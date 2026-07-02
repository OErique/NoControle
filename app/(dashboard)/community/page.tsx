import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { CommunityModule } from "@/components/community/community-module"

export default async function CommunityPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <CommunityModule
      userId={user.id}
      userName={user.name || "Usuário"}
      userAvatar={user.avatar_url || undefined}
      userPoints={user.total_points || 0}
    />
  )
}
