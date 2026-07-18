import { useTranslation } from "react-i18next";
import Icon from "@/components/ui/icon";

interface FeatureDef {
  key: "join" | "discover" | "share" | "safety";
  icon: string;
  gradient: string;
  glow: string;
  itemCount: 2 | 3;
}

const FEATURES: FeatureDef[] = [
  { key: "join", icon: "Heart", gradient: "linear-gradient(135deg,#FF2D78,#FF7AA8)", glow: "rgba(255,45,120,0.55)", itemCount: 3 },
  { key: "discover", icon: "Compass", gradient: "linear-gradient(135deg,#9B59B6,#6C5CE7)", glow: "rgba(155,89,182,0.55)", itemCount: 3 },
  { key: "share", icon: "Share2", gradient: "linear-gradient(135deg,#FF8C42,#FF2D78)", glow: "rgba(255,140,66,0.5)", itemCount: 2 },
  { key: "safety", icon: "ShieldCheck", gradient: "linear-gradient(135deg,#00C2A8,#6C5CE7)", glow: "rgba(0,194,168,0.5)", itemCount: 3 },
];

export function AuthFeaturesGrid() {
  const { t } = useTranslation();

  return (
    <div id="features" className="w-full max-w-5xl mx-auto px-6 py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-14 gap-y-12">
        {FEATURES.map((f) => (
          <div key={f.key} className="group flex flex-col gap-3 p-5 rounded-3xl transition-all hover:-translate-y-1"
            style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-3.5">
              <div className="relative w-12 h-12 flex items-center justify-center flex-shrink-0">
                <div className="absolute inset-0 rounded-2xl opacity-40 blur-md transition-opacity duration-300 group-hover:opacity-80"
                  style={{ background: f.gradient }} />
                <div className="relative w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 ease-out group-hover:scale-110 group-hover:rotate-6"
                  style={{ background: f.gradient, boxShadow: `0 6px 20px ${f.glow}` }}>
                  <Icon name={f.icon} size={21} className="text-white" />
                </div>
              </div>
              <h3 className="text-white text-xl font-bold font-unbounded">{t(`features.${f.key}.title`)}</h3>
            </div>
            <ul className="flex flex-col gap-2 pl-1">
              {Array.from({ length: f.itemCount }, (_, i) => i + 1).map((n) => (
                <li key={n} className="text-white/50 text-sm leading-relaxed flex gap-2">
                  <span className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full" style={{ background: f.gradient }} />
                  <span><span className="text-white font-semibold">{t(`features.${f.key}.item${n}Bold`)}</span> {t(`features.${f.key}.item${n}Text`)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AuthFeaturesGrid;
