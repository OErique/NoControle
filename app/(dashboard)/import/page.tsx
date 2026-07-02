import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { ImportModule } from "@/components/import/import-module"

export default async function ImportPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (!user.onboarding_completed) {
    redirect("/onboarding")
  }

  const modulesAllowed = user.modules_allowed || 1
  const hasAccess = modulesAllowed >= 2

  return (
    <ImportModule
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        plan_name: user.plan_name,
        modules_allowed: modulesAllowed,
      }}
      hasAccess={hasAccess}
    />
  )
}
