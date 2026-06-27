import { useRef } from "react";
import Icon from "@/components/ui/icon";
import { type User } from "@/lib/api";

type PrivatePhoto = { id: number; photo_url: string; created_at: string };

interface Props {
  currentUser: User;
  privatePhotos: PrivatePhoto[];
  privateLoading: boolean;
  privateUploading: boolean;
  privateError: string;
  onPrivateUpload: (file: File) => void;
  onPrivateDelete: (id: number) => void;
}

export function SettingsPanelPrivatePhotos({
  currentUser,
  privatePhotos,
  privateLoading,
  privateUploading,
  privateError,
  onPrivateUpload,
  onPrivateDelete,
}: Props) {
  const privateInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="px-5 flex flex-col gap-4">
      <div className="glass-card p-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,45,120,0.15)" }}>
            <Icon name="Lock" size={20} className="text-pink-500" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Приватные фото</p>
            <p className="text-white/50 text-xs">Доступны только по запросу</p>
          </div>
        </div>
        <p className="text-white/50 text-xs leading-relaxed">Добавь фото в приватный альбом. Другие пользователи смогут запросить доступ, и ты решишь — открыть или нет.</p>
      </div>

      <input ref={privateInputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onPrivateUpload(f); e.target.value = ""; }} />

      <div className="glass-card px-4 py-3 flex items-center gap-3">
        <Icon name="Info" size={16} className="text-white/30 flex-shrink-0" />
        <p className="text-white/40 text-xs leading-relaxed">
          {currentUser.premium
            ? `Подписка: максимум 2 фото (загружено ${privatePhotos.length}/2)`
            : `Бесплатно: 1 фото (загружено ${privatePhotos.length}/1). Подписка даёт 2 фото`}
        </p>
      </div>

      {privateError && <p className="text-red-400 text-sm text-center px-1">{privateError}</p>}

      {privateLoading ? (
        <div className="flex justify-center py-8"><Icon name="Loader2" size={28} className="text-white/30 animate-spin" /></div>
      ) : privatePhotos.length === 0 ? (
        <div className="glass-card p-8 flex flex-col items-center gap-3 rounded-3xl" style={{ border: "2px dashed rgba(255,255,255,0.1)" }}>
          <Icon name="ImagePlus" size={36} className="text-white/20" />
          <p className="text-white/30 text-sm text-center">У тебя пока нет приватных фото</p>
          <button onClick={() => privateInputRef.current?.click()} disabled={privateUploading}
            className="btn-grad px-5 py-2 text-sm font-semibold text-white rounded-2xl disabled:opacity-50">
            {privateUploading ? "Загрузка..." : "Добавить фото"}
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            {privatePhotos.map(p => (
              <div key={p.id} className="relative aspect-square rounded-2xl overflow-hidden">
                <img src={p.photo_url} className="w-full h-full object-cover" />
                <button onClick={() => onPrivateDelete(p.id)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.6)" }}>
                  <Icon name="X" size={12} className="text-white" />
                </button>
              </div>
            ))}
          </div>
          {((currentUser.premium && privatePhotos.length < 2) || (!currentUser.premium && privatePhotos.length < 1)) && (
            <button onClick={() => privateInputRef.current?.click()} disabled={privateUploading}
              className="btn-grad py-2.5 text-sm font-semibold text-white rounded-2xl disabled:opacity-50">
              {privateUploading ? "Загрузка..." : "Добавить ещё фото"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
