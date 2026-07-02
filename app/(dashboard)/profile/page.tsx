import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { ProfileModule } from "@/components/profile/profile-module"

export default async function ProfilePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return <ProfileModule userId={user.id} isOwnProfile={true} />
}
