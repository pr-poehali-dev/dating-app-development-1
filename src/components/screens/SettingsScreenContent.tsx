import { type User, type BlockedUser } from "@/lib/api";
import { SettingsAccountPanel } from "@/components/screens/settings/SettingsAccountPanel";
import { SettingsHelpPanel } from "@/components/screens/settings/SettingsHelpPanel";

type PrivatePhoto = { id: number; photo_url: string; created_at: string };

interface SettingsScreenContentProps {
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
  onPrivacyToggle: (key: keyof SettingsScreenContentProps["privacy"]) => void;

  // notifications
  notif: { matches: boolean; messages: boolean; likes: boolean; promo: boolean };
  onNotifToggle: (key: keyof SettingsScreenContentProps["notif"]) => void;

  // appearance
  appear: { compactCards: boolean; showAge: boolean };
  onAppearToggle: (key: keyof SettingsScreenContentProps["appear"]) => void;

  // sounds
  sounds: { messages: boolean; matches: boolean; notifications: boolean };
  onSoundsToggle: (key: keyof SettingsScreenContentProps["sounds"]) => void;

  // videochat
  video: { autoAccept: boolean; blurBg: boolean; mirrorCamera: boolean };
  onVideoToggle: (key: keyof SettingsScreenContentProps["video"]) => void;

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

  onOpenLegal: () => void;
}

export function SettingsScreenContent({
  screen,
  currentUser,
  onPremium,
  name,
  username,
  usernameError,
  saved,
  onNameChange,
  onUsernameChange,
  onSaveAccount,
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
  privatePhotos,
  privateLoading,
  privateUploading,
  privateError,
  onPrivateUpload,
  onPrivateDelete,
  blocks,
  blocksLoading,
  unblocking,
  onUnblock,
  incognito,
  incognitoLoading,
  onIncognitoToggle,
  onOpenLegal,
}: SettingsScreenContentProps) {
  return (
    <div className="flex-1 overflow-y-auto pb-8">
      <SettingsAccountPanel
        screen={screen}
        currentUser={currentUser}
        onPremium={onPremium}
        name={name}
        username={username}
        usernameError={usernameError}
        saved={saved}
        onNameChange={onNameChange}
        onUsernameChange={onUsernameChange}
        onSaveAccount={onSaveAccount}
        privacy={privacy}
        onPrivacyToggle={onPrivacyToggle}
        notif={notif}
        onNotifToggle={onNotifToggle}
        appear={appear}
        onAppearToggle={onAppearToggle}
        sounds={sounds}
        onSoundsToggle={onSoundsToggle}
        video={video}
        onVideoToggle={onVideoToggle}
        privatePhotos={privatePhotos}
        privateLoading={privateLoading}
        privateUploading={privateUploading}
        privateError={privateError}
        onPrivateUpload={onPrivateUpload}
        onPrivateDelete={onPrivateDelete}
        blocks={blocks}
        blocksLoading={blocksLoading}
        unblocking={unblocking}
        onUnblock={onUnblock}
        incognito={incognito}
        incognitoLoading={incognitoLoading}
        onIncognitoToggle={onIncognitoToggle}
        onOpenLegal={onOpenLegal}
      />

      <SettingsHelpPanel
        key={screen}
        screen={screen}
      />
    </div>
  );
}