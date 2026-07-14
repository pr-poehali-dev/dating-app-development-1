import Icon from "@/components/ui/icon";
import { type MyGift } from "@/lib/api";
import { GiftsGrid } from "@/components/gifts/GiftsGrid";
import { useBackHandler } from "@/hooks/backStack";

interface ProfileGiftsScreenProps {
  myGifts: MyGift[];
  giftsLoading: boolean;
  onClose: () => void;
}

export function ProfileGiftsScreen({ myGifts, giftsLoading, onClose }: ProfileGiftsScreenProps) {
  useBackHandler(true, onClose);

  return (
    <div className="fixed inset-0 z-40 flex flex-col" style={{ background: "var(--spark-dark, #0d0d0d)", animation: "slideUp 0.28s ease" }}>
      <style>{`@keyframes slideUp { from { transform: translateY(100%); opacity: 0.6; } to { transform: translateY(0); opacity: 1; } }`}</style>

      {/* Шапка */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 pt-11 pb-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <button onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{ background: "rgba(255,255,255,0.08)" }}>
          <Icon name="ChevronLeft" size={18} className="text-white" />
        </button>
        <h2 className="text-white font-bold text-base flex-1">Мои подарки</h2>
      </div>

      {/* Контент */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-6" style={{ scrollbarWidth: "none" }}>
        <GiftsGrid gifts={myGifts} loading={giftsLoading} />
      </div>
    </div>
  );
}

export default ProfileGiftsScreen;
