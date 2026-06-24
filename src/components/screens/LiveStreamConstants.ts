export const FALLBACK_PHOTO = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/65f53640-73d5-4fab-a51a-5f8fff69172e.jpg";

export const LIVE_TABS = [
  { id: "popular",   label: "Популярное", icon: "Flame" },
  { id: "new",       label: "Новое",      icon: "Sparkles" },
  { id: "nearby",    label: "Рядом",      icon: "MapPin" },
  { id: "following", label: "Подписки",   icon: "Heart" },
  { id: "rating",    label: "Рейтинг",    icon: "Trophy" },
];

export const RATING_PERIODS = [
  { id: "live",  label: "В прямом эфире" },
  { id: "today", label: "Сегодня" },
  { id: "week",  label: "На этой неделе" },
  { id: "all",   label: "За всё время" },
];

export const RANK_MEDALS = ["🥇", "🥈", "🥉"];

export const RANK_COLORS = [
  "from-yellow-400/20 to-amber-500/10 border-yellow-400/40",
  "from-slate-300/20 to-slate-400/10 border-slate-300/40",
  "from-orange-400/20 to-amber-600/10 border-orange-400/40",
];

export function formatScore(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}
