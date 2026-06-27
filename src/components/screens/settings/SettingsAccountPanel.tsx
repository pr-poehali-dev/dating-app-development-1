import { type User, type BlockedUser } from "@/lib/api";
import { SettingsPanelAccount } from "./SettingsPanelAccount";
import { SettingsPanelPrivacy } from "./SettingsPanelPrivacy";
import { SettingsPanelPrivatePhotos } from "./SettingsPanelPrivatePhotos";
import { SettingsPanelBlocked } from "./SettingsPanelBlocked";

type PrivatePhoto = { id: number; photo_url: string; created_at: string };

interface Props {
  screen: string;
  currentUser: User;
  onPremium?: () => void;

  // account
  name: string;
  username: string;
  usernameError: string;
  saved: boolean;
  onNameChange: (v: string) => void;
  onUsernameChange: (v: string) => void;
  onSaveAccount: () => void;

  // privacy
  privacy: { showOnline: boolean; showDistance: boolean; readReceipts: boolean; searchable: boolean };
  onPrivacyToggle: (key: keyof Props["privacy"]) => void;

  // notifications
  notif: { matches: boolean; messages: boolean; likes: boolean; promo: boolean };
  onNotifToggle: (key: keyof Props["notif"]) => void;

  // appearance
  isDark: boolean;
  appear: { compactCards: boolean; showAge: boolean };
  onToggleTheme: () => void;
  onAppearToggle: (key: keyof Props["appear"]) => void;

  // sounds
  sounds: { messages: boolean; matches: boolean; notifications: boolean };
  onSoundsToggle: (key: keyof Props["sounds"]) => void;

  // videochat
  video: { autoAccept: boolean; blurBg: boolean; mirrorCamera: boolean };
  onVideoToggle: (key: keyof Props["video"]) => void;

  // private_photos
  privatePhotos: PrivatePhoto[];
  privateLoading: boolean;
  privateUploading: boolean;
  privateError: string;
  onPrivateUpload: (file: File) => void;
  onPrivateDelete: (id: number) => void;

  // blocked
  blocks: BlockedUser[];
  blocksLoading: boolean;
  unblocking: number | null;
  onUnblock: (id: number) => void;

  // incognito
  incognito: boolean;
  incognitoLoading: boolean;
  onIncognitoToggle: () => void;

  onOpenBlocked: () => void;
}

export function SettingsAccountPanel(props: Props) {
  const { screen } = props;

  return (
    <>
      {screen === "account" && (
        <SettingsPanelAccount
          currentUser={props.currentUser}
          onPremium={props.onPremium}
          name={props.name}
          username={props.username}
          usernameError={props.usernameError}
          saved={props.saved}
          onNameChange={props.onNameChange}
          onUsernameChange={props.onUsernameChange}
          onSaveAccount={props.onSaveAccount}
          privatePhotos={props.privatePhotos}
          privateLoading={props.privateLoading}
          privateUploading={props.privateUploading}
          privateError={props.privateError}
          onPrivateUpload={props.onPrivateUpload}
          onPrivateDelete={props.onPrivateDelete}
        />
      )}

      {["privacy", "notifications", "appearance", "sounds", "videochat"].includes(screen) && (
        <SettingsPanelPrivacy
          screen={screen}
          currentUser={props.currentUser}
          onPremium={props.onPremium}
          privacy={props.privacy}
          onPrivacyToggle={props.onPrivacyToggle}
          notif={props.notif}
          onNotifToggle={props.onNotifToggle}
          isDark={props.isDark}
          appear={props.appear}
          onToggleTheme={props.onToggleTheme}
          onAppearToggle={props.onAppearToggle}
          sounds={props.sounds}
          onSoundsToggle={props.onSoundsToggle}
          video={props.video}
          onVideoToggle={props.onVideoToggle}
          incognito={props.incognito}
          incognitoLoading={props.incognitoLoading}
          onIncognitoToggle={props.onIncognitoToggle}
          onOpenBlocked={props.onOpenBlocked}
        />
      )}

      {screen === "private_photos" && (
        <SettingsPanelPrivatePhotos
          currentUser={props.currentUser}
          privatePhotos={props.privatePhotos}
          privateLoading={props.privateLoading}
          privateUploading={props.privateUploading}
          privateError={props.privateError}
          onPrivateUpload={props.onPrivateUpload}
          onPrivateDelete={props.onPrivateDelete}
        />
      )}

      {screen === "blocked" && (
        <SettingsPanelBlocked
          blocks={props.blocks}
          blocksLoading={props.blocksLoading}
          unblocking={props.unblocking}
          onUnblock={props.onUnblock}
        />
      )}
    </>
  );
}

export default SettingsAccountPanel;