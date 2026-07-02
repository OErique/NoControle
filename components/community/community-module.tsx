"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Heart, MessageCircle, Trophy, Flame, Target, TrendingUp, User, MoreVertical, Trash2 } from "lucide-react"
import { AnimatedCard } from "@/components/ui/animated-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { LevelBadge } from "@/components/gamification/level-badge"
import { getLevelByPoints } from "@/lib/levels"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import Link from "next/link"

interface CommunityModuleProps {
  userId: string
  userName?: string
  userAvatar?: string
  userPoints?: number
}

interface FeedItem {
  id: string
  user_id: string
  user_name: string
  user_avatar: string | null
  user_points: number
  feed_type: string
  title: string
  description: string
  metadata: any
  likes_count: number
  comments_count: number
  is_liked: boolean
  created_at: string
}

export function CommunityModule({ userId, userName, userAvatar, userPoints }: CommunityModuleProps) {
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)

  useEffect(() => {
    fetchFeed()
  }, [])

  const fetchFeed = async () => {
    try {
      const res = await fetch("/api/community/feed")
      if (res.ok) {
        const data = await res.json()
        // Update current user's items with fresh data
        const items = (data.items || []).map((item: FeedItem) => {
          if (item.user_id === userId) {
            return {
              ...item,
              user_name: userName || item.user_name,
              user_avatar: userAvatar || item.user_avatar,
              user_points: userPoints || item.user_points,
            }
          }
          return item
        })
        setFeed(items)
      }
    } catch (error) {
      console.error("Error fetching feed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLike = async (feedId: string) => {
    // Find the item to check if it's own post
    const item = feed.find((f) => f.id === feedId)
    if (item && item.user_id === userId) {
      toast.error("Você não pode curtir seu próprio post")
      return
    }

    try {
      const res = await fetch(`/api/community/like/${feedId}`, {
        method: "POST",
      })
      if (res.ok) {
        setFeed((prev) =>
          prev.map((item) =>
            item.id === feedId
              ? {
                  ...item,
                  is_liked: !item.is_liked,
                  likes_count: item.is_liked ? item.likes_count - 1 : item.likes_count + 1,
                }
              : item,
          ),
        )
      } else {
        const data = await res.json()
        toast.error(data.error || "Erro ao curtir")
      }
    } catch (error) {
      console.error("Error liking:", error)
    }
  }

  const handleDelete = async () => {
    if (!itemToDelete) return

    try {
      const res = await fetch(`/api/community/delete/${itemToDelete}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setFeed((prev) => prev.filter((item) => item.id !== itemToDelete))
        toast.success("Publicação excluída")
      } else {
        const data = await res.json()
        toast.error(data.error || "Erro ao excluir")
      }
    } catch (error) {
      toast.error("Erro ao excluir publicação")
    } finally {
      setDeleteDialogOpen(false)
      setItemToDelete(null)
    }
  }

  const getFeedIcon = (type: string) => {
    switch (type) {
      case "achievement":
        return <Trophy className="h-5 w-5 text-warning" />
      case "level_up":
        return <TrendingUp className="h-5 w-5 text-primary" />
      case "challenge_complete":
        return <Target className="h-5 w-5 text-green-500" />
      case "streak":
        return <Flame className="h-5 w-5 text-orange-500" />
      default:
        return <Trophy className="h-5 w-5" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Comunidade</h1>
        <p className="text-muted-foreground">Veja as conquistas da comunidade</p>
      </div>

      <Tabs defaultValue="feed">
        <TabsList>
          <TabsTrigger value="feed">Feed</TabsTrigger>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="space-y-4 mt-4">
          {feed.length === 0 ? (
            <AnimatedCard>
              <div className="p-8 text-center">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">Nenhuma conquista ainda</h3>
                <p className="text-sm text-muted-foreground">Complete desafios para compartilhar suas conquistas!</p>
              </div>
            </AnimatedCard>
          ) : (
            feed.map((item, i) => {
              const level = getLevelByPoints(item.user_points || 0)
              const isOwner = item.user_id === userId

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <AnimatedCard>
                    <div className="p-4">
                      {/* Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <Link href={`/profile/${item.user_id}`}>
                          <div className="relative">
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                              {item.user_avatar ? (
                                <img
                                  src={item.user_avatar || "/placeholder.svg"}
                                  alt={item.user_name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <User className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="absolute -bottom-1 -right-1">
                              <LevelBadge level={level.slug} size="sm" />
                            </div>
                          </div>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Link href={`/profile/${item.user_id}`} className="font-medium hover:underline">
                              {item.user_name || "Usuário"}
                            </Link>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(item.created_at), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {getFeedIcon(item.feed_type)}
                            <span className="text-sm font-medium">{item.title}</span>
                          </div>
                        </div>

                        {isOwner && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-danger focus:text-danger"
                                onClick={() => {
                                  setItemToDelete(item.id)
                                  setDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>

                      {/* Content */}
                      {item.description && (
                        <p className="text-sm text-muted-foreground mb-3 pl-13">{item.description}</p>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-4 pl-13">
                        <button
                          onClick={() => handleLike(item.id)}
                          disabled={isOwner}
                          className={`flex items-center gap-1.5 text-sm transition-colors ${
                            isOwner
                              ? "text-muted-foreground/50 cursor-not-allowed"
                              : item.is_liked
                                ? "text-pink-500"
                                : "text-muted-foreground hover:text-pink-500"
                          }`}
                        >
                          <Heart className={`h-4 w-4 ${item.is_liked ? "fill-current" : ""}`} />
                          <span>{item.likes_count}</span>
                        </button>
                        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                          <MessageCircle className="h-4 w-4" />
                          <span>{item.comments_count}</span>
                        </button>
                      </div>
                    </div>
                  </AnimatedCard>
                </motion.div>
              )
            })
          )}
        </TabsContent>

        <TabsContent value="ranking" className="mt-4">
          <RankingList currentUserId={userId} />
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir publicação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A publicação será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-danger hover:bg-danger/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function RankingList({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchRanking()
  }, [])

  const fetchRanking = async () => {
    try {
      const res = await fetch("/api/community/ranking")
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error("Error fetching ranking:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <AnimatedCard>
      <div className="p-4">
        <h3 className="font-semibold mb-4">Top Usuários</h3>
        <div className="space-y-3">
          {users.map((user, i) => {
            const level = getLevelByPoints(user.total_points || 0)
            const isCurrentUser = user.id === currentUserId
            return (
              <Link
                key={user.id}
                href={`/profile/${user.id}`}
                className={`flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors ${
                  isCurrentUser ? "bg-primary/5 border border-primary/20" : ""
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm ${
                    i === 0
                      ? "bg-yellow-500/20 text-yellow-500"
                      : i === 1
                        ? "bg-slate-400/20 text-slate-400"
                        : i === 2
                          ? "bg-amber-700/20 text-amber-700"
                          : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </div>
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url || "/placeholder.svg"}
                        alt={user.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1">
                    <LevelBadge level={level.slug} size="sm" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {user.name || "Usuário"} {isCurrentUser && <span className="text-primary">(você)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">{level.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{(user.total_points || 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">pontos</p>
                </div>
              </Link>
            )
          })}
          {users.length === 0 && (
            <p className="text-center text-muted-foreground py-4">Nenhum usuário no ranking ainda</p>
          )}
        </div>
      </div>
    </AnimatedCard>
  )
}
