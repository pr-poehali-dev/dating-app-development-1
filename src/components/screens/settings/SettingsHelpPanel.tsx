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

function SupportTickets({ tickets, loading, onBack, onNewTicket, onDeleteTicket }: {
  tickets: Ticket[];
  loading: boolean;
  onBack: () => void;
  onNewTicket: (t: Ticket) => void;
  onDeleteTicket: (id: number) => void;
}) {
  const [view, setView] = useState<"list" | "new">("list");
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const closeTicket = async (id: number) => {
    setDeletingId(id);
    try {
      const r = await profilesApi.supportDelete(id);
      if (r.ok) onDeleteTicket(id);
    } catch { void 0; } finally { setDeletingId(null); }
  };

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
              <button
                onClick={() => closeTicket(t.id)}
                disabled={deletingId === t.id}
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white/40 hover:text-red-400 transition-colors disabled:opacity-40"
                title="Закрыть обращение">
                <Icon name={deletingId === t.id ? "Loader2" : "Trash2"} size={14}
                  className={deletingId === t.id ? "animate-spin" : ""} />
              </button>
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
          onDeleteTicket={(id) => setSupportTickets(prev => prev.filter(t => t.id !== id))}
        />
      )}

      {/* ── Частые вопросы ── */}
      {helpSub === "faq" && (
        <div className="px-5 flex flex-col gap-3">
          <button onClick={() => setHelpSub("")} className="flex items-center gap-2 text-white/50 text-sm mb-1 -ml-1">
            <Icon name="ChevronLeft" size={18} /> Назад
          </button>
          {([
            { q: "Как работает система совпадений?", a: "Совпадение (матч) происходит когда вы оба поставили друг другу лайк. После этого автоматически открывается чат, и вы можете начать общение. Пока второй человек не ответил взаимностью — он не видит, что вы его лайкнули." },
            { q: "Чем суперлайк отличается от обычного лайка?", a: "Обычный лайк виден только при взаимной симпатии. Суперлайк сразу уведомляет человека о вашем интересе и поднимает вашу анкету выше в его ленте, повышая шанс на матч. Суперлайки доступны в Премиуме и пополняются ежедневно." },
            { q: "Как изменить фото профиля?", a: "Перейдите в раздел Профиль → нажмите на своё фото → выберите новое из галереи или сделайте снимок. Можно загрузить несколько фото. Поддерживаются форматы JPG и PNG, размер до 10 МБ." },
            { q: "Что такое приватные фото?", a: "Приватные фото видны только тем, кому вы лично открыли доступ. Запросить или предоставить доступ можно через меню в чате — кнопка «…». В любой момент доступ можно отозвать." },
            { q: "Что даёт Премиум-подписка?", a: "Премиум открывает: безлимитные лайки, ежедневные суперлайки, невидимый (инкогнито) режим, просмотр тех, кто вас уже лайкнул, приоритет в поиске и расширенные фильтры. Оформить можно по кнопке 💎 Премиум в профиле." },
            { q: "Как пройти верификацию профиля?", a: "Профиль → Верификация → сделайте селфи по образцу на экране. Модерация занимает до 24 часов. Верифицированные профили получают значок «галочка», вызывают больше доверия и чаще получают лайки." },
            { q: "Как отправить голосовое сообщение?", a: "В чате нажмите и удерживайте иконку микрофона справа от поля ввода — пока держите, идёт запись. Отпустите для отправки. Чтобы отменить запись, проведите пальцем в сторону, не отпуская." },
            { q: "Как удалить сообщение в чате?", a: "Проведите по сообщению влево — появится иконка корзины, и сообщение удалится. Также можно нажать и удержать сообщение, чтобы открыть меню с действиями." },
            { q: "Что такое прямые эфиры (Live)?", a: "Live — это видеотрансляции пользователей в реальном времени. Вы можете смотреть чужие эфиры, общаться в чате трансляции, отправлять подарки или запустить собственный эфир через раздел Live." },
            { q: "Мой профиль могут видеть все?", a: "Вы управляете видимостью в Настройки → Конфиденциальность: можно скрыть онлайн-статус, расстояние и полностью убрать профиль из поиска. В невидимом режиме (Премиум) вас видят только те, кому вы сами поставили лайк." },
            { q: "Как пожаловаться на пользователя?", a: "Откройте профиль пользователя → нажмите «…» в правом верхнем углу → Пожаловаться, и выберите причину. Все жалобы рассматриваются модерацией в течение 48 часов, заявитель остаётся анонимным." },
            { q: "Как заблокировать пользователя?", a: "В чате или профиле нажмите «…» → Заблокировать. После блокировки человек не сможет писать вам, видеть ваш профиль и появляться в вашей ленте. Снять блокировку можно в Настройки → Заблокированные." },
            { q: "Почему мне не приходят уведомления?", a: "Проверьте, что уведомления разрешены в настройках вашего телефона для приложения, а также включены внутри приложения: Настройки → Уведомления. В энергосберегающем режиме телефон может задерживать доставку push-уведомлений." },
            { q: "Безопасно ли встречаться с людьми из приложения?", a: "Первую встречу назначайте в людном общественном месте, сообщите близким, куда идёте, и не передавайте деньги и личные документы. Никогда не отправляйте предоплату или переводы — это главный признак мошенничества." },
            { q: "Как удалить аккаунт?", a: "Настройки → Аккаунт → Удалить аккаунт. Аккаунт деактивируется сразу, а все персональные данные удаляются необратимо в течение 30 дней в соответствии с законодательством." },
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
                <p className="text-white/40 text-xs">Редакция от 5 мая 2026 г.</p>
              </div>
            </div>

            <p className="text-white/55 text-xs leading-relaxed">
              Настоящие Правила сообщества (далее — «Правила») регулируют поведение пользователей сервиса LoveBloom (далее — «Сервис»). Регистрируясь и используя Сервис, вы подтверждаете согласие соблюдать настоящие Правила в полном объёме. Нарушение Правил влечёт ответственность вплоть до ограничения или прекращения доступа к Сервису.
            </p>

            {([
              { icon: "UserCheck", title: "1. Возрастные ограничения", text: "1.1. Регистрация и использование Сервиса разрешены исключительно лицам, достигшим 18 (восемнадцати) полных лет.\n1.2. Указание заведомо ложного возраста является грубым нарушением и влечёт немедленную блокировку аккаунта.\n1.3. При обоснованных сомнениях в возрасте Сервис вправе запросить документ, удостоверяющий личность, и приостановить доступ до прохождения проверки." },
              { icon: "Heart", title: "2. Уважение и вежливость", text: "2.1. Пользователи обязаны общаться корректно, уважая достоинство друг друга.\n2.2. Запрещены оскорбления, угрозы, домогательства (харассмент), травля, дискриминация по любому признаку (раса, национальность, пол, религия, ориентация, состояние здоровья).\n2.3. Навязчивые сообщения после явного отказа собеседника от общения рассматриваются как харассмент." },
              { icon: "Shield", title: "3. Достоверность профиля", text: "3.1. Пользователь обязан размещать только собственные реальные фотографии и достоверные сведения о себе.\n3.2. Запрещено использование чужих фотографий, изображений знаменитостей, вымышленных персонажей, а также изображений, сгенерированных с целью введения в заблуждение.\n3.3. Создание профиля от имени другого лица (выдача себя за иное лицо) категорически запрещено." },
              { icon: "Lock", title: "4. Запрещённый контент", text: "4.1. Строго запрещены к публикации в открытом доступе: материалы порнографического характера и иные материалы 18+, сцены насилия и жестокости.\n4.2. Запрещены экстремистские материалы, пропаганда терроризма, разжигание ненависти и вражды.\n4.3. Запрещены пропаганда и сбыт наркотических средств, оружия, а также призывы к суициду и членовредительству.\n4.4. Запрещены спам, массовые рассылки и реклама сторонних товаров, услуг и сервисов." },
              { icon: "Ban", title: "5. Запрет коммерческой деятельности", text: "5.1. Сервис предназначен исключительно для личного знакомства и общения.\n5.2. Запрещено использование Сервиса для оказания услуг интимного характера, эскорта, а также любой иной коммерческой деятельности.\n5.3. Запрещены любые формы попрошайничества и выманивания денежных средств у других пользователей." },
              { icon: "ShieldAlert", title: "6. Запрет мошенничества", text: "6.1. Категорически запрещены любые мошеннические действия, в том числе финансовые («скам»), фишинг и социальная инженерия.\n6.2. Запрещено выманивание денег, реквизитов банковских карт, паролей и кодов из СМС.\n6.3. Сервис никогда не запрашивает у пользователей переводы средств. Любые подобные требования от иных пользователей являются мошенничеством и подлежат немедленной жалобе." },
              { icon: "Users", title: "7. Один аккаунт", text: "7.1. Каждому пользователю разрешено иметь только один действующий аккаунт.\n7.2. Создание дополнительных аккаунтов с целью обхода блокировки или ограничений запрещено.\n7.3. Аккаунты, признанные дублирующими, удаляются без предварительного уведомления." },
              { icon: "ShieldCheck", title: "8. Защита несовершеннолетних", text: "8.1. Сервис применяет политику абсолютной нетерпимости (zero tolerance) к любым материалам, эксплуатирующим несовершеннолетних (CSAM).\n8.2. Любая подобная активность влечёт незамедлительную перманентную блокировку, сохранение данных и передачу информации в компетентные правоохранительные органы." },
              { icon: "Flag", title: "9. Жалобы и модерация", text: "9.1. Пользователь вправе пожаловаться на любой контент или поведение через функцию «Пожаловаться».\n9.2. Личность заявителя не раскрывается нарушителю.\n9.3. Жалобы рассматриваются модерацией в срок до 48 часов. Сервис вправе запрашивать дополнительные сведения для проверки." },
              { icon: "AlertTriangle", title: "10. Нарушения и санкции", text: "10.1. В зависимости от тяжести нарушения применяются: предупреждение → временное ограничение функций → временная блокировка → перманентная блокировка аккаунта.\n10.2. За грубые нарушения (мошенничество, насилие, CSAM, угрозы) блокировка применяется немедленно, без предупреждения.\n10.3. Решение модерации может быть обжаловано через службу поддержки в течение 14 дней." },
              { icon: "Scale", title: "11. Заключительные положения", text: "11.1. Сервис вправе в одностороннем порядке изменять настоящие Правила, уведомляя пользователей о существенных изменениях.\n11.2. Продолжение использования Сервиса после вступления изменений в силу означает согласие с новой редакцией Правил.\n11.3. По всем вопросам обращайтесь в службу поддержки: myinfo@poluto-n.ru." },
            ] as const).map((rule) => (
              <div key={rule.title} className="flex gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(255,45,120,0.1)" }}>
                  <Icon name={rule.icon} size={15} className="text-pink-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{rule.title}</p>
                  <p className="text-white/55 text-xs leading-relaxed mt-1 whitespace-pre-line">{rule.text}</p>
                </div>
              </div>
            ))}

            <p className="text-white/35 text-[11px] leading-relaxed border-t border-white/10 pt-4">
              Используя Сервис LoveBloom, вы подтверждаете, что ознакомились с настоящими Правилами, понимаете их и обязуетесь соблюдать. Незнание Правил не освобождает от ответственности за их нарушение.
            </p>
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
                <p className="text-white/40 text-xs">Редакция от 5 мая 2026 г.</p>
              </div>
            </div>
            {([
              { title: "1. Какие данные мы собираем", text: "При регистрации: имя, дата рождения, email, фотография профиля, город, пол, описание («о себе»), теги интересов. В процессе использования: приблизительная геолокация (для расчёта расстояния), история лайков и совпадений, переписка в чатах, публикуемые фото и видео (посты, истории), данные о просмотре прямых эфиров." },
              { title: "2. Как мы используем данные", text: "Данные используются для: показа подходящих анкет и ленты знакомств, работы чата и push-уведомлений, верификации личности, предотвращения мошенничества и злоупотреблений, обработки платежей за Premium-подписку. Мы не продаём личные данные третьим лицам." },
              { title: "3. Хранение и защита", text: "Все данные хранятся на серверах в России. Соединение защищено TLS 1.3. Пароли хранятся исключительно в виде хешей (bcrypt) — в открытом виде не хранятся никогда. Фотографии и видео хранятся в облачном хранилище с закрытым доступом." },
              { title: "4. Геолокация", text: "Геолокация используется только для расчёта приблизительного расстояния между пользователями. Точные координаты никогда не передаются другим пользователям — отображается только округлённое расстояние (например, «в 3 км»). Вы можете отключить геолокацию в настройках устройства." },
              { title: "5. Передача данных третьим лицам", text: "Данные могут передаваться: платёжной системе ЮKassa (только необходимые данные для проведения транзакций), органам государственной власти — исключительно по официальному запросу в соответствии с законодательством РФ. Аналитика используется только в обезличённом, агрегированном виде." },
              { title: "6. Ваши права", text: "В соответствии с Федеральным законом № 152-ФЗ вы вправе: получить копию своих персональных данных, исправить неточные или устаревшие данные, удалить аккаунт вместе со всеми данными (срок исполнения — 30 дней), отозвать согласие на обработку персональных данных." },
              { title: "7. Сессии и авторизация", text: "Для авторизации используются токены сессий, хранящиеся в localStorage вашего браузера. Сессия активна до явного выхода из аккаунта или истечения срока действия токена. Сторонние аналитические трекеры не используются." },
              { title: "8. Контакты", text: "По вопросам обработки персональных данных обращайтесь: myinfo@poluto-n.ru. Ответ предоставляется в течение 10 рабочих дней." },
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