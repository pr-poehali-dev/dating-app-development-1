import { useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { supportApi } from "@/lib/api";

const MAX_MSG = 1000;
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/gif"];

export function SupportModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [login, setLogin] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [imgErr, setImgErr] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const pickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImgErr("");
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED.includes(file.type)) { setImgErr("Формат должен быть JPG, PNG или GIF"); return; }
    if (file.size > MAX_SIZE) { setImgErr("Размер изображения не должен превышать 5 МБ"); return; }
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        if (img.width < 100 || img.height < 100) { setImgErr("Изображение не должно быть менее 100 × 100 точек"); return; }
        setImage(reader.result as string);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    setError("");
    if (!message.trim()) return;
    setSending(true);
    try {
      await supportApi.send({
        name: name.trim() || undefined,
        login: login.trim() || undefined,
        email: email.trim() || undefined,
        message: message.trim(),
        image: image || undefined,
      });
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось отправить обращение");
    } finally {
      setSending(false);
    }
  };

  const canSend = message.trim().length > 0 && !sending;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      style={{ background: "rgba(20,15,30,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <div
        className="w-full max-w-md rounded-[28px] overflow-hidden max-h-[92vh] overflow-y-auto"
        style={{ background: "#ffffff", boxShadow: "0 20px 60px rgba(0,0,0,0.35)" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="px-7 pt-7 pb-8">
          {/* Шапка */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[#1a1a1a] font-bold text-lg">Обращение в поддержку</h3>
            <button onClick={onClose} className="p-1 -mr-1 text-[#1a1a1a]/70 hover:text-[#1a1a1a] transition-colors">
              <Icon name="X" size={22} />
            </button>
          </div>

          {sent ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#FF6A3D,#FF2D78)" }}>
                <Icon name="Check" size={30} className="text-white" />
              </div>
              <p className="text-[#1a1a1a] font-bold text-lg">Обращение отправлено</p>
              <p className="text-[#1a1a1a]/50 text-sm max-w-[280px]">
                Мы получили твоё сообщение и ответим на указанный email, если он есть.
              </p>
              <button onClick={onClose}
                className="mt-2 px-8 py-3 rounded-2xl text-white font-semibold text-sm"
                style={{ background: "linear-gradient(135deg,#FF6A3D,#FF2D78)" }}>
                Закрыть
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Твоё имя"
                className="w-full rounded-full px-5 py-3 text-[#1a1a1a] text-[15px] outline-none border border-[#e2e2e6] focus:border-[#FF6A3D] transition-colors placeholder-[#9a9aa2]" />
              <input value={login} onChange={(e) => setLogin(e.target.value)} placeholder="Логин, если есть анкета"
                className="w-full rounded-full px-5 py-3 text-[#1a1a1a] text-[15px] outline-none border border-[#e2e2e6] focus:border-[#FF6A3D] transition-colors placeholder-[#9a9aa2]" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email"
                className="w-full rounded-full px-5 py-3 text-[#1a1a1a] text-[15px] outline-none border border-[#e2e2e6] focus:border-[#FF6A3D] transition-colors placeholder-[#9a9aa2]" />

              <div>
                <textarea value={message} maxLength={MAX_MSG} rows={4}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Опиши проблему и какие шаги приводят к её появлению"
                  className="w-full rounded-2xl px-5 py-3.5 text-[#1a1a1a] text-[15px] outline-none border border-[#e2e2e6] focus:border-[#FF6A3D] transition-colors placeholder-[#9a9aa2] resize-none leading-snug" />
                <div className="flex items-center justify-between mt-1 px-1">
                  <span className="text-[#9a9aa2] text-[11px]">Поддержка осуществляется на английском и русском языках</span>
                  <span className="text-[#9a9aa2] text-[11px]">{MAX_MSG - message.length}</span>
                </div>
              </div>

              {/* Прикрепить изображение */}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif" onChange={pickImage} className="hidden" />
              {image ? (
                <div className="relative mx-auto">
                  <img src={image} alt="Вложение" className="max-h-40 rounded-xl object-contain border border-[#e2e2e6]" />
                  <button onClick={() => { setImage(null); if (fileRef.current) fileRef.current.value = ""; }}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center shadow-md">
                    <Icon name="X" size={13} />
                  </button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()}
                  className="flex items-center justify-center gap-2 py-1 text-[#FF6A3D] font-semibold text-sm active:opacity-70">
                  <Icon name="Camera" size={16} />
                  Прикрепить изображение
                </button>
              )}
              {imgErr && <p className="text-red-500 text-xs text-center">{imgErr}</p>}

              <p className="text-[#b4b4bc] text-[11px] text-center leading-relaxed px-2">
                Одновременно можно приложить не более 1 изображения.<br />
                Формат изображения должен быть JPG, PNG или GIF.<br />
                Размеры изображения не должны быть менее 100 × 100 точек и более 5 МБ.
              </p>

              {error && <p className="text-red-500 text-xs text-center">{error}</p>}

              <button onClick={submit} disabled={!canSend}
                className="w-full py-3.5 rounded-full font-semibold text-[15px] transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
                style={canSend
                  ? { background: "linear-gradient(135deg,#FF6A3D,#FF2D78)", color: "#fff" }
                  : { background: "#e6e6ea", color: "#a0a0a8" }}>
                {sending ? <><Icon name="Loader2" size={16} className="animate-spin" /> Отправка...</> : "Отправить"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SupportModal;
