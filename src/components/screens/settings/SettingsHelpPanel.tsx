import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { profilesApi } from "@/lib/api";

type HelpSub = "" | "support" | "ticket" | "faq" | "rules" | "privacy";
type Ticket = { id: number; message: string; reply: string | null; status: string; created_at: string; replied_at: string | null };

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-card overflow-hidden transition-all">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left">
        <p className="text-white/85 text-sm font-medium flex-1">{q}</p>
        <Icon name={open ? "ChevronUp" : "ChevronDown"} size={16} className="text-white/30 flex-shrink-0" />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0">
          <p className="text-white/55 text-xs leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

function formatTime(iso: string) {
  return new Date(iso.endsWith("Z") ? iso : iso + "Z").toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
}

function SupportTickets({ tickets, loading, onBack, onNewTicket }: {
  tickets: Ticket[];
  loading: boolean;
  onBack: () => void;
  onNewTicket: (t: Ticket) => void;
}) {
  const [view, setView] = useState<"list" | "new">("list");
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const send = async () => {
    const text = msg.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const r = await profilesApi.supportSend(text);
      if (r.ok) {
        onNewTicket({ id: r.ticket_id, message: text, reply: null, status: "open", created_at: r.created_at, replied_at: null });
        setMsg("");
        setSent(true);
        setTimeout(() => { setSent(false); setView("list"); }, 1800);
      }
    } catch { void 0; } finally { setSending(false); }
  };

  // ── Форма нового тикета ──
  if (view === "new") {
    return (
      <div className="flex flex-col px-5 gap-4">
        <button onClick={() => setView("list")} className="flex items-center gap-1.5 text-white/50 text-sm -ml-1 self-start">
          <Icon name="ChevronLeft" size={18} /> Назад
        </button>

        <div className="flex flex-col gap-1">
          <h3 className="text-white font-bold text-lg">Новый тикет</h3>
          <p className="text-white/40 text-xs">Опишите проблему подробно — мы ответим в течение 24 часов</p>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <div className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", boxShadow: "0 6px 20px rgba(34,197,94,0.4)" }}>
              <Icon name="Check" size={26} className="text-white" />
            </div>
            <p className="text-white font-semibold">Тикет отправлен!</p>
            <p className="text-white/40 text-sm text-center">Ответ появится в списке тикетов</p>
          </div>
        ) : (
          <>
            <textarea
              value={msg}
              onChange={e => setMsg(e.target.value)}
              placeholder="Опишите вашу проблему..."
              rows={6}
              className="w-full rounded-2xl px-4 py-3.5 text-sm text-white placeholder-white/30 outline-none resize-none"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
            <button
              onClick={send}
              disabled={sending || msg.trim().length < 10}
              className="btn-grad py-3.5 text-sm font-semibold rounded-2xl disabled:opacity-40 flex items-center justify-center gap-2">
              {sending
                ? <><Icon name="Loader2" size={16} className="text-white animate-spin" /> Отправка...</>
                : <><Icon name="Send" size={16} className="text-white" /> Отправить тикет</>}
            </button>
          </>
        )}
      </div>
    );
  }

  // ── Список тикетов ──
  return (
    <div className="flex flex-col px-5 gap-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-white/50 text-sm -ml-1">
          <Icon name="ChevronLeft" size={18} /> Назад
        </button>
        <button onClick={() => setView("new")}
          className="btn-grad px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5">
          <Icon name="Plus" size={13} className="text-white" /> Новый тикет
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-white font-bold text-lg">Мои обращения</h3>
        <p className="text-white/40 text-xs">История ваших тикетов в поддержку</p>
      </div>

      {loading && (
        <div className="flex justify-center py-10">
          <Icon name="Loader2" size={24} className="text-white/30 animate-spin" />
        </div>
      )}

      {!loading && tickets.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-12">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Icon name="Inbox" size={24} className="text-white/25" />
          </div>
          <p className="text-white/40 text-sm">Обращений пока нет</p>
          <button onClick={() => setView("new")}
            className="btn-grad px-5 py-2.5 text-sm font-semibold rounded-xl">
            Создать первый тикет
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {tickets.map(t => (
          <div key={t.id} className="rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {/* Вопрос */}
            <div className="px-4 py-3 flex items-start gap-3"
              style={{ borderBottom: t.reply || t.status === "open" ? "1px solid rgba(255,255,255,0.07)" : undefined }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
                <Icon name="User" size={13} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/85 text-sm leading-relaxed">{t.message}</p>
                <p className="text-white/30 text-[11px] mt-1">{formatTime(t.created_at)}</p>
              </div>
            </div>
            {/* Ответ или ожидание */}
            {t.reply ? (
              <div className="px-4 py-3 flex items-start gap-3"
                style={{ background: "rgba(255,45,120,0.05)" }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: "rgba(255,45,120,0.15)", border: "1px solid rgba(255,45,120,0.3)" }}>
                  <Icon name="Headphones" size={13} className="text-pink-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-pink-400 text-[11px] font-semibold mb-0.5">Поддержка</p>
                  <p className="text-white/80 text-sm leading-relaxed">{t.reply}</p>
                  {t.replied_at && <p className="text-white/30 text-[11px] mt-1">{formatTime(t.replied_at)}</p>}
                </div>
              </div>
            ) : (
              <div className="px-4 py-2.5 flex items-center gap-2">
                <Icon name="Clock" size={13} className="text-yellow-400/60" />
                <span className="text-yellow-400/60 text-xs">Ожидает ответа администратора</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface Props {
  screen: string;
}

export function SettingsHelpPanel({ screen }: Props) {
  const [helpSub, setHelpSub] = useState<HelpSub>("");

  const [supportTickets, setSupportTickets] = useState<Ticket[]>([]);
  const [supportLoading, setSupportLoading] = useState(false);

  useEffect(() => {
    if (helpSub === "ticket") {
      setSupportLoading(true);
      profilesApi.supportMyTickets().then(r => setSupportTickets(r.tickets)).catch(() => {}).finally(() => setSupportLoading(false));
    }
  }, [helpSub]);

  if (screen !== "help") return null;

  return (
    <>
      {/* ── Меню помощи ── */}
      {helpSub === "" && (
        <div className="px-5 flex flex-col gap-3">
          {([
            { icon: "MessageCircle", title: "Написать в поддержку",      sub: "Ответим в течение 24 часов",         id: "ticket"   },
            { icon: "BookOpen",      title: "Частые вопросы",             sub: "Ответы на популярные вопросы",       id: "faq"      },
            { icon: "FileText",      title: "Правила сообщества",         sub: "Как мы обеспечиваем безопасность",   id: "rules"    },
            { icon: "Shield",        title: "Политика конфиденциальности",sub: "Как мы работаем с данными",          id: "privacy"  },
            { icon: "Info",          title: "О приложении",               sub: "LoveBloom v1.0",                     id: ""         },
          ] as const).map((item) => (
            <button key={item.title}
              onClick={() => { if (item.id) setHelpSub(item.id as HelpSub); }}
              className="glass-card flex items-center gap-4 px-4 py-3.5 w-full text-left active:bg-white/5 transition-colors">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,45,120,0.12)" }}>
                <Icon name={item.icon} size={18} className="text-pink-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/85 text-sm">{item.title}</p>
                <p className="text-white/35 text-xs mt-0.5">{item.sub}</p>
              </div>
              {item.id && <Icon name="ChevronRight" size={15} className="text-white/25 flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}

      {/* ── Тикеты поддержки ── */}
      {helpSub === "ticket" && (
        <SupportTickets
          tickets={supportTickets}
          loading={supportLoading}
          onBack={() => setHelpSub("")}
          onNewTicket={(t) => setSupportTickets(prev => [t, ...prev])}
        />
      )}

      {/* ── Частые вопросы ── */}
      {helpSub === "faq" && (
        <div className="px-5 flex flex-col gap-3">
          <button onClick={() => setHelpSub("")} className="flex items-center gap-2 text-white/50 text-sm mb-1 -ml-1">
            <Icon name="ChevronLeft" size={18} /> Назад
          </button>
          {([
            { q: "Как работает система совпадений?", a: "Совпадение (матч) происходит когда вы оба поставили друг другу лайк. После этого открывается чат и вы можете общаться." },
            { q: "Как изменить фото профиля?", a: "Перейдите в раздел Профиль → нажмите на своё фото → выберите новое из галереи или сделайте снимок. Размер до 10 МБ." },
            { q: "Что такое приватные фото?", a: "Приватные фото видны только тем, кому вы открыли доступ. Запросить доступ можно через меню в чате — кнопка «…»." },
            { q: "Как получить Премиум?", a: "Нажмите кнопку 💎 Премиум в профиле. Премиум даёт безлимитные лайки, суперлайки, невидимый режим и приоритет в поиске." },
            { q: "Как отправить голосовое сообщение?", a: "В чате нажмите на иконку микрофона справа от поля ввода. Держите кнопку — запись идёт, отпустите — отправится." },
            { q: "Мой профиль могут видеть все?", a: "Нет. Настройте видимость в Настройки → Конфиденциальность: можно скрыть онлайн-статус, расстояние и убрать профиль из поиска." },
            { q: "Как пожаловаться на пользователя?", a: "Откройте профиль пользователя → нажмите «…» в правом верхнем углу → Пожаловаться. Жалобы рассматриваются в течение 48 часов." },
            { q: "Как удалить аккаунт?", a: "Настройки → Аккаунт → Удалить аккаунт. Данные удаляются необратимо в течение 30 дней." },
          ] as const).map((item, i) => (
            <FaqItem key={i} q={item.q} a={item.a} />
          ))}
        </div>
      )}

      {/* ── Правила сообщества ── */}
      {helpSub === "rules" && (
        <div className="px-5 flex flex-col gap-4">
          <button onClick={() => setHelpSub("")} className="flex items-center gap-2 text-white/50 text-sm mb-1 -ml-1">
            <Icon name="ChevronLeft" size={18} /> Назад
          </button>
          <div className="glass-card p-5 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,45,120,0.12)" }}>
                <Icon name="FileText" size={22} className="text-pink-400" />
              </div>
              <div>
                <p className="text-white font-bold text-base">Правила сообщества</p>
                <p className="text-white/40 text-xs">Обновлено: 5 мая 2026</p>
              </div>
            </div>
            {([
              { icon: "Heart", title: "Уважение и вежливость", text: "Общайтесь так, как хотите, чтобы общались с вами. Оскорбления, харассмент и агрессивное поведение ведут к немедленной блокировке." },
              { icon: "Shield", title: "Достоверность профиля", text: "Используйте только свои реальные фотографии. Запрещены чужие фото, фото знаменитостей, аниме и персонажей. Профиль должен отражать реальный облик." },
              { icon: "Lock", title: "Запрещённый контент", text: "Строго запрещены: материалы 18+ в публичных постах, насилие, экстремизм, пропаганда ненависти, спам и реклама сторонних сервисов." },
              { icon: "UserCheck", title: "Один аккаунт", text: "Создание нескольких аккаунтов для обхода блокировок запрещено. Мультиаккаунты удаляются без предупреждения." },
              { icon: "MessageSquare", title: "Честное общение", text: "Не вводите людей в заблуждение относительно своих намерений, внешности или личных данных. Мошенничество и манипуляции недопустимы." },
              { icon: "AlertTriangle", title: "Нарушения и последствия", text: "За нарушения: предупреждение → временная блокировка → перманентный бан. Тяжкие нарушения (мошенничество, CSAM) — бан без предупреждения с уведомлением властей." },
            ] as const).map((rule) => (
              <div key={rule.title} className="flex gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(255,45,120,0.1)" }}>
                  <Icon name={rule.icon as "Heart"|"Shield"|"Lock"|"UserCheck"|"MessageSquare"|"AlertTriangle"} size={15} className="text-pink-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{rule.title}</p>
                  <p className="text-white/55 text-xs leading-relaxed mt-1">{rule.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Политика конфиденциальности ── */}
      {helpSub === "privacy" && (
        <div className="px-5 flex flex-col gap-4">
          <button onClick={() => setHelpSub("")} className="flex items-center gap-2 text-white/50 text-sm mb-1 -ml-1">
            <Icon name="ChevronLeft" size={18} /> Назад
          </button>
          <div className="glass-card p-5 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(99,179,237,0.12)" }}>
                <Icon name="Shield" size={22} className="text-blue-400" />
              </div>
              <div>
                <p className="text-white font-bold text-base">Политика конфиденциальности</p>
                <p className="text-white/40 text-xs">Редакция от 1 января 2025 г.</p>
              </div>
            </div>
            {([
              { title: "1. Какие данные мы собираем", text: "При регистрации: имя, дата рождения, номер телефона или email, фотографии. В процессе использования: геолокация (приблизительная), логи активности, переписка, фото и видео которые вы публикуете." },
              { title: "2. Как мы используем данные", text: "Данные нужны для: показа подходящих анкет, работы чата и уведомлений, верификации личности, предотвращения мошенничества. Мы не продаём данные третьим лицам." },
              { title: "3. Хранение и защита", text: "Все данные хранятся на серверах в России. Соединение защищено TLS 1.3. Пароли хранятся в виде хешей (bcrypt). Фотографии хранятся в зашифрованном облачном хранилище." },
              { title: "4. Геолокация", text: "Геолокация используется только для расчёта расстояния между пользователями. Точные координаты никогда не передаются другим пользователям — только округлённое расстояние (например, «в 2 км»)." },
              { title: "5. Передача данных", text: "Данные могут передаваться: платёжным системам (только для проведения транзакций), органам власти по официальному запросу. Аналитика — только в обезличенном виде." },
              { title: "6. Ваши права", text: "Вы вправе: запросить копию своих данных, исправить неточные данные, удалить аккаунт со всеми данными (срок исполнения — 30 дней), отозвать согласие на обработку данных." },
              { title: "7. Файлы cookie", text: "Мы используем технические cookie для авторизации и сессий. Аналитические cookie используются только с вашего согласия и могут быть отключены в настройках браузера." },
              { title: "8. Контакты", text: "По вопросам обработки персональных данных: privacy@lovebloom.app. Ответ предоставляется в течение 10 рабочих дней." },
            ] as const).map((section) => (
              <div key={section.title}>
                <p className="text-white font-semibold text-sm mb-1">{section.title}</p>
                <p className="text-white/55 text-xs leading-relaxed">{section.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default SettingsHelpPanel;