"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Package, Crown, Palette, Award, Zap, Check, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AnimatedCard } from "@/components/ui/animated-card"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface InventoryItem {
  purchase_id: string
  item_id: string
  is_active: boolean
  purchased_at: string
  name: string
  description: string
  item_type: string
  price: number
  image_url: string | null
  rarity: string
}

interface InventoryData {
  inventory: {
    border: InventoryItem[]
    theme: InventoryItem[]
    badge: InventoryItem[]
    animation: InventoryItem[]
  }
  activeItems: {
    active_border_id: string | null
    active_theme_id: string | null
    active_badge_id: string | null
    active_animation_id: string | null
    profile_title: string | null
  }
  totalItems: number
}

interface InventoryTabProps {
  onItemActivated?: () => void
}

const categoryIcons: Record<string, any> = {
  border: Crown,
  theme: Palette,
  badge: Award,
  animation: Zap,
}

const categoryLabels: Record<string, string> = {
  border: "Bordas",
  theme: "Temas",
  badge: "Badges",
  animation: "Animacoes",
}

const rarityColors: Record<string, string> = {
  common: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  rare: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  epic: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  legendary: "bg-amber-500/20 text-amber-400 border-amber-500/30",
}

const rarityGlow: Record<string, string> = {
  common: "",
  rare: "shadow-blue-500/20",
  epic: "shadow-purple-500/30",
  legendary: "shadow-amber-500/40 shadow-lg",
}

export function InventoryTab({ onItemActivated }: InventoryTabProps) {
  const [data, setData] = useState<InventoryData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activatingItem, setActivatingItem] = useState<string | null>(null)
  const [previewItem, setPreviewItem] = useState<InventoryItem | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("border")

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      const res = await fetch("/api/inventory")
      if (res.ok) {
        const result = await res.json()
        setData(result)
      }
    } catch (error) {
      console.error("Error fetching inventory:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleActivate = async (item: InventoryItem, activate: boolean) => {
    setActivatingItem(item.item_id)
    try {
      const res = await fetch("/api/inventory/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.item_id, activate }),
      })

      if (res.ok) {
        const result = await res.json()
        toast.success(result.message, {
          icon: activate ? <Check className="h-4 w-4 text-green-500" /> : undefined,
        })
        await fetchInventory()
        onItemActivated?.()
      } else {
        const error = await res.json()
        toast.error(error.error || "Erro ao atualizar item")
      }
    } catch (error) {
      toast.error("Erro ao atualizar item")
    } finally {
      setActivatingItem(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!data || data.totalItems === 0) {
    return (
      <AnimatedCard>
        <div className="p-8 text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2">Seu inventario esta vazio</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Visite a loja para adquirir itens exclusivos com seus pontos!
          </p>
        </div>
      </AnimatedCard>
    )
  }

  const categories = Object.keys(data.inventory).filter(
    (cat) => data.inventory[cat as keyof typeof data.inventory].length > 0,
  )

  return (
    <div className="space-y-4">
      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {Object.entries(categoryLabels).map(([key, label]) => {
          const Icon = categoryIcons[key]
          const count = data.inventory[key as keyof typeof data.inventory]?.length || 0
          const hasActive = data.inventory[key as keyof typeof data.inventory]?.some((item) => item.is_active)

          return (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                selectedCategory === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
              {count > 0 && (
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-full text-xs",
                    selectedCategory === key ? "bg-primary-foreground/20" : "bg-background",
                  )}
                >
                  {count}
                </span>
              )}
              {hasActive && <div className="h-2 w-2 rounded-full bg-green-500" />}
            </button>
          )
        })}
      </div>

      {/* Items Grid */}
      <AnimatedCard>
        <div className="p-4 sm:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCategory}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {data.inventory[selectedCategory as keyof typeof data.inventory]?.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Voce ainda nao possui {categoryLabels[selectedCategory].toLowerCase()}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.inventory[selectedCategory as keyof typeof data.inventory]?.map((item) => (
                    <InventoryItemCard
                      key={item.item_id}
                      item={item}
                      isActivating={activatingItem === item.item_id}
                      onActivate={(activate) => handleActivate(item, activate)}
                      onPreview={() => setPreviewItem(item)}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </AnimatedCard>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewItem && (
          <PreviewModal
            item={previewItem}
            onClose={() => setPreviewItem(null)}
            onActivate={(activate) => {
              handleActivate(previewItem, activate)
              setPreviewItem(null)
            }}
            isActivating={activatingItem === previewItem.item_id}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function InventoryItemCard({
  item,
  isActivating,
  onActivate,
  onPreview,
}: {
  item: InventoryItem
  isActivating: boolean
  onActivate: (activate: boolean) => void
  onPreview: () => void
}) {
  return (
    <motion.div
      layout
      className={cn(
        "relative p-4 rounded-xl border transition-all",
        item.is_active
          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
          : "border-border bg-card hover:border-primary/50",
        rarityGlow[item.rarity],
      )}
    >
      {/* Active Badge */}
      {item.is_active && (
        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
          <Check className="h-3 w-3" />
          Ativo
        </div>
      )}

      {/* Item Preview */}
      <div className="mb-3">
        <ItemPreview item={item} size="md" />
      </div>

      {/* Item Info */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-sm leading-tight">{item.name}</h4>
          <span className={cn("px-2 py-0.5 rounded-full text-xs border capitalize", rarityColors[item.rarity])}>
            {item.rarity}
          </span>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button size="sm" variant="outline" className="flex-1 h-8 text-xs bg-transparent" onClick={onPreview}>
            <Eye className="h-3 w-3 mr-1" />
            Preview
          </Button>
          <Button
            size="sm"
            variant={item.is_active ? "outline" : "default"}
            className={cn("flex-1 h-8 text-xs", item.is_active && "bg-transparent")}
            onClick={() => onActivate(!item.is_active)}
            disabled={isActivating}
          >
            {isActivating ? (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : item.is_active ? (
              "Desativar"
            ) : (
              <>
                <Check className="h-3 w-3 mr-1" />
                Ativar
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

function ItemPreview({
  item,
  size = "md",
}: {
  item: InventoryItem
  size?: "sm" | "md" | "lg"
}) {
  const sizeClasses = {
    sm: "h-12 w-12",
    md: "h-16 w-16",
    lg: "h-24 w-24",
  }

  if (item.item_type === "border") {
    return (
      <div className="flex justify-center">
        <div
          className={cn("rounded-full p-1 animate-border-glow", sizeClasses[size])}
          style={{
            background: item.image_url || "linear-gradient(135deg, #8b5cf6, #06b6d4)",
            backgroundSize: "200% 200%",
            animation: "gradient-shift 3s ease infinite",
          }}
        >
          <div className="h-full w-full rounded-full bg-card flex items-center justify-center">
            <Crown className="h-1/2 w-1/2 text-muted-foreground" />
          </div>
        </div>
      </div>
    )
  }

  if (item.item_type === "theme") {
    const colors = item.image_url?.split(",") || ["#8b5cf6", "#06b6d4", "#10b981"]
    return (
      <div className="flex justify-center gap-2">
        {colors.map((color, i) => (
          <div
            key={i}
            className={cn("rounded-lg", size === "lg" ? "h-8 w-8" : "h-6 w-6")}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    )
  }

  if (item.item_type === "badge") {
    return (
      <div className="flex justify-center">
        <div
          className={cn(
            "rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center",
            sizeClasses[size],
          )}
        >
          <Award className="h-1/2 w-1/2 text-white" />
        </div>
      </div>
    )
  }

  if (item.item_type === "animation") {
    return (
      <div className="flex justify-center">
        <div className={cn("rounded-full bg-muted flex items-center justify-center animate-pulse", sizeClasses[size])}>
          <Zap className="h-1/2 w-1/2 text-yellow-500" />
        </div>
      </div>
    )
  }

  return null
}

function PreviewModal({
  item,
  onClose,
  onActivate,
  isActivating,
}: {
  item: InventoryItem
  onClose: () => void
  onActivate: (activate: boolean) => void
  isActivating: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-card rounded-2xl p-6 max-w-sm w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center space-y-4">
          {/* Large Preview */}
          <div className="py-4">
            <ItemPreview item={item} size="lg" />
          </div>

          {/* Info */}
          <div>
            <h3 className="text-xl font-bold">{item.name}</h3>
            <span
              className={cn(
                "inline-block mt-1 px-2 py-0.5 rounded-full text-xs border capitalize",
                rarityColors[item.rarity],
              )}
            >
              {item.rarity}
            </span>
          </div>

          <p className="text-muted-foreground text-sm">{item.description}</p>

          {/* Status */}
          {item.is_active && (
            <div className="flex items-center justify-center gap-2 text-primary">
              <Check className="h-4 w-4" />
              <span className="text-sm font-medium">Item ativo no seu perfil</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1 bg-transparent" onClick={onClose}>
              Fechar
            </Button>
            <Button
              variant={item.is_active ? "outline" : "default"}
              className={cn("flex-1", item.is_active && "bg-transparent")}
              onClick={() => onActivate(!item.is_active)}
              disabled={isActivating}
            >
              {isActivating ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : item.is_active ? (
                "Desativar"
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Ativar
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
