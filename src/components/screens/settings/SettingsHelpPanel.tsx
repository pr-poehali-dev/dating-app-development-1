import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { profilesApi } from "@/lib/api";

type HelpSub = "" | "support" | "faq" | "rules" | "privacy";
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

interface Props {
  screen: string;
}

export function SettingsHelpPanel({ screen }: Props) {
  const [helpSub, setHelpSub] = useState<HelpSub>("");

  // Support chat state
  const [supportMsg, setSupportMsg] = useState("");
  const [supportSending, setSupportSending] = useState(false);
  const [supportSent, setSupportSent] = useState(false);
  const [supportTickets, setSupportTickets] = useState<Ticket[]>([]);
  const [supportLoading, setSupportLoading] = useState(false);

  useEffect(() => {
    if (helpSub === "support") {
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
            { icon: "MessageCircle", title: "Написать в поддержку",      sub: "Ответим в течение 24 часов",         id: "support"  },
            { icon: "BookOpen",      title: "Частые вопросы",             sub: "Ответы на популярные вопросы",       id: "faq"      },
            { icon: "FileText",      title: "Правила сообщества",         sub: "Как мы обеспечиваем безопасность",   id: "rules"    },
            { icon: "Shield",        title: "Политика конфиденциальности",sub: "Как мы работаем с данными",          id: "privacy"  },
            { icon: "Info",          title: "О приложении",               sub: "LoveBloom v1.0",                     id: ""         },
          ] as const).map((item) => (
            <button key={item.title}
              onClick={() => item.id && setHelpSub(item.id as HelpSub)}
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

      {/* ── Написать в поддержку ── */}
      {helpSub === "support" && (
        <div className="px-5 flex flex-col gap-4">
          <button onClick={() => setHelpSub("")} className="flex items-center gap-2 text-white/50 text-sm mb-1 -ml-1">
            <Icon name="ChevronLeft" size={18} /> Назад
          </button>

          <div className="flex items-center gap-3 px-1">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,45,120,0.12)" }}>
              <Icon name="MessageCircle" size={20} className="text-pink-400" />
            </div>
            <div>
              <p className="text-white font-bold">Поддержка LoveBloom</p>
              <p className="text-white/40 text-xs">Ответим на ваш вопрос</p>
            </div>
          </div>

          {supportLoading && (
            <div className="flex justify-center py-6"><Icon name="Loader2" size={24} className="text-white/30 animate-spin" /></div>
          )}
          {!supportLoading && supportTickets.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-white/40 text-xs font-semibold uppercase tracking-wide px-1">Ваши обращения</p>
              {supportTickets.map(t => (
                <div key={t.id} className="glass-card p-4 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(255,45,120,0.12)" }}>
                      <Icon name="User" size={13} className="text-pink-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white/80 text-sm leading-relaxed">{t.message}</p>
                      <p className="text-white/30 text-[11px] mt-1">{new Date(t.created_at).toLocaleDateString("ru", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                  {t.reply ? (
                    <div className="flex items-start gap-3 pl-2"
                      style={{ borderLeft: "2px solid rgba(255,45,120,0.3)" }}>
                      <div className="flex-1">
                        <p className="text-pink-300 text-xs font-semibold mb-1">Ответ поддержки</p>
                        <p className="text-white/70 text-sm leading-relaxed">{t.reply}</p>
                        <p className="text-white/30 text-[11px] mt-1">{t.replied_at ? new Date(t.replied_at).toLocaleDateString("ru", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) : ""}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(255,200,0,0.08)" }}>
                      <Icon name="Clock" size={13} className="text-yellow-400/70" />
                      <p className="text-yellow-400/70 text-xs">Ожидает ответа</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="glass-card p-4 flex flex-col gap-3">
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wide">Новое обращение</p>
            {supportSent ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(74,222,128,0.15)" }}>
                  <Icon name="Check" size={22} className="text-green-400" />
                </div>
                <p className="text-white font-semibold">Сообщение отправлено!</p>
                <p className="text-white/40 text-sm text-center">Мы ответим как можно скорее. Ответ появится выше.</p>
                <button onClick={() => { setSupportSent(false); setSupportMsg(""); }}
                  className="text-pink-400 text-sm font-semibold">Написать ещё</button>
              </div>
            ) : (
              <>
                <textarea
                  value={supportMsg}
                  onChange={e => setSupportMsg(e.target.value)}
                  placeholder="Опишите вашу проблему или вопрос..."
                  rows={4}
                  className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none resize-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
                <p className="text-white/25 text-xs text-right">{supportMsg.length}/2000</p>
                <button
                  disabled={supportSending || supportMsg.trim().length < 5}
                  onClick={async () => {
                    setSupportSending(true);
                    try {
                      const r = await profilesApi.supportSend(supportMsg.trim());
                      if (r.ok) {
                        setSupportSent(true);
                        setSupportTickets(prev => [{ id: r.ticket_id, message: supportMsg.trim(), reply: null, status: "open", created_at: r.created_at, replied_at: null }, ...prev]);
                      }
                    } catch { void 0; } finally { setSupportSending(false); }
                  }}
                  className="btn-grad w-full py-3 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                  {supportSending
                    ? <><Icon name="Loader2" size={15} className="animate-spin" />Отправка...</>
                    : <><Icon name="Send" size={15} />Написать письмо</>}
                </button>
              </>
            )}
          </div>
        </div>
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
                <p className="text-white/40 text-xs">Обновлено: январь 2025</p>
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