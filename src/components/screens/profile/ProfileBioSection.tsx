import { useState } from "react";
import Icon from "@/components/ui/icon";
import { type User } from "@/lib/api";
import { ProfileStatsBar } from "@/components/screens/profile/ProfileStatsBar";
import { FollowersModal } from "@/components/screens/profile/FollowersModal";

type StatKey = "height" | "weight" | "gender" | "status" | "city";
type FollowTab = "followers" | "following";

interface ProfileBioSectionProps {
  currentUser: User;
  statEdit: StatKey | null;
  statValue: string;
  onEditOpen: () => void;
  onOpenStat: (key: StatKey) => void;
  onCloseStat: () => void;
  onStatValueChange: (val: string) => void;
  onSaveStat: () => void;
}

export function ProfileBioSection({
  currentUser,
  statEdit,
  statValue,
  onEditOpen,
  onOpenStat,
  onCloseStat,
  onStatValueChange,
  onSaveStat,
}: ProfileBioSectionProps) {
  const [followModal, setFollowModal] = useState<FollowTab | null>(null);

  return (
    <>
      {/* О себе */}
      <div className="w-full mt-3 rounded-2xl p-4"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: "rgba(155,89,182,0.2)" }}>
              <Icon name="AlignLeft" size={12} className="text-purple-400" />
            </div>
            <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">О себе</span>
          </div>
          <button onClick={onEditOpen}
            className="w-7 h-7 rounded-xl flex items-center justify-center transition-all active:scale-95"
            style={{ background: "rgba(255,255,255,0.07)" }}>
            <Icon name="Pencil" size={13} className="text-white/50" />
          </button>
        </div>
        <p className="text-white/70 text-sm leading-relaxed">
          {currentUser.bio || (
            <span className="text-white/25 italic">Расскажи о себе — нажми карандаш</span>
          )}
        </p>
        {(currentUser.tags || []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {(currentUser.tags || []).map((t) => <span key={t} className="tag-pill">{t}</span>)}
          </div>
        )}
        {!(currentUser.tags || []).length && (
          <button onClick={onEditOpen}
            className="mt-3 px-3 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px dashed rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.4)" }}>
            + Добавить интересы
          </button>
        )}
      </div>

      {/* Рост / Вес / Пол / Статус / Город */}
      <ProfileStatsBar
        currentUser={currentUser}
        statEdit={statEdit}
        statValue={statValue}
        onOpen={onOpenStat}
        onClose={onCloseStat}
        onValueChange={onStatValueChange}
        onSave={onSaveStat}
      />

      {/* Подписчики и подписки */}
      <div className="w-full mt-3 flex gap-2">
        <button onClick={() => setFollowModal("followers")}
          className="flex-1 flex flex-col items-center py-4 rounded-2xl active:scale-95 transition-all"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <span className="text-white font-black text-2xl leading-none">{currentUser.followers ?? 0}</span>
          <span className="text-white/40 text-xs mt-1.5 font-medium">Подписчики</span>
        </button>
        <button onClick={() => setFollowModal("following")}
          className="flex-1 flex flex-col items-center py-4 rounded-2xl active:scale-95 transition-all"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <span className="text-white font-black text-2xl leading-none">{currentUser.following ?? 0}</span>
          <span className="text-white/40 text-xs mt-1.5 font-medium">Подписки</span>
        </button>
      </div>

      {followModal && (
        <FollowersModal initialTab={followModal} onClose={() => setFollowModal(null)} />
      )}

      {/* Дата регистрации */}
      {currentUser.created_at && (
        <div className="flex items-center justify-center gap-1.5 mt-4 mb-2 px-4 py-2 rounded-full"
          style={{ background: "rgba(255,255,255,0.04)" }}>
          <Icon name="Calendar" size={12} className="text-white/20" />
          <span className="text-white/25 text-xs">
            Присоединился {(() => {
              const d = new Date(currentUser.created_at!);
              const now = new Date();
              const months = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth();
              if (months === 0) return "менее месяца назад";
              if (months === 1) return "1 месяц назад";
              if (months < 5) return `${months} месяца назад`;
              if (months < 12) return `${months} месяцев назад`;
              const years = Math.floor(months / 12);
              return years === 1 ? "1 год назад" : `${years} года назад`;
            })()}
          </span>
        </div>
      )}
    </>
  );
}
