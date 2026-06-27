import Icon from "@/components/ui/icon";
import { type MyGift } from "@/lib/api";
import { GiftsGrid } from "@/components/gifts/GiftsGrid";

interface UserGiftsSheetProps {
  visible: boolean;
  profileName: string;
  gifts: MyGift[];
  loading: boolean;
  onClose: () => void;
}

export function DiscoverUserGiftsSheet({ visible, profileName, gifts, loading, onClose }: UserGiftsSheetProps) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
      onClick={onClose}>
      <div className="w-full max-w-sm rounded-t-3xl flex flex-col"
        style={{ background: "var(--spark-dark2,#1a1030)", maxHeight: "75dvh" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2">
            <Icon name="Gift" size={18} style={{ color: "#FFD700" }} />
            <p className="text-white font-bold text-base">Подарки {profileName}</p>
          </div>
          <button onClick={onClose} className="text-white/40">
            <Icon name="X" size={20} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-4 py-4 pb-8">
          <GiftsGrid
            gifts={gifts}
            loading={loading}
            emptyText={`У ${profileName} пока нет подарков.\nБудь первым — подари что-нибудь!`}
          />
        </div>
      </div>
    </div>
  );
}
