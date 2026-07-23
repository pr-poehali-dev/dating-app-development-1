import Icon from "@/components/ui/icon";

export function GeoBlockScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center px-6 text-center"
      style={{ background: "linear-gradient(180deg, #1a0a2e 0%, #120818 100%)" }}>
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
        style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}>
        <Icon name="ShieldX" size={38} className="text-red-400" />
      </div>

      <h1 className="text-white font-bold text-2xl leading-tight mb-3">
        Доступ ограничен
      </h1>

      <p className="text-white/55 text-sm leading-relaxed max-w-sm mb-2">
        К сожалению, приложение недоступно для использования в вашем регионе.
      </p>
      <p className="text-white/35 text-xs leading-relaxed max-w-sm">
        Если вы используете VPN или прокси, отключите его и обновите страницу.
      </p>

      <div className="mt-8 flex items-center gap-2 text-white/25 text-xs">
        <Icon name="Globe" size={13} />
        <span>Ограничение действует на основании вашего местоположения</span>
      </div>
    </div>
  );
}

export default GeoBlockScreen;
