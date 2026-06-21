import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { profilesApi } from "@/lib/api";
import { ProtectedImage } from "@/components/ui/ProtectedImage";

// ─── PrivateGallery ───────────────────────────────────────────────────────────
export function PrivateGallery({ partnerId, onClose }: { partnerId: number; onClose: () => void }) {
  const [photos, setPhotos] = useState<{ id: number; photo_url: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    profilesApi.getPartnerPrivatePhotos(partnerId)
      .then(r => { setPhotos(r.photos || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [partnerId]);

  const prev = useCallback(() => setIdx(i => Math.max(0, i - 1)), []);
  const next = useCallback(() => setIdx(i => Math.min(photos.length - 1, i + 1)), [photos.length]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "rgba(0,0,0,0.95)" }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="flex flex-col items-center w-full max-w-sm px-4">
        {/* Заголовок */}
        <div className="flex items-center justify-between w-full mb-4">
          <span className="text-white/60 text-sm">Приватные фото</span>
          {photos.length > 0 && (
            <span className="text-white/40 text-sm">{idx + 1} / {photos.length}</span>
          )}
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
            <Icon name="X" size={16} className="text-white" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-60">
            <Icon name="Loader2" size={32} className="text-pink-400 animate-spin" />
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center gap-3 h-60 justify-center">
            <Icon name="ImageOff" size={40} className="text-white/30" />
            <span className="text-white/40 text-sm">Фото пока нет</span>
          </div>
        ) : (
          <>
            {/* Фото */}
            <div className="relative w-full" style={{ aspectRatio: "1" }}>
              <ProtectedImage src={photos[idx].photo_url}
                watermark="LoveBloom · скриншот запрещён"
                className="w-full h-full rounded-2xl"
                style={{ objectFit: "cover", border: "1.5px solid rgba(255,255,255,0.1)" }} />
              {idx > 0 && (
                <button onClick={prev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.5)" }}>
                  <Icon name="ChevronLeft" size={20} className="text-white" />
                </button>
              )}
              {idx < photos.length - 1 && (
                <button onClick={next}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.5)" }}>
                  <Icon name="ChevronRight" size={20} className="text-white" />
                </button>
              )}
            </div>
            {/* Точки */}
            {photos.length > 1 && (
              <div className="flex gap-1.5 mt-3">
                {photos.map((_, i) => (
                  <button key={i} onClick={() => setIdx(i)}
                    className="rounded-full transition-all"
                    style={{ width: i === idx ? 16 : 6, height: 6, background: i === idx ? "#FF2D78" : "rgba(255,255,255,0.3)" }} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── GrantPhotoMessage ────────────────────────────────────────────────────────
export function GrantPhotoMessage({ out, partnerId }: { out: boolean; partnerId: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div
        className="flex items-center gap-3 px-3 py-2.5 rounded-2xl cursor-pointer active:scale-95 transition-all"
        style={{
          background: "linear-gradient(135deg, rgba(74,222,128,0.12), rgba(34,197,94,0.08))",
          border: "1.5px solid rgba(74,222,128,0.25)",
          minWidth: 200,
        }}
        onClick={() => !out && setOpen(true)}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", boxShadow: "0 3px 10px rgba(34,197,94,0.4)" }}>
          <Icon name="Images" size={16} className="text-white" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-white text-[13px] font-semibold leading-tight">
            {out ? "Ты открыл фото" : "Открыл тебе фото"}
          </span>
          <span className="text-[11px]" style={{ color: out ? "rgba(74,222,128,0.7)" : "rgba(74,222,128,0.9)" }}>
            {out ? "Приватный альбом доступен" : "Нажми, чтобы посмотреть →"}
          </span>
        </div>
      </div>
      {open && <PrivateGallery partnerId={partnerId} onClose={() => setOpen(false)} />}
    </>
  );
}

// ─── RequestPhotoMessage ──────────────────────────────────────────────────────
export function RequestPhotoMessage({ out, onGrant, partnerId }: { out: boolean; onGrant?: () => void; partnerId?: number }) {
  const [granted, setGranted] = useState(false);
  const [open, setOpen] = useState(false);

  const handleGrant = () => { setGranted(true); onGrant?.(); };

  // Исходящее: ты запросил
  if (out) {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl"
        style={{
          background: "linear-gradient(135deg, rgba(255,45,120,0.12), rgba(155,89,182,0.1))",
          border: "1.5px solid rgba(255,45,120,0.22)",
          minWidth: 200,
        }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(255,45,120,0.2)", border: "1px solid rgba(255,45,120,0.35)" }}>
          <Icon name="Lock" size={16} className="text-pink-400" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-white text-[13px] font-semibold">Запрос фото</span>
          <span className="text-[11px] text-white/45">Ожидаешь ответа...</span>
        </div>
      </div>
    );
  }

  // Входящее: партнёр просит доступ
  return (
    <>
      <div className="flex flex-col gap-2.5 px-3 py-3 rounded-2xl"
        style={{
          background: "linear-gradient(135deg, rgba(255,45,120,0.15), rgba(155,89,182,0.12))",
          border: "1.5px solid rgba(255,45,120,0.3)",
          minWidth: 200,
        }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: granted ? "linear-gradient(135deg,#22c55e,#16a34a)" : "linear-gradient(135deg,#FF2D78,#9B59B6)",
              boxShadow: granted ? "0 3px 10px rgba(34,197,94,0.4)" : "0 3px 10px rgba(255,45,120,0.4)",
              transition: "all 0.3s",
            }}>
            <Icon name={granted ? "LockOpen" : "Lock"} size={16} className="text-white" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-white text-[13px] font-semibold">Запрос приватных фото</span>
            <span className="text-[11px] text-white/45">{granted ? "Доступ открыт ✓" : "Хочет посмотреть твой альбом"}</span>
          </div>
        </div>
        {!granted ? (
          <button onClick={handleGrant}
            className="btn-grad py-2 px-4 text-xs font-bold rounded-xl w-full active:scale-95 transition-transform">
            Открыть доступ →
          </button>
        ) : (
          <div className="flex items-center gap-1.5 py-1">
            <Icon name="CheckCircle" size={14} className="text-green-400" />
            <span className="text-xs text-green-400 font-medium">Альбом открыт</span>
          </div>
        )}
      </div>
      {open && partnerId && <PrivateGallery partnerId={partnerId} onClose={() => setOpen(false)} />}
    </>
  );
}