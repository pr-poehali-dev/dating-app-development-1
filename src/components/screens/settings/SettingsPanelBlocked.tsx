import Icon from "@/components/ui/icon";
import { type BlockedUser } from "@/lib/api";
import { DEFAULT_AVATAR } from "@/components/ui/UserAvatar";

interface Props {
  blocks: BlockedUser[];
  blocksLoading: boolean;
  unblocking: number | null;
  onUnblock: (id: number) => void;
}

export function SettingsPanelBlocked({ blocks, blocksLoading, unblocking, onUnblock }: Props) {
  return (
    <div className="px-5 flex flex-col gap-3">
      <p className="text-white/40 text-xs">Заблокированные не могут видеть твой профиль и писать тебе</p>
      {blocksLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-7 h-7 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
        </div>
      ) : blocks.length === 0 ? (
        <div className="glass-card p-8 flex flex-col items-center gap-3 mt-2">
          <Icon name="Ban" size={40} className="text-white/20" />
          <p className="text-white/30 text-sm text-center">Список заблокированных пуст</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {blocks.map(user => (
            <div key={user.id} className="glass-card px-4 py-3 flex items-center gap-3">
              <img src={user.photo_url || DEFAULT_AVATAR} alt={user.name}
                className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{user.name}</p>
                {user.age && <p className="text-white/40 text-xs">{user.age} лет</p>}
              </div>
              <button
                disabled={unblocking === user.id}
                onClick={() => onUnblock(user.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 disabled:opacity-50 text-white/70"
                style={{ background: "rgba(255,255,255,0.08)" }}>
                {unblocking === user.id
                  ? <><Icon name="Loader2" size={13} className="animate-spin" />Ждите</>
                  : <><Icon name="UserCheck" size={13} />Разблокировать</>}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}