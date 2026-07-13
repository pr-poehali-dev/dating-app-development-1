import Icon from "@/components/ui/icon";
import { type MyGift } from "@/lib/api";
import { GiftsGrid } from "@/components/gifts/GiftsGrid";
import { useBackHandler } from "@/hooks/backStack";

interface UserGiftsSheetProps {
  visible: boolean;
  profileName: string;
  gifts: MyGift[];
  loading: boolean;
  onClose: () => void;
}

export function DiscoverUserGiftsSheet({ visible, profileName, gifts, loading, onClose }: UserGiftsSheetProps) {
  useBackHandler(visible, onClose);
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: "var(--spark-dark, #0f0a1a)" }}>
      <div className="flex items-center gap-3 px-5 pb-3 flex-shrink-0"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.08)" }}>
          <Icon name="ArrowLeft" size={18} className="text-white/80" />
        </button>
        <div className="flex-1 flex items-center gap-2">
          <Icon name="Gift" size={18} style={{ color: "#FFD700" }} />
          <p className="text-white font-bold text-lg leading-tight">Подарки {profileName}</p>
        </div>
      </div>
      <div className="overflow-y-auto flex-1 px-4 py-4"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}>
        <GiftsGrid
          gifts={gifts}
          loading={loading}
          emptyText={`У ${profileName} пока нет подарков.\nБудь первым — подари что-нибудь!`}
        />
      </div>
    </div>
  );
}
