import { useState } from "react";
import Icon from "@/components/ui/icon";
import { useBackHandler } from "@/hooks/backStack";
import { useYookassa } from "@/components/extensions/yookassa/useYookassa";
import { PAY_CREATE_URL } from "@/components/screens/ProfileGiftSheet";

const MIN_TOPUP = 500;

const PACKAGES = [
  { coins: 500, badge: "" },
  { coins: 1000, badge: "Популярно" },
  { coins: 2000, badge: "" },
  { coins: 3000, badge: "" },
  { coins: 5000, badge: "Выгодно" },
  { coins: 10000, badge: "Максимум" },
];

interface Props {
  currentBalance?: number | null;
  onClose: () => void;
}

export function CoinTopUpSheet({ currentBalance, onClose }: Props) {
  const { pay, loading } = useYookassa(PAY_CREATE_URL);
  const [selected, setSelected] = useState<number>(1000);
  const [custom, setCustom] = useState("");

  useBackHandler(true, onClose);

  const customNum = parseInt(custom, 10) || 0;
  const amount = custom.trim() ? customNum : selected;
  const valid = amount >= MIN_TOPUP;

  const handlePay = async () => {
    if (!valid || loading) return;
    const token = localStorage.getItem("spark_token") || "";
    await pay({
      amount,
      description: `Пополнение баланса: ${amount} монет`,
      returnUrl: window.location.origin + "/?payment=success",
      metadata: {
        kind: "coins",
        coins: String(amount),
        sender_token: token,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col" style={{ background: "var(--spark-dark, #0f0a1a)" }}>
      {/* Шапка */}
      <div className="flex items-center gap-3 px-5 pb-3 flex-shrink-0"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.08)" }}>
          <Icon name="ArrowLeft" size={18} className="text-white/80" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-lg leading-tight">Пополнить монеты</p>
          <p className="text-white/40 text-xs mt-0.5">1 ₽ = 1 монета · минимум {MIN_TOPUP}</p>
        </div>
        {currentBalance !== null && currentBalance !== undefined && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full flex-shrink-0"
            style={{ background: "rgba(255,200,0,0.12)", border: "1px solid rgba(255,200,0,0.3)" }}>
            <Icon name="Coins" size={15} style={{ color: "#FFC800" }} />
            <span className="text-sm font-bold" style={{ color: "#FFC800" }}>{currentBalance.toLocaleString("ru")}</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 120px)" }}>
        {/* Пакеты */}
        <div className="grid grid-cols-2 gap-3">
          {PACKAGES.map(pkg => {
            const active = !custom.trim() && selected === pkg.coins;
            return (
              <button key={pkg.coins}
                onClick={() => { setSelected(pkg.coins); setCustom(""); }}
                className="relative flex flex-col items-center gap-1.5 py-5 rounded-2xl transition-all active:scale-[0.97]"
                style={{
                  background: active
                    ? "linear-gradient(135deg,rgba(255,200,0,0.18),rgba(255,45,120,0.14))"
                    : "rgba(255,255,255,0.05)",
                  border: `1.5px solid ${active ? "rgba(255,200,0,0.5)" : "rgba(255,255,255,0.08)"}`,
                  boxShadow: active ? "0 6px 22px rgba(255,200,0,0.2)" : "none",
                }}>
                {pkg.badge && (
                  <span className="absolute top-2 right-2 text-[8px] font-black px-1.5 py-0.5 rounded-md text-white"
                    style={{ background: "linear-gradient(90deg,#FF2D78,#9B59B6)" }}>{pkg.badge}</span>
                )}
                <Icon name="Coins" size={26} style={{ color: "#FFC800" }} />
                <span className="text-white font-black text-lg leading-none">{pkg.coins.toLocaleString("ru")}</span>
                <span className="text-white/45 text-xs">{pkg.coins.toLocaleString("ru")} ₽</span>
              </button>
            );
          })}
        </div>

        {/* Своя сумма */}
        <div className="mt-4">
          <p className="text-white/50 text-xs font-semibold mb-2 px-1">СВОЯ СУММА</p>
          <div className="relative">
            <Icon name="Coins" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#FFC800" }} />
            <input
              value={custom}
              onChange={e => setCustom(e.target.value.replace(/[^\d]/g, ""))}
              inputMode="numeric"
              placeholder={`от ${MIN_TOPUP} монет`}
              className="w-full rounded-2xl pl-10 pr-4 py-3.5 text-white placeholder-white/30 outline-none font-semibold"
              style={{ background: "rgba(255,255,255,0.05)", border: `1.5px solid ${custom.trim() && valid ? "rgba(255,200,0,0.5)" : "rgba(255,255,255,0.08)"}` }}
            />
          </div>
          {custom.trim() && !valid && (
            <p className="text-red-400 text-xs mt-1.5 px-1">Минимум {MIN_TOPUP} монет</p>
          )}
        </div>

        <p className="text-white/30 text-xs text-center mt-5 leading-relaxed px-4">
          Монеты зачислятся автоматически после оплаты. Ими можно дарить подарки в разделе «Особые». Монеты нельзя передавать другим и вывести обратно.
        </p>
      </div>

      {/* Кнопка оплаты */}
      <div className="absolute left-0 right-0 bottom-0 px-4 pt-3"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
          background: "linear-gradient(to top, var(--spark-dark,#0f0a1a) 75%, transparent)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}>
        <button disabled={!valid || loading} onClick={handlePay}
          className="w-full btn-grad py-4 font-bold text-white rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2">
          {loading
            ? <><Icon name="Loader2" size={18} className="animate-spin" />Переход к оплате...</>
            : <><Icon name="CreditCard" size={18} />Пополнить на {amount.toLocaleString("ru")} ₽</>}
        </button>
      </div>
    </div>
  );
}

export default CoinTopUpSheet;
