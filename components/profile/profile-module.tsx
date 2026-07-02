"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import {
  User,
  Settings,
  Trophy,
  Flame,
  Target,
  Calendar,
  Share2,
  Edit3,
  Globe,
  Lock,
  Camera,
  CheckCircle,
  Sparkles,
  Package,
  ShoppingBag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { AnimatedCard } from "@/components/ui/animated-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LevelBadge } from "@/components/gamification/level-badge"
import { LevelProgressCard } from "@/components/gamification/level-progress-card"
import { InventoryTab } from "./inventory-tab"
import { CustomizationSection } from "./customization-section"
import { getLevelByPoints } from "@/lib/levels"
import { toast } from "sonner"

interface ProfileModuleProps {
  userId: string
  isOwnProfile: boolean
  initialData?: any
}

interface ProfileData {
  id: string
  name: string | null
  email: string
  avatar_url: string | null
  bio: string | null
  total_points: number
  is_public: boolean
  show_level: boolean
  show_badges: boolean
  show_streaks: boolean
  show_challenges: boolean
  allow_comments: boolean
  is_verified: boolean
  active_border_id: string | null
  active_border_url: string | null
  achievements: Array<{
    id: string
    name: string
    description: string
    icon: string
    earned_at: string
  }>
  streaks: Array<{
    streak_type: string
    current_streak: number
    longest_streak: number
  }>
  challenges_completed: number
  member_since: string
}

export function ProfileModule({ userId, isOwnProfile }: ProfileModuleProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedBio, setEditedBio] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchProfile()
  }, [userId, refreshKey])

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/profile/${userId}`)
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
        setEditedBio(data.bio || "")
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!profile) return
    setIsSaving(true)
    try {
      const res = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio: editedBio }),
      })
      if (res.ok) {
        setProfile({ ...profile, bio: editedBio })
        setIsEditing(false)
        toast.success("Perfil atualizado!")
      }
    } catch (error) {
      toast.error("Erro ao salvar perfil")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append("avatar", file)

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        setProfile((prev) => (prev ? { ...prev, avatar_url: data.avatar_url } : null))
        toast.success("Foto atualizada!")
      } else {
        const error = await res.json()
        toast.error(error.error || "Erro ao atualizar foto")
      }
    } catch (error) {
      toast.error("Erro ao atualizar foto")
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleTogglePrivacy = async (field: string, value: boolean) => {
    if (!profile) return
    try {
      const res = await fetch("/api/profile/privacy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      })
      if (res.ok) {
        setProfile({ ...profile, [field]: value })
        toast.success("Configuracao atualizada!")
      }
    } catch (error) {
      toast.error("Erro ao atualizar configuracao")
    }
  }

  const handleItemActivated = () => {
    setRefreshKey((prev) => prev + 1)
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Perfil nao encontrado</p>
      </div>
    )
  }

  const level = getLevelByPoints(profile.total_points)
  const mainStreak = profile.streaks?.find((s) => s.streak_type === "daily_register")

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleAvatarChange}
        className="hidden"
      />

      {/* Header Card */}
      <AnimatedCard>
        <div
          className="h-32 rounded-t-xl"
          style={{
            background: `linear-gradient(135deg, ${level.gradient_from}, ${level.gradient_to})`,
          }}
        />
        <div className="relative px-4 sm:px-6 pb-6">
          {/* Avatar with active border */}
          <div className="absolute -top-12 left-4 sm:left-6">
            <div className="relative group">
              <div
                className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-full p-1"
                style={{
                  background:
                    profile.active_border_url ||
                    `linear-gradient(135deg, ${level.gradient_from}, ${level.gradient_to})`,
                  backgroundSize: "200% 200%",
                  animation: profile.active_border_id ? "gradient-shift 3s ease infinite" : undefined,
                }}
              >
                <div className="h-full w-full rounded-full border-4 border-card bg-muted flex items-center justify-center overflow-hidden">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url || "/placeholder.svg"}
                      alt={profile.name || ""}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
                  )}
                </div>
              </div>

              {isOwnProfile && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute bottom-1 right-1 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors z-10"
                >
                  {isUploadingAvatar ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-4 gap-2 flex-wrap">
            {isOwnProfile ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)} className="bg-transparent">
                  <Edit3 className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Editar</span>
                </Button>
                <Button variant="outline" size="sm" asChild className="bg-transparent">
                  <a href="/settings">
                    <Settings className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Config</span>
                  </a>
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" className="bg-transparent">
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
            )}
          </div>

          {/* Profile Info */}
          <div className="mt-14 sm:mt-16 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold">{profile.name || "Usuario"}</h1>
              <LevelBadge level={level.slug} size="sm" animated />
              {profile.is_verified && (
                <div className="flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5">
                  <CheckCircle className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-medium text-primary">Verificado</span>
                </div>
              )}
              {profile.is_public ? (
                <Globe className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Lock className="h-4 w-4 text-muted-foreground" />
              )}
            </div>

            {isEditing ? (
              <div className="space-y-3">
                <Textarea
                  placeholder="Escreva uma bio..."
                  value={editedBio}
                  onChange={(e) => setEditedBio(e.target.value)}
                  rows={3}
                  maxLength={200}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveProfile} disabled={isSaving}>
                    Salvar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} className="bg-transparent">
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">
                {profile.bio || (isOwnProfile ? "Adicione uma bio para contar sua historia..." : "")}
              </p>
            )}

            {/* Stats Row */}
            <div className="flex flex-wrap gap-3 sm:gap-6 pt-2">
              <div className="flex items-center gap-1.5 sm:gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">{profile.total_points.toLocaleString()} pts</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-sm text-muted-foreground">
                <Trophy className="h-4 w-4 text-warning" />
                <span>{profile.achievements?.length || 0} conquistas</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-sm text-muted-foreground">
                <Flame className="h-4 w-4 text-orange-500" />
                <span>{mainStreak?.current_streak || 0} dias</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-sm text-muted-foreground">
                <Target className="h-4 w-4 text-primary" />
                <span>{profile.challenges_completed || 0} desafios</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Desde{" "}
                  {new Date(profile.member_since).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </AnimatedCard>

      {/* Tabs - Added Inventario and Personalizar tabs */}
      <Tabs defaultValue="conquistas">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="conquistas">Conquistas</TabsTrigger>
          <TabsTrigger value="nivel">Nivel</TabsTrigger>
          {isOwnProfile && (
            <TabsTrigger value="inventario" className="flex items-center gap-1">
              <Package className="h-3.5 w-3.5" />
              Inventario
            </TabsTrigger>
          )}
          {isOwnProfile && (
            <TabsTrigger value="personalizar" className="flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" />
              Personalizar
            </TabsTrigger>
          )}
          {isOwnProfile && (
            <TabsTrigger value="loja" className="flex items-center gap-1">
              <ShoppingBag className="h-3.5 w-3.5" />
              Loja
            </TabsTrigger>
          )}
          {isOwnProfile && <TabsTrigger value="privacidade">Privacidade</TabsTrigger>}
        </TabsList>

        <TabsContent value="conquistas" className="space-y-4 mt-4">
          <AnimatedCard>
            <div className="p-4 sm:p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-warning" />
                Conquistas ({profile.achievements?.length || 0})
              </h3>
              {profile.achievements && profile.achievements.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                  {profile.achievements.map((achievement, i) => (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="text-center p-3 sm:p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-warning to-orange-500 flex items-center justify-center text-white">
                        <Trophy className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <p className="font-medium text-xs sm:text-sm">{achievement.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{achievement.description}</p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  {isOwnProfile ? "Complete desafios para ganhar conquistas!" : "Nenhuma conquista ainda"}
                </p>
              )}
            </div>
          </AnimatedCard>

          {profile.show_streaks && (
            <AnimatedCard delay={0.1}>
              <div className="p-4 sm:p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  Sequencias
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {profile.streaks?.map((streak) => (
                    <div key={streak.streak_type} className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground mb-1">
                        {streak.streak_type === "daily_register" ? "Dias registrando" : streak.streak_type}
                      </p>
                      <div className="flex items-end gap-2">
                        <span className="text-2xl sm:text-3xl font-bold">{streak.current_streak}</span>
                        <span className="text-xs sm:text-sm text-muted-foreground pb-1">
                          / recorde: {streak.longest_streak}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedCard>
          )}
        </TabsContent>

        <TabsContent value="nivel" className="mt-4 space-y-4">
          <LevelProgressCard totalPoints={profile.total_points} />
          <AnimatedCard delay={0.1}>
            <div className="p-4 sm:p-6">
              <h3 className="font-semibold mb-4">Beneficios do Nivel {level.name}</h3>
              <ul className="space-y-2">
                {level.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </AnimatedCard>
        </TabsContent>

        {isOwnProfile && (
          <TabsContent value="inventario" className="mt-4">
            <InventoryTab onItemActivated={handleItemActivated} />
          </TabsContent>
        )}

        {isOwnProfile && (
          <TabsContent value="personalizar" className="mt-4">
            <CustomizationSection userId={userId} avatarUrl={profile.avatar_url} userName={profile.name} />
          </TabsContent>
        )}

        {isOwnProfile && (
          <TabsContent value="loja" className="mt-4">
            <ShopTab userId={userId} onPurchase={handleItemActivated} />
          </TabsContent>
        )}

        {isOwnProfile && (
          <TabsContent value="privacidade" className="mt-4">
            <AnimatedCard>
              <div className="p-4 sm:p-6 space-y-6">
                <h3 className="font-semibold">Configuracoes de Privacidade</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-medium">Perfil Publico</p>
                      <p className="text-sm text-muted-foreground">Outros usuarios podem ver seu perfil</p>
                    </div>
                    <Switch checked={profile.is_public} onCheckedChange={(v) => handleTogglePrivacy("is_public", v)} />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-medium">Mostrar Nivel</p>
                      <p className="text-sm text-muted-foreground">Exibir seu nivel no perfil publico</p>
                    </div>
                    <Switch
                      checked={profile.show_level}
                      onCheckedChange={(v) => handleTogglePrivacy("show_level", v)}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-medium">Mostrar Conquistas</p>
                      <p className="text-sm text-muted-foreground">Exibir suas conquistas no perfil publico</p>
                    </div>
                    <Switch
                      checked={profile.show_badges}
                      onCheckedChange={(v) => handleTogglePrivacy("show_badges", v)}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-medium">Mostrar Sequencias</p>
                      <p className="text-sm text-muted-foreground">Exibir suas sequencias no perfil publico</p>
                    </div>
                    <Switch
                      checked={profile.show_streaks}
                      onCheckedChange={(v) => handleTogglePrivacy("show_streaks", v)}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-medium">Permitir Comentarios</p>
                      <p className="text-sm text-muted-foreground">Outros podem comentar suas conquistas</p>
                    </div>
                    <Switch
                      checked={profile.allow_comments}
                      onCheckedChange={(v) => handleTogglePrivacy("allow_comments", v)}
                    />
                  </div>
                </div>
              </div>
            </AnimatedCard>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

function ShopTab({ userId, onPurchase }: { userId: string; onPurchase?: () => void }) {
  const [items, setItems] = useState<any[]>([])
  const [userPoints, setUserPoints] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)

  useEffect(() => {
    fetchShop()
  }, [])

  const fetchShop = async () => {
    try {
      const res = await fetch("/api/shop")
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
        setUserPoints(data.userPoints || 0)
      }
    } catch (error) {
      console.error("Error fetching shop:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePurchase = async (itemId: string) => {
    setPurchasing(itemId)
    try {
      const res = await fetch("/api/shop/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      })

      if (res.ok) {
        const data = await res.json()
        toast.success("Item adquirido com sucesso!", {
          icon: <Sparkles className="h-4 w-4 text-yellow-500" />,
        })
        setUserPoints(data.newBalance)
        await fetchShop()
        onPurchase?.()
      } else {
        const error = await res.json()
        toast.error(error.error || "Erro ao comprar item")
      }
    } catch (error) {
      toast.error("Erro ao comprar item")
    } finally {
      setPurchasing(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const rarityColors: Record<string, string> = {
    common: "border-gray-500/30",
    rare: "border-blue-500/30",
    epic: "border-purple-500/30",
    legendary: "border-amber-500/30",
  }

  const groupedItems = items.reduce(
    (acc, item) => {
      if (!acc[item.item_type]) acc[item.item_type] = []
      acc[item.item_type].push(item)
      return acc
    },
    {} as Record<string, any[]>,
  )

  const categoryLabels: Record<string, string> = {
    border: "Bordas",
    theme: "Temas",
    badge: "Badges",
    animation: "Animacoes",
  }

  return (
    <div className="space-y-6">
      {/* Points Balance */}
      <AnimatedCard>
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Seus pontos</p>
              <p className="text-xl font-bold">{userPoints.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </AnimatedCard>

      {/* Items by Category */}
      {(Object.entries(groupedItems) as Array<[string, any[]]>).map(([type, typeItems]) => (
        <AnimatedCard key={type}>
          <div className="p-4 sm:p-6">
            <h3 className="font-semibold mb-4">{categoryLabels[type] || type}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {typeItems.map((item: any) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border ${rarityColors[item.rarity]} ${item.owned ? "opacity-60" : ""}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{item.name}</h4>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted capitalize">{item.rarity}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-yellow-500">{item.price} pts</span>
                    {item.owned ? (
                      <span className="text-xs text-green-500 font-medium">Adquirido</span>
                    ) : (
                      <Button
                        size="sm"
                        disabled={userPoints < item.price || purchasing === item.id}
                        onClick={() => handlePurchase(item.id)}
                      >
                        {purchasing === item.id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          "Comprar"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AnimatedCard>
      ))}
    </div>
  )
}
