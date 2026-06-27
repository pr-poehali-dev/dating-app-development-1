export interface StreakReward {
  days: number;
  badge: string;       // эмодзи-значок
  label: string;       // название
  color: string;       // основной цвет
  ringColor: string;   // градиент рамки аватара
  glow: string;        // тень/свечение
}

export const STREAK_REWARDS: StreakReward[] = [
  {
    days: 3,
    badge: "🔥",
    label: "Активный",
    color: "#f97316",
    ringColor: "linear-gradient(135deg, #f97316, #fb923c)",
    glow: "0 0 12px rgba(249,115,22,0.6)",
  },
  {
    days: 7,
    badge: "⚡",
    label: "Недельный",
    color: "#ef4444",
    ringColor: "linear-gradient(135deg, #ef4444, #f97316)",
    glow: "0 0 14px rgba(239,68,68,0.65)",
  },
  {
    days: 14,
    badge: "💫",
    label: "Двухнедельный",
    color: "#ec4899",
    ringColor: "linear-gradient(135deg, #ec4899, #ef4444)",
    glow: "0 0 16px rgba(236,72,153,0.65)",
  },
  {
    days: 30,
    badge: "🌟",
    label: "Постоянный",
    color: "#a855f7",
    ringColor: "linear-gradient(135deg, #a855f7, #ec4899)",
    glow: "0 0 18px rgba(168,85,247,0.7)",
  },
  {
    days: 60,
    badge: "💜",
    label: "Ветеран",
    color: "#8b5cf6",
    ringColor: "linear-gradient(135deg, #8b5cf6, #a855f7, #ec4899)",
    glow: "0 0 20px rgba(139,92,246,0.75)",
  },
  {
    days: 100,
    badge: "👑",
    label: "Легенда",
    color: "#eab308",
    ringColor: "linear-gradient(135deg, #eab308, #f59e0b, #fbbf24)",
    glow: "0 0 24px rgba(234,179,8,0.8)",
  },
  {
    days: 365,
    badge: "🏆",
    label: "Год с LoveBloom",
    color: "#fbbf24",
    ringColor: "linear-gradient(135deg, #fbbf24, #f59e0b, #eab308, #fbbf24)",
    glow: "0 0 28px rgba(251,191,36,0.9)",
  },
];

/** Возвращает текущую награду по количеству дней стрика */
export function getStreakReward(currentStreak: number): StreakReward | null {
  const earned = [...STREAK_REWARDS].reverse().find(r => currentStreak >= r.days);
  return earned ?? null;
}

/** Возвращает все заработанные награды */
export function getEarnedRewards(currentStreak: number): StreakReward[] {
  return STREAK_REWARDS.filter(r => currentStreak >= r.days);
}
