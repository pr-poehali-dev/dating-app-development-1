import Icon from "@/components/ui/icon";
import { type MyGift } from "@/lib/api";
import { GiftsGrid } from "@/components/gifts/GiftsGrid";

type ActiveTab = null | "settings" | "stats" | "shop" | "photos" | "private" | "gifts";

interface ProfileTabPanelsProps {
  activeTab: ActiveTab;
  myGifts: MyGift[];
  giftsLoading: boolean;
  onPremium: () => void;
}

export function ProfileTabPanels({ activeTab, myGifts, giftsLoading, onPremium }: ProfileTabPanelsProps) {
  return (
    <>
      {/* Панель: Статистика */}
      {activeTab === "stats" && (
        <div className="w-full mt-3 glass-card p-4 flex flex-col gap-3">
          {[
            { label: "Просмотры профиля за неделю", value: "—", icon: "Eye",           color: "#9B59B6" },
            { label: "Лайки получено",              value: "—", icon: "Heart",         color: "#FF2D78" },
            { label: "Совпадения",                  value: "—", icon: "Zap",           color: "#FF8C42" },
            { label: "Сообщений отправлено",        value: "—", icon: "MessageCircle", color: "#3B82F6" },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}22` }}>
                <Icon name={icon as "Eye"|"Heart"|"Zap"|"MessageCircle"} size={18} style={{ color }} />
              </div>
              <span className="text-white/70 text-sm flex-1">{label}</span>
              <span className="text-white font-bold">{value}</span>
            </div>
          ))}
          <p className="text-white/20 text-xs text-center mt-1">Статистика обновляется раз в сутки</p>
        </div>
      )}

      {/* Панель: Магазин */}
      {activeTab === "shop" && (
        <div className="w-full mt-3 flex flex-col gap-2">
          {[
            { icon: "Crown", label: "Premium подписка",  desc: "Безлимитные лайки и приоритет",  price: "от 249 ₽/мес", action: onPremium, grad: true },
            { icon: "Star",  label: "Суперлайки × 10",   desc: "Выдели себя среди остальных",    price: "199 ₽",         action: onPremium, grad: false },
            { icon: "Zap",   label: "Буст профиля",      desc: "Топ показов на 30 минут",        price: "99 ₽",          action: onPremium, grad: false },
            { icon: "Eye",   label: "Режим инкогнито",   desc: "Просматривай анонимно",          price: "149 ₽",         action: onPremium, grad: false },
          ].map(({ icon, label, desc, price, action, grad }) => (
            <button key={label} onClick={action}
              className="glass-card p-4 flex items-center gap-3 text-left w-full active:scale-[0.98] transition-all">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: grad ? "linear-gradient(135deg,#FF2D78,#9B59B6)" : "rgba(255,255,255,0.08)" }}>
                <Icon name={icon as "Crown"|"Star"|"Zap"|"Eye"} size={20} className={grad ? "text-white" : "text-white/60"} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">{label}</p>
                <p className="text-white/40 text-xs mt-0.5">{desc}</p>
              </div>
              <span className="text-pink-400 font-bold text-sm flex-shrink-0">{price}</span>
            </button>
          ))}
        </div>
      )}

      {/* Панель: Подарки */}
      {activeTab === "gifts" && (
        <div className="w-full mt-3">
          <GiftsGrid gifts={myGifts} loading={giftsLoading} />
        </div>
      )}
    </>
  );
}
