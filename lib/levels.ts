// Level system utilities

export interface UserLevel {
  id: string
  name: string
  slug: string
  min_points: number
  max_points: number | null
  icon: string
  color: string
  gradient_from: string
  gradient_to: string
  benefits: string[]
}

export const LEVELS: UserLevel[] = [
  {
    id: "bronze",
    name: "Bronze",
    slug: "bronze",
    min_points: 0,
    max_points: 499,
    icon: "medal",
    color: "#CD7F32",
    gradient_from: "#CD7F32",
    gradient_to: "#8B4513",
    benefits: ["Acesso ao tema Bronze", "Badge de Bronze no perfil"],
  },
  {
    id: "prata",
    name: "Prata",
    slug: "prata",
    min_points: 500,
    max_points: 1499,
    icon: "medal",
    color: "#C0C0C0",
    gradient_from: "#C0C0C0",
    gradient_to: "#808080",
    benefits: ["Temas exclusivos Prata", "Badge de Prata", "Gráficos extras no dashboard"],
  },
  {
    id: "ouro",
    name: "Ouro",
    slug: "ouro",
    min_points: 1500,
    max_points: 3999,
    icon: "crown",
    color: "#FFD700",
    gradient_from: "#FFD700",
    gradient_to: "#FFA500",
    benefits: ["Temas premium Ouro", "Badge dourado animado", "Simulações ilimitadas", "Destaque no perfil"],
  },
  {
    id: "diamante",
    name: "Diamante",
    slug: "diamante",
    min_points: 4000,
    max_points: null,
    icon: "gem",
    color: "#B9F2FF",
    gradient_from: "#E0FFFF",
    gradient_to: "#00CED1",
    benefits: ["Todos os temas exclusivos", "Badge diamante com brilho", "Bordas especiais", "Acesso antecipado"],
  },
]

export function getLevelByPoints(points: number): UserLevel {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].min_points) {
      return LEVELS[i]
    }
  }
  return LEVELS[0]
}

export function getNextLevel(currentLevel: UserLevel): UserLevel | null {
  const index = LEVELS.findIndex((l) => l.slug === currentLevel.slug)
  if (index < LEVELS.length - 1) {
    return LEVELS[index + 1]
  }
  return null
}

export function getLevelProgress(points: number, level: UserLevel): number {
  if (!level.max_points) return 100
  const range = level.max_points - level.min_points
  const progress = points - level.min_points
  return Math.min(100, Math.round((progress / range) * 100))
}

export function getPointsToNextLevel(points: number, level: UserLevel): number {
  if (!level.max_points) return 0
  return level.max_points - points + 1
}
