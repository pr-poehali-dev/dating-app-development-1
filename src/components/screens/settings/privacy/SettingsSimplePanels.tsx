import { Toggle, Row } from "@/components/screens/SettingsUIKit";
import { PushSubscribeButton } from "./PushSubscribeButton";

interface SimplePanelsProps {
  screen: string;
  notif: { matches: boolean; messages: boolean; likes: boolean; promo: boolean };
  onNotifToggle: (key: keyof SimplePanelsProps["notif"]) => void;
  appear: { compactCards: boolean; showAge: boolean };
  onAppearToggle: (key: keyof SimplePanelsProps["appear"]) => void;
  sounds: { messages: boolean; matches: boolean; notifications: boolean };
  onSoundsToggle: (key: keyof SimplePanelsProps["sounds"]) => void;
  video: { autoAccept: boolean; blurBg: boolean; mirrorCamera: boolean };
  onVideoToggle: (key: keyof SimplePanelsProps["video"]) => void;
}

export function SettingsSimplePanels({
  screen,
  notif,
  onNotifToggle,
  appear,
  onAppearToggle,
  sounds,
  onSoundsToggle,
  video,
  onVideoToggle,
}: SimplePanelsProps) {
  return (
    <>
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

export default SettingsSimplePanels;
