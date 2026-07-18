// ── Кнопка магазина приложений — в едином стиле с кнопками VK / Mail.ru ─────
export function StoreDownloadButton({ store }: { store: "rustore" | "nashstore" }) {
  const isRuStore = store === "rustore";
  return (
    <button
      type="button"
      onClick={(e) => e.preventDefault()}
      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-white text-sm font-semibold transition-all active:scale-95 hover:brightness-110"
      style={{
        background: isRuStore ? "#1E88E5" : "linear-gradient(135deg,#FF3B5C,#C81E45)",
        boxShadow: isRuStore ? "0 4px 16px rgba(30,136,229,0.35)" : "0 4px 16px rgba(255,59,92,0.35)",
      }}
    >
      <img
        src={isRuStore ? "/stores/rustore.png" : "/stores/nashstore.png"}
        alt={isRuStore ? "RuStore" : "NashStore"}
        className="w-5 h-5 rounded-md flex-shrink-0 object-cover"
      />
      {isRuStore ? "RuStore" : "NashStore"}
    </button>
  );
}