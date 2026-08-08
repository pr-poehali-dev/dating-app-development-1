// ── Кнопка «Доступно в RuStore» — официальный бейдж магазина ────────────────
const RUSTORE_URL = "https://www.rustore.ru/";

export function StoreDownloadButton() {
  return (
    <a
      href={RUSTORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full max-w-[220px] mx-auto transition-all active:scale-95 hover:brightness-105"
      aria-label="Доступно в RuStore"
    >
      <img
        src="/stores/rustore-badge.png"
        alt="Доступно в RuStore"
        className="w-full h-auto rounded-xl"
        style={{ background: "#fff", boxShadow: "0 4px 18px rgba(0,0,0,0.35)" }}
      />
    </a>
  );
}
