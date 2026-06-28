import { useState } from "react";
import { profilesApi } from "@/lib/api";
import { ZODIACS, ELEMENT_KEYFRAMES, elementLabel } from "@/components/screens/profile/ZodiacData";
import { ZodiacIcon } from "@/components/screens/profile/ZodiacIcon";
import { ElementParticles, ZodiacPicker } from "@/components/screens/profile/ZodiacParticles";

// ── Интерактивный баннер (свой профиль) ───────────────────────────────────────
export function ZodiacBanner({
  zodiac,
  onUpdate,
}: {
  zodiac?: string;
  onUpdate: (zodiac: string) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const current = ZODIACS.find(z => z.key === zodiac);

  const handleSelect = async (key: string) => {
    setSaving(true);
    try {
      await profilesApi.updateMe({ zodiac: key });
      onUpdate(key);
    } catch (e) { /* ignore */ }
    setSaving(false);
  };

  return (
    <>
      <style>{ELEMENT_KEYFRAMES}</style>

      {showPicker && (
        <ZodiacPicker
          current={zodiac ?? ""}
          onSelect={handleSelect}
          onClose={() => setShowPicker(false)}
        />
      )}

      <button
        onClick={() => setShowPicker(true)}
        className="w-full relative overflow-hidden rounded-2xl text-left active:scale-[0.98] transition-transform"
        style={current ? {
          background: `linear-gradient(135deg, ${current.colors.from}20, ${current.colors.to}15)`,
          border: `1px solid ${current.colors.from}35`,
          boxShadow: `0 2px 16px ${current.colors.glow}`,
          ["--zodiac-glow" as string]: current.colors.glow,
        } : {
          background: "rgba(255,255,255,0.04)",
          border: "1.5px dashed rgba(255,255,255,0.15)",
        }}>

        {/* Частицы стихии */}
        {current && <ElementParticles element={current.element} color={current.colors.from} />}

        {/* Shimmer */}
        {current && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 bottom-0 w-1/3 opacity-10"
              style={{
                background: `linear-gradient(90deg, transparent, ${current.colors.text}, transparent)`,
                animation: "shimmer-slide 3s ease-in-out infinite",
              }} />
          </div>
        )}

        <div className="relative z-10 flex items-center gap-3 px-4 py-3">
          {current ? (
            <>
              {/* SVG иконка с анимацией */}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${current.colors.from}30, ${current.colors.to}20)`,
                  border: `1px solid ${current.colors.from}40`,
                  animation: "zodiac-float 3s ease-in-out infinite",
                  boxShadow: `0 0 14px ${current.colors.glow}`,
                  filter: `drop-shadow(0 0 4px ${current.colors.from}88)`,
                }}>
                <ZodiacIcon sign={current.key} color={current.colors.text} size={22} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm" style={{ color: current.colors.text }}>
                    {current.label}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide"
                    style={{ background: `${current.colors.from}25`, color: current.colors.text, opacity: 0.8 }}>
                    {elementLabel(current.element)}
                  </span>
                </div>
                <p className="text-white/35 text-[11px] mt-0.5">{current.dates}</p>
              </div>

              <div className="flex-shrink-0 opacity-40">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M5 3l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px dashed rgba(255,255,255,0.15)" }}>
                ✨
              </div>
              <div className="flex-1">
                <p className="text-white/60 text-sm font-medium">Знак зодиака</p>
                <p className="text-white/30 text-xs mt-0.5">Нажми, чтобы выбрать</p>
              </div>
              {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white/70 rounded-full animate-spin flex-shrink-0" />}
            </>
          )}
        </div>
      </button>
    </>
  );
}

// ── Read-only баннер (чужой профиль) ──────────────────────────────────────────
export function ZodiacBadge({ zodiac }: { zodiac: string }) {
  const current = ZODIACS.find(z => z.key === zodiac);
  if (!current) return null;

  return (
    <>
      <style>{ELEMENT_KEYFRAMES}</style>
      <div className="w-full relative overflow-hidden rounded-2xl"
        style={{
          background: `linear-gradient(135deg, ${current.colors.from}20, ${current.colors.to}15)`,
          border: `1px solid ${current.colors.from}35`,
          boxShadow: `0 2px 16px ${current.colors.glow}`,
        }}>

        <ElementParticles element={current.element} color={current.colors.from} />

        {/* Shimmer */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 bottom-0 w-1/3 opacity-10"
            style={{
              background: `linear-gradient(90deg, transparent, ${current.colors.text}, transparent)`,
              animation: "shimmer-slide 3s ease-in-out infinite",
            }} />
        </div>

        <div className="relative z-10 flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${current.colors.from}30, ${current.colors.to}20)`,
              border: `1px solid ${current.colors.from}40`,
              animation: "zodiac-float 3s ease-in-out infinite",
              boxShadow: `0 0 14px ${current.colors.glow}`,
              filter: `drop-shadow(0 0 4px ${current.colors.from}88)`,
            }}>
            <ZodiacIcon sign={current.key} color={current.colors.text} size={22} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm" style={{ color: current.colors.text }}>
                {current.label}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide"
                style={{ background: `${current.colors.from}25`, color: current.colors.text, opacity: 0.8 }}>
                {elementLabel(current.element)}
              </span>
            </div>
            <p className="text-white/35 text-[11px] mt-0.5">{current.dates}</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default ZodiacBanner;
