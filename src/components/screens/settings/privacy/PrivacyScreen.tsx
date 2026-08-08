import { useState } from "react";
import Icon from "@/components/ui/icon";
import { type User } from "@/lib/api";
import { Toggle, Row } from "@/components/screens/SettingsUIKit";
import { shareProfile } from "@/lib/shareProfile";
import { LocationCard } from "./LocationCard";

function ShareMyProfileButton({ userId, name }: { userId: number; name: string }) {
  const [state, setState] = useState<"idle" | "copied" | "fail">("idle");

  const handleShare = async () => {
    const res = await shareProfile(userId, name);
    if (res === "copied") {
      setState("copied");
      setTimeout(() => setState("idle"), 2500);
    } else if (res === "fail") {
      setState("fail");
      setTimeout(() => setState("idle"), 2500);
    }
  };

  return (
    <button onClick={handleShare}
      className="glass-card overflow-hidden w-full flex items-center gap-3 px-4 py-3.5 active:opacity-70 transition-opacity text-left">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: "linear-gradient(135deg,rgba(255,45,120,0.25),rgba(155,89,182,0.25))" }}>
        <Icon name={state === "copied" ? "Check" : "Share2"} size={15}
          style={{ color: state === "copied" ? "#4ADE80" : "#FF2D78" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white/90 text-sm font-semibold leading-tight">Поделиться моим профилем</p>
        <p className="text-white/30 text-[11px] leading-tight mt-0.5">
          {state === "copied" ? "Ссылка скопирована" : state === "fail" ? "Не удалось поделиться" : "Отправь ссылку друзьям"}
        </p>
      </div>
      <Icon name="ChevronRight" size={14} className="text-white/20 flex-shrink-0" />
    </button>
  );
}

interface PrivacyScreenProps {
  currentUser: User;
  onPremium?: () => void;
  privacy: { showOnline: boolean; showDistance: boolean; readReceipts: boolean; searchable: boolean };
  onPrivacyToggle: (key: keyof PrivacyScreenProps["privacy"]) => void;
  incognito: boolean;
  incognitoLoading: boolean;
  onIncognitoToggle: () => void;
  onOpenLegal: () => void;
}

export function PrivacyScreen({
  currentUser,
  onPremium,
  privacy,
  onPrivacyToggle,
  incognito,
  incognitoLoading,
  onIncognitoToggle,
  onOpenLegal,
}: PrivacyScreenProps) {
  return (
    <div className="mx-5 flex flex-col gap-3">
      {/* Инкогнито — выделенная карточка */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: incognito ? "rgba(155,89,182,0.12)" : "rgba(255,255,255,0.05)", border: `1px solid ${incognito ? "rgba(155,89,182,0.35)" : "rgba(255,255,255,0.08)"}`, transition: "all 0.3s" }}>
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: incognito ? "rgba(155,89,182,0.25)" : "rgba(255,255,255,0.07)" }}>
            <Icon name="EyeOff" size={18} className={incognito ? "text-purple-400" : "text-white/35"} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-white text-sm font-semibold">Режим инкогнито</p>
              {!currentUser.premium && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: "linear-gradient(90deg,#FF2D78,#9B59B6)", color: "white" }}>
                  Premium
                </span>
              )}
            </div>
            <p className="text-white/40 text-xs mt-0.5">
              {incognito ? "Ты скрыт — тебя не видят в сетке" : "Ты пропадёшь из поиска и сетки"}
            </p>
          </div>
          {currentUser.premium ? (
            <button onClick={onIncognitoToggle} disabled={incognitoLoading}
              className="flex-shrink-0 w-12 h-6 rounded-full relative transition-all duration-300 disabled:opacity-50"
              style={{ background: incognito ? "linear-gradient(90deg,#9B59B6,#6C3483)" : "rgba(255,255,255,0.12)" }}>
              <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300"
                style={{ left: incognito ? "26px" : "2px" }} />
              {incognitoLoading && (
                <Icon name="Loader2" size={12} className="absolute inset-0 m-auto animate-spin text-white/60" />
              )}
            </button>
          ) : (
            <button onClick={onPremium}
              className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-xl"
              style={{ background: "rgba(255,45,120,0.15)", color: "#FF2D78" }}>
              Открыть
            </button>
          )}
        </div>
        {incognito && (
          <div className="px-4 pb-3">
            <div className="flex items-center gap-1.5 text-purple-400 text-xs">
              <Icon name="ShieldCheck" size={12} />
              <span>Активен · тебя не видят другие пользователи</span>
            </div>
          </div>
        )}
      </div>

      {/* Локация */}
      <LocationCard />

      {/* Остальные настройки */}
      <div className="glass-card overflow-hidden">
        <Row label="Показывать онлайн" sub="Другие видят, когда ты в сети">
          <Toggle value={privacy.showOnline} onChange={() => onPrivacyToggle("showOnline")} />
        </Row>
        <Row label="Показывать расстояние" sub="Дистанция в профиле">
          <Toggle value={privacy.showDistance} onChange={() => onPrivacyToggle("showDistance")} />
        </Row>
        <Row label="Прочитано" sub="Отметки о прочтении сообщений">
          <Toggle value={privacy.readReceipts} onChange={() => onPrivacyToggle("readReceipts")} />
        </Row>
        <Row label="Доступен для поиска" sub="Твой профиль видят в рекомендациях">
          <Toggle value={privacy.searchable} onChange={() => onPrivacyToggle("searchable")} />
        </Row>
      </div>

      {/* Поделиться своим профилем */}
      <ShareMyProfileButton userId={currentUser.id} name={currentUser.name} />

      {/* Правовые документы */}
      <button onClick={onOpenLegal}
        className="glass-card overflow-hidden w-full flex items-center gap-3 px-4 py-3.5 active:opacity-70 transition-opacity text-left">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.07)" }}>
          <Icon name="Scale" size={15} className="text-white/50" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white/90 text-sm font-semibold leading-tight">Правовые документы</p>
          <p className="text-white/30 text-[11px] leading-tight mt-0.5">Условия и конфиденциальность</p>
        </div>
        <Icon name="ChevronRight" size={14} className="text-white/20 flex-shrink-0" />
      </button>
    </div>
  );
}

export default PrivacyScreen;
