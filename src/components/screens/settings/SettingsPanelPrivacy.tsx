import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { type User } from "@/lib/api";
import { Toggle, Row } from "@/components/screens/SettingsUIKit";
import {
  promptOneSignal,
  disableOneSignal,
  getPushStatus,
  openNativeAppSettings,
} from "@/hooks/useOneSignal";

function isNativeApp() {
  const w = window as unknown as { median?: unknown; gonative?: unknown };
  if (w.median || w.gonative) return true;
  return /median|gonative/i.test(navigator.userAgent || "");
}

function PushSubscribeButton() {
  // on — уведомления включены, off — выключены, denied — заблокированы в настройках телефона
  const [state, setState] = useState<"off" | "on" | "denied" | "asked">(() =>
    getPushStatus() === "granted" ? "on" : getPushStatus() === "denied" ? "denied" : "off",
  );
  const [loading, setLoading] = useState(false);

  // При возврате на экран (свернул/развернул приложение) пересчитываем реальный статус
  useEffect(() => {
    const sync = () => {
      if (document.visibilityState !== "visible") return;
      const s = getPushStatus();
      if (s === "granted") setState("on");
      else if (s === "denied") setState((prev) => (prev === "asked" ? prev : "denied"));
    };
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  const enabled = state === "on";

  const handleToggle = async () => {
    if (loading) return;
    const native = isNativeApp();

    // Выключаем
    if (enabled) {
      setLoading(true);
      await disableOneSignal();
      setLoading(false);
      if (native) {
        // В приложении отписка идёт через настройки телефона
        openNativeAppSettings();
        setState("denied");
      } else {
        setState("off");
      }
      return;
    }

    // Уже заблокировано в системе — сразу ведём в настройки телефона
    if (state === "denied" && native) {
      openNativeAppSettings();
      return;
    }

    // Включаем — запрашиваем системное разрешение
    setLoading(true);
    const ok = await promptOneSignal();
    setLoading(false);

    if (native) {
      setState(ok ? "asked" : "denied");
    } else {
      const s = getPushStatus();
      setState(s === "granted" ? "on" : "denied");
    }
  };

  const title = enabled
    ? "Push-уведомления включены"
    : state === "asked"
    ? "Подтвердите в окне телефона"
    : state === "denied"
    ? "Уведомления заблокированы"
    : "Push-уведомления выключены";

  const sub = loading
    ? "Секундочку..."
    : state === "asked"
    ? "Разрешите уведомления в системном окне"
    : state === "denied"
    ? "Нажми, чтобы открыть настройки телефона"
    : enabled
    ? "Вы получаете важные уведомления"
    : "Не пропускай новые совпадения и сообщения";

  return (
    <div
      className="w-full mb-3 rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-all"
      style={{
        background: enabled
          ? "rgba(74,222,128,0.1)"
          : state === "denied"
          ? "rgba(248,113,113,0.1)"
          : "linear-gradient(135deg,rgba(255,45,120,0.16),rgba(155,89,182,0.16))",
        border: `1px solid ${enabled ? "rgba(74,222,128,0.3)" : state === "denied" ? "rgba(248,113,113,0.3)" : "rgba(255,45,120,0.3)"}`,
      }}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: enabled ? "rgba(74,222,128,0.18)" : state === "denied" ? "rgba(248,113,113,0.18)" : "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
        <Icon name={enabled ? "BellRing" : state === "denied" ? "BellOff" : "Bell"} size={17}
          style={{ color: enabled ? "#4ADE80" : state === "denied" ? "#F87171" : "#fff" }} />
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className="text-white font-semibold text-sm">{title}</p>
        <p className="text-white/45 text-xs mt-0.5">{sub}</p>
      </div>

      {state === "denied" ? (
        <button onClick={handleToggle}
          className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-xl active:scale-95 transition-transform"
          style={{ background: "rgba(248,113,113,0.15)", color: "#F87171" }}>
          Настройки
        </button>
      ) : loading ? (
        <Icon name="Loader2" size={18} className="animate-spin text-white/50 flex-shrink-0" />
      ) : (
        <button onClick={handleToggle}
          className="flex-shrink-0 w-12 h-6 rounded-full relative transition-all duration-300"
          style={{ background: enabled ? "linear-gradient(90deg,#4ADE80,#22C55E)" : "rgba(255,255,255,0.12)" }}
          aria-label="Переключить push-уведомления">
          <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300"
            style={{ left: enabled ? "26px" : "2px" }} />
        </button>
      )}
    </div>
  );
}

interface Props {
  screen: string;
  currentUser: User;
  onPremium?: () => void;

  privacy: { showOnline: boolean; showDistance: boolean; readReceipts: boolean; searchable: boolean };
  onPrivacyToggle: (key: keyof Props["privacy"]) => void;

  notif: { matches: boolean; messages: boolean; likes: boolean; promo: boolean };
  onNotifToggle: (key: keyof Props["notif"]) => void;

  appear: { compactCards: boolean; showAge: boolean };
  onAppearToggle: (key: keyof Props["appear"]) => void;

  sounds: { messages: boolean; matches: boolean; notifications: boolean };
  onSoundsToggle: (key: keyof Props["sounds"]) => void;

  video: { autoAccept: boolean; blurBg: boolean; mirrorCamera: boolean };
  onVideoToggle: (key: keyof Props["video"]) => void;

  incognito: boolean;
  incognitoLoading: boolean;
  onIncognitoToggle: () => void;

  onOpenLegal: () => void;
}

export function SettingsPanelPrivacy({
  screen,
  currentUser,
  onPremium,
  privacy,
  onPrivacyToggle,
  notif,
  onNotifToggle,
  appear,
  onAppearToggle,
  sounds,
  onSoundsToggle,
  video,
  onVideoToggle,
  incognito,
  incognitoLoading,
  onIncognitoToggle,
  onOpenLegal,
}: Props) {
  return (
    <>
      {/* ── Конфиденциальность ── */}
      {screen === "privacy" && (
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
      )}

      {/* ── Уведомления ── */}
      {screen === "notifications" && (
        <div className="mx-5">
        <PushSubscribeButton />
        <div className="glass-card overflow-hidden">
          <Row label="Новые совпадения" sub="Когда кто-то ответил взаимностью">
            <Toggle value={notif.matches} onChange={() => onNotifToggle("matches")} />
          </Row>
          <Row label="Сообщения" sub="Входящие сообщения в чатах">
            <Toggle value={notif.messages} onChange={() => onNotifToggle("messages")} />
          </Row>
          <Row label="Лайки" sub="Кто оценил твой профиль">
            <Toggle value={notif.likes} onChange={() => onNotifToggle("likes")} />
          </Row>
          <Row label="Акции и новости" sub="Промо и обновления приложения">
            <Toggle value={notif.promo} onChange={() => onNotifToggle("promo")} />
          </Row>
        </div>
        </div>
      )}

      {/* ── Внешний вид ── */}
      {screen === "appearance" && (
        <div className="mx-5 glass-card overflow-hidden">
          <Row label="Компактные карточки" sub="Меньше информации на карточке">
            <Toggle value={appear.compactCards} onChange={() => onAppearToggle("compactCards")} />
          </Row>
          <Row label="Показывать возраст" sub="Возраст отображается в профиле">
            <Toggle value={appear.showAge} onChange={() => onAppearToggle("showAge")} />
          </Row>
        </div>
      )}

      {/* ── Звуки ── */}
      {screen === "sounds" && (
        <div className="mx-5 glass-card overflow-hidden">
          <Row label="Звук сообщений" sub="Звук при входящем сообщении">
            <Toggle value={sounds.messages} onChange={() => onSoundsToggle("messages")} />
          </Row>
          <Row label="Звук совпадений" sub="Звук при новом совпадении">
            <Toggle value={sounds.matches} onChange={() => onSoundsToggle("matches")} />
          </Row>
          <Row label="Звук уведомлений" sub="Остальные уведомления">
            <Toggle value={sounds.notifications} onChange={() => onSoundsToggle("notifications")} />
          </Row>
        </div>
      )}

      {/* ── Видеочат ── */}
      {screen === "videochat" && (
        <div className="mx-5 glass-card overflow-hidden">
          <Row label="Авто-принятие звонков" sub="Видеозвонки принимаются автоматически">
            <Toggle value={video.autoAccept} onChange={() => onVideoToggle("autoAccept")} />
          </Row>
          <Row label="Размытый фон" sub="Скрывать фон во время звонка">
            <Toggle value={video.blurBg} onChange={() => onVideoToggle("blurBg")} />
          </Row>
          <Row label="Зеркальная камера" sub="Отразить изображение камеры">
            <Toggle value={video.mirrorCamera} onChange={() => onVideoToggle("mirrorCamera")} />
          </Row>
        </div>
      )}
    </>
  );
}