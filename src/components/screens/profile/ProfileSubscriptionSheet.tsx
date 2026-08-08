import Icon from "@/components/ui/icon";
import { type User } from "@/lib/api";
import { useBackHandler } from "@/hooks/backStack";

const TIER_LABEL: Record<string, string> = {
  start: "СТАРТ",
  plus: "ПЛЮС",
  gold: "ЗОЛОТО",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

interface ProfileSubscriptionSheetProps {
  currentUser: User;
  onClose: () => void;
  onUpgrade: () => void;
}

export function ProfileSubscriptionSheet({ currentUser, onClose, onUpgrade }: ProfileSubscriptionSheetProps) {
  useBackHandler(true, onClose);

  const isPremium = !!currentUser.premium;
  const tierLabel = currentUser.premium_tier ? TIER_LABEL[currentUser.premium_tier] || currentUser.premium_tier.toUpperCase() : "";

  return (
    <div className="fixed inset-0 z-[90] flex flex-col page-push-in"
      style={{ background: "linear-gradient(180deg, #1a0a2e 0%, #120818 100%)" }}>

      {/* Шапка */}
      <div className="flex items-center gap-3 px-4 py-3.5 flex-shrink-0"
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 14px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(255,255,255,0.02)",
        }}>
        <button onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
          style={{ background: "rgba(255,255,255,0.06)" }}>
          <Icon name="ChevronLeft" size={20} className="text-white/80" />
        </button>
        <p className="text-white font-bold text-base leading-tight">Моя подписка</p>
      </div>

      {/* Контент */}
      <div className="flex-1 overflow-y-auto px-4 pt-5 flex flex-col gap-3"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)" }}>

        {isPremium ? (
          <div className="rounded-2xl px-5 py-4"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <p className="font-unbounded text-white font-black text-lg leading-tight">
              ПОЛУТОН <span style={{ color: "#FF2D78" }}>{tierLabel}</span>
            </p>
            <p className="text-white/50 text-sm mt-2">
              {currentUser.premium_until ? "Твоя подписка продлевается:" : "Подписка активна"}
            </p>
            {currentUser.premium_until && (
              <p className="text-white font-semibold text-base mt-0.5">
                {formatDate(currentUser.premium_until)}
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-2xl px-5 py-4 flex items-start gap-3"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <Icon name="Sparkles" size={20} className="text-white/40 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-semibold text-sm">Подписка не активна</p>
              <p className="text-white/40 text-xs mt-1">Оформи Premium, чтобы получить больше возможностей знакомств</p>
            </div>
          </div>
        )}

        <button onClick={onUpgrade}
          className="w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg,#FF6A3D,#FF2D78)" }}>
          {isPremium ? "Улучшить" : "Оформить Premium"}
        </button>

        {isPremium && (
          <button onClick={onUpgrade}
            className="w-full py-3.5 rounded-2xl text-white/80 font-semibold text-sm transition-all active:scale-[0.98]"
            style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.18)" }}>
            Управление подпиской
          </button>
        )}
      </div>
    </div>
  );
}

export default ProfileSubscriptionSheet;
