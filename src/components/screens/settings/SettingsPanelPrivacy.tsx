import { type User } from "@/lib/api";
import { PrivacyScreen } from "./privacy/PrivacyScreen";
import { SettingsSimplePanels } from "./privacy/SettingsSimplePanels";

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
        <PrivacyScreen
          currentUser={currentUser}
          onPremium={onPremium}
          privacy={privacy}
          onPrivacyToggle={onPrivacyToggle}
          incognito={incognito}
          incognitoLoading={incognitoLoading}
          onIncognitoToggle={onIncognitoToggle}
          onOpenLegal={onOpenLegal}
        />
      )}

      {/* ── Уведомления · Внешний вид · Звуки · Видеочат ── */}
      <SettingsSimplePanels
        screen={screen}
        notif={notif}
        onNotifToggle={onNotifToggle}
        appear={appear}
        onAppearToggle={onAppearToggle}
        sounds={sounds}
        onSoundsToggle={onSoundsToggle}
        video={video}
        onVideoToggle={onVideoToggle}
      />
    </>
  );
}

export default SettingsPanelPrivacy;
