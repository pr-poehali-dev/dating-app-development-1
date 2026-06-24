import { useState } from "react";
import Icon from "@/components/ui/icon";
import { authApi, type User } from "@/lib/api";
import { ForgotPasswordModal } from "./ForgotPasswordModal";

export function AuthScreen({ onAuth }: { onAuth: (user: User) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [rulesTab, setRulesTab] = useState<"terms" | "privacy">("terms");
  const [emailTaken, setEmailTaken] = useState(false);

  const submit = async () => {
    setError("");
    setEmailTaken(false);
    setLoading(true);
    try {
      let result;
      if (mode === "register") {
        if (!name.trim()) { setError("Введи своё имя"); setLoading(false); return; }
        result = await authApi.register(email, password, name);
      } else {
        result = await authApi.login(email, password);
      }
      onAuth(result.user);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка";
      if (mode === "register" && msg.toLowerCase().includes("уже занят")) {
        setEmailTaken(true);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full text-white placeholder-white/40 rounded-2xl px-4 py-3.5 text-sm outline-none border transition-colors font-golos"
    + " focus:border-pink-500/60"
    + " border-white/20";

  return (
    <>
    {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}

    {/* Фоновое изображение */}
    <div className="absolute inset-0 z-0">
      <img
        src="https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/4d4aa1bd-fe2c-46ae-b734-3f14fcfaced6.jpg"
        className="w-full h-full object-cover"
        style={{ opacity: 0.45 }}
      />
      {/* Градиентный оверлей снизу */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(26,22,37,0.3) 0%, rgba(26,22,37,0.7) 45%, rgba(26,22,37,0.98) 75%)" }} />
    </div>

    <div className="relative z-10 flex flex-col h-full">

      {/* Верхняя часть — лого по центру */}
      <div className="flex-1 flex flex-col items-center justify-end pb-8 px-6">
        {/* Иконка приложения */}
        <div className="mb-5 relative flex items-center justify-center">
          {/* Пульсирующее свечение позади */}
          <div className="absolute rounded-3xl"
            style={{
              width: 88, height: 88,
              background: "radial-gradient(circle, rgba(255,45,120,0.55) 0%, rgba(155,89,182,0.3) 60%, transparent 80%)",
              animation: "heartbeat 1.2s ease-in-out infinite",
              filter: "blur(8px)",
            }} />
          {/* Логотип */}
          <img
            src="https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/bucket/877e412e-7952-45c5-a513-2c266868f89f.jpg"
            alt="LoveBloom"
            style={{
              width: 84, height: 84,
              borderRadius: 24,
              animation: "heartbeat 1.2s ease-in-out infinite",
              boxShadow: "0 8px 32px rgba(255,45,120,0.45)",
              position: "relative",
              zIndex: 1,
            }}
          />
        </div>

        <h1 className="font-unbounded text-white text-4xl font-black mb-2" style={{ textShadow: "0 2px 20px rgba(255,45,120,0.4)" }}>
          LoveBloom
        </h1>
        <p className="text-white/50 text-sm font-medium tracking-wide">Знакомься. Общайся. Влюбляйся.</p>
      </div>

      {/* Нижняя панель — форма */}
      <div className="flex-shrink-0 px-5 pb-8 flex flex-col gap-4">

        {/* Переключатель Вход / Регистрация */}
        <div className="flex rounded-2xl p-1" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {(["login", "register"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 py-2.5 text-sm font-semibold transition-all rounded-xl ${mode === m ? "text-white" : "text-white/40"}`}
              style={mode === m
                ? { background: "linear-gradient(135deg, #FF2D78, #9B59B6)", boxShadow: "0 2px 12px rgba(255,45,120,0.35)" }
                : undefined}>
              {m === "login" ? "Вход" : "Регистрация"}
            </button>
          ))}
        </div>

        {/* Поля */}
        <div className="flex flex-col gap-3">
          {mode === "register" && (
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                <Icon name="User" size={16} />
              </span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Твоё имя"
                className={inputCls + " pl-10"}
                style={{ background: "rgba(255,255,255,0.12)" }} />
            </div>
          )}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
              <Icon name="Mail" size={16} />
            </span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email"
              className={inputCls + " pl-10"}
              style={{ background: "rgba(255,255,255,0.12)" }} />
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
              <Icon name="Lock" size={16} />
            </span>
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Пароль"
              type={showPassword ? "text" : "password"}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              className={inputCls + " pl-10 pr-11"}
              style={{ background: "rgba(255,255,255,0.12)" }} />
            <button type="button" onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors">
              <Icon name={showPassword ? "EyeOff" : "Eye"} size={17} />
            </button>
          </div>
        </div>

        {emailTaken && (
          <div className="flex flex-col gap-2 px-4 py-3 rounded-2xl" style={{ background: "rgba(255,45,120,0.1)", border: "1px solid rgba(255,45,120,0.25)" }}>
            <div className="flex items-center gap-2">
              <Icon name="UserCheck" size={15} className="text-pink-400 flex-shrink-0" />
              <p className="text-pink-300 text-sm font-semibold">Этот email уже зарегистрирован</p>
            </div>
            <p className="text-white/50 text-xs">Аккаунт с таким email уже существует. Войди в него или восстанови пароль.</p>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => { setEmailTaken(false); setError(""); setMode("login"); }}
                className="flex-1 py-2 rounded-xl text-white text-xs font-bold"
                style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
                Войти в аккаунт
              </button>
              <button
                onClick={() => { setEmailTaken(false); setShowForgot(true); }}
                className="flex-1 py-2 rounded-xl text-white/60 text-xs font-semibold"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                Забыл пароль
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <Icon name="AlertCircle" size={15} className="text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button onClick={submit} disabled={loading}
          className="w-full py-4 rounded-2xl text-white font-bold text-base disabled:opacity-50 transition-all active:scale-95"
          style={{ background: "linear-gradient(135deg, #FF2D78 0%, #9B59B6 100%)", boxShadow: "0 4px 24px rgba(255,45,120,0.45)" }}>
          {loading
            ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin inline-block" />Загрузка...</span>
            : mode === "login" ? "Войти в аккаунт" : "Создать аккаунт"}
        </button>

        {mode === "login" && (
          <button onClick={() => setShowForgot(true)} className="text-white/35 text-xs text-center hover:text-pink-400 transition-colors">
            Забыл пароль?
          </button>
        )}

        <p className="text-white/40 text-xs text-center leading-relaxed px-2">
          Нажимая «Войти» или «Продолжить», ты соглашаешься с нашими{" "}
          <button onClick={() => { setRulesTab("terms"); setShowRules(true); }}
            className="text-white font-bold hover:text-pink-300 transition-colors">
            Условиями использования
          </button>
          {" "}и{" "}
          <button onClick={() => { setRulesTab("privacy"); setShowRules(true); }}
            className="text-white font-bold hover:text-pink-300 transition-colors">
            Политикой конфиденциальности
          </button>
          .
        </p>
      </div>
    </div>

    {/* Модальное окно — Условия и Политика */}
    {showRules && (
      <div className="fixed inset-0 z-50 flex flex-col justify-end"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
        onClick={() => setShowRules(false)}>
        <div className="w-full max-h-[92vh] flex flex-col rounded-t-3xl overflow-hidden"
          style={{ background: "linear-gradient(160deg,#1a1030,#130d22)", border: "1px solid rgba(255,255,255,0.08)" }}
          onClick={e => e.stopPropagation()}>

          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 flex-shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(255,45,120,0.12)" }}>
                <Icon name="Scale" size={19} className="text-pink-400" />
              </div>
              <div>
                <p className="text-white font-bold text-base">Правовые документы</p>
                <p className="text-white/35 text-xs">Редакция от 1 июня 2026 г.</p>
              </div>
            </div>
            <button onClick={() => setShowRules(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.07)" }}>
              <Icon name="X" size={16} className="text-white/60" />
            </button>
          </div>

          {/* Вкладки */}
          <div className="flex-shrink-0 px-5 pt-3 pb-0">
            <div className="flex rounded-2xl p-1" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.07)" }}>
              {([
                { id: "terms", label: "Условия использования" },
                { id: "privacy", label: "Политика конфиденциальности" },
              ] as const).map(tab => (
                <button key={tab.id} onClick={() => setRulesTab(tab.id)}
                  className={`flex-1 py-2 text-[11px] font-semibold transition-all rounded-xl ${rulesTab === tab.id ? "text-white" : "text-white/40"}`}
                  style={rulesTab === tab.id ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)" } : undefined}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4" style={{ scrollbarWidth: "none" }}>

            {rulesTab === "terms" && (<>
              <div className="rounded-2xl px-4 py-3" style={{ background: "rgba(255,45,120,0.08)", border: "1px solid rgba(255,45,120,0.15)" }}>
                <p className="text-pink-300 text-xs leading-relaxed">
                  Настоящие Условия использования (далее — «Условия») регулируют отношения между ООО «ЛавБлум» (далее — «Компания») и пользователями сервиса LoveBloom. Использование приложения означает полное и безоговорочное принятие Условий в соответствии со ст. 428 ГК РФ (договор присоединения).
                </p>
              </div>

              {([
                {
                  icon: "BookOpen",
                  title: "1. Общие положения",
                  items: [
                    "Сервис LoveBloom — платформа для социального общения и знакомств, доступная лицам старше 18 лет.",
                    "Компания действует в соответствии с Федеральным законом № 149-ФЗ «Об информации, информационных технологиях и о защите информации».",
                    "Регистрация в сервисе означает согласие с настоящими Условиями и Политикой конфиденциальности.",
                    "Компания вправе в одностороннем порядке изменять Условия, уведомив пользователей за 3 дня через push-уведомление или email.",
                  ]
                },
                {
                  icon: "UserCheck",
                  title: "2. Регистрация и аккаунт",
                  items: [
                    "Для регистрации необходим действующий адрес электронной почты. Предоставление ложных данных запрещено.",
                    "Пользователь обязан самостоятельно обеспечивать конфиденциальность пароля. Компания не несёт ответственности за действия, совершённые с аккаунта пользователя.",
                    "Создание более одного аккаунта запрещено. Мультиаккаунты блокируются без предупреждения.",
                    "Передача аккаунта третьим лицам запрещена.",
                    "Минимальный возраст пользователя — 18 лет. Аккаунты несовершеннолетних удаляются немедленно в соответствии с ФЗ-436.",
                  ]
                },
                {
                  icon: "Shield",
                  title: "3. Правила поведения",
                  items: [
                    "Запрещено публиковать контент, нарушающий законодательство РФ: пропаганда насилия, экстремизм, терроризм (ст. 280, 205.2 УК РФ).",
                    "Запрещена пропаганда наркотиков, суицида, ЛГБТ+ в соответствии с действующим законодательством РФ.",
                    "Запрещено распространение персональных данных третьих лиц без их согласия (ФЗ-152).",
                    "Запрещён спам, несанкционированная реклама, фишинг и мошенничество (ст. 159 УК РФ).",
                    "Запрещено использование ботов, скриптов и автоматизированных инструментов.",
                    "Запрещена публикация материалов, нарушающих авторские права (ст. 1259 ГК РФ).",
                  ]
                },
                {
                  icon: "Image",
                  title: "4. Пользовательский контент",
                  items: [
                    "Загружая контент, пользователь гарантирует наличие прав на него и предоставляет Компании неисключительную лицензию на его хранение и отображение.",
                    "Компания вправе удалить любой контент, нарушающий настоящие Условия, без предварительного уведомления.",
                    "Фотографии профиля должны изображать только самого пользователя. Использование чужих фото, изображений знаменитостей или аниме запрещено.",
                    "Контент 18+ разрешён только в разделах, помеченных соответствующим образом, при наличии верификации возраста.",
                  ]
                },
                {
                  icon: "CreditCard",
                  title: "5. Платные функции и подписка",
                  items: [
                    "Премиум-подписка оформляется на условиях публичной оферты. Оплата производится через сертифицированные платёжные системы.",
                    "Возврат средств за неиспользованный период подписки осуществляется в соответствии со ст. 32 Закона РФ «О защите прав потребителей».",
                    "Виртуальные подарки и валюта не подлежат обмену на реальные деньги.",
                    "Компания вправе изменять стоимость подписки, уведомив пользователей за 14 дней.",
                  ]
                },
                {
                  icon: "Scale",
                  title: "6. Ответственность и споры",
                  items: [
                    "Компания не несёт ответственности за содержание переписки между пользователями.",
                    "Ответственность Компании ограничена суммой, уплаченной пользователем за последние 3 месяца.",
                    "Споры разрешаются в претензионном порядке (срок ответа — 30 дней), а при недостижении согласия — в суде по месту нахождения Компании.",
                    "К отношениям применяется законодательство Российской Федерации.",
                  ]
                },
                {
                  icon: "Trash2",
                  title: "7. Блокировка и удаление",
                  items: [
                    "Компания вправе приостановить или удалить аккаунт за нарушение Условий без возмещения убытков.",
                    "Пользователь вправе самостоятельно удалить аккаунт через настройки. Данные удаляются в течение 30 дней.",
                    "При выявлении противоправных действий Компания обязана передать данные правоохранительным органам по законному запросу.",
                  ]
                },
              ] as const).map(section => (
                <div key={section.title} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(255,45,120,0.1)" }}>
                      <Icon name={section.icon as "BookOpen"|"UserCheck"|"Shield"|"Image"|"CreditCard"|"Scale"|"Trash2"} size={14} className="text-pink-400" />
                    </div>
                    <p className="text-white font-bold text-sm">{section.title}</p>
                  </div>
                  <div className="flex flex-col gap-1.5 pl-9">
                    {section.items.map((item, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-pink-500 text-xs mt-0.5 flex-shrink-0">•</span>
                        <p className="text-white/60 text-xs leading-relaxed">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="rounded-xl px-4 py-3 mt-1" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-white/35 text-[11px] leading-relaxed text-center">
                  По вопросам: <span className="text-white/55">info@lbloom.ru</span>
                </p>
              </div>
            </>)}

            {rulesTab === "privacy" && (<>
              <div className="rounded-2xl px-4 py-3" style={{ background: "rgba(155,89,182,0.08)", border: "1px solid rgba(155,89,182,0.2)" }}>
                <p className="text-purple-300 text-xs leading-relaxed">
                  Настоящая Политика конфиденциальности разработана в соответствии с требованиями Федерального закона № 152-ФЗ «О персональных данных» и описывает порядок сбора, хранения, обработки и защиты персональных данных пользователей сервиса LoveBloom.
                </p>
              </div>

              {([
                {
                  icon: "Database",
                  title: "1. Какие данные мы собираем",
                  items: [
                    "Регистрационные данные: имя, адрес электронной почты, дата рождения.",
                    "Данные профиля: фотографии, описание, город проживания, интересы.",
                    "Технические данные: IP-адрес, тип устройства, операционная система, версия приложения.",
                    "Данные геолокации — только при явном разрешении пользователя.",
                    "Данные об использовании: история действий, статистика активности, переписка.",
                    "Платёжные данные: обрабатываются исключительно платёжными системами; Компания не хранит данные карт.",
                  ]
                },
                {
                  icon: "Settings",
                  title: "2. Цели обработки данных",
                  items: [
                    "Предоставление функционала сервиса и исполнение договора (ст. 6 ФЗ-152).",
                    "Обеспечение безопасности и противодействие мошенничеству.",
                    "Улучшение алгоритмов подбора совместимых пользователей.",
                    "Направление уведомлений, связанных с работой сервиса.",
                    "Выполнение требований законодательства РФ.",
                  ]
                },
                {
                  icon: "Share2",
                  title: "3. Передача данных третьим лицам",
                  items: [
                    "Данные не продаются и не передаются третьим лицам в коммерческих целях.",
                    "Данные могут быть переданы партнёрам-обработчикам (хостинг, аналитика) на основании договоров о конфиденциальности.",
                    "Данные передаются правоохранительным органам по законному запросу в соответствии с законодательством РФ.",
                    "Агрегированные обезличенные данные могут использоваться в статистических целях.",
                  ]
                },
                {
                  icon: "Lock",
                  title: "4. Хранение и защита данных",
                  items: [
                    "Данные хранятся на серверах, расположенных на территории Российской Федерации, в соответствии с ч. 5 ст. 18 ФЗ-152.",
                    "Применяются шифрование TLS/SSL, хэширование паролей (bcrypt), контроль доступа.",
                    "Персональные данные хранятся в течение срока действия аккаунта и 30 дней после его удаления.",
                    "Резервные копии уничтожаются в течение 90 дней после удаления основных данных.",
                    "При утечке данных Компания уведомит пользователей в течение 72 часов.",
                  ]
                },
                {
                  icon: "UserCheck",
                  title: "5. Права пользователей",
                  items: [
                    "Право на доступ: запросить копию своих персональных данных (ст. 14 ФЗ-152).",
                    "Право на исправление: скорректировать неточные данные через настройки профиля.",
                    "Право на удаление: потребовать удаления данных — обрабатывается в течение 30 дней.",
                    "Право на ограничение обработки: заблокировать использование данных в маркетинговых целях.",
                    "Право на возражение: отозвать согласие на обработку данных, направив запрос на info@lbloom.ru.",
                    "Право на жалобу: обратиться в Роскомнадзор (rkn.gov.ru) при нарушении прав.",
                  ]
                },
                {
                  icon: "Cookie",
                  title: "6. Cookies и отслеживание",
                  items: [
                    "Приложение использует аналитические инструменты для улучшения работы сервиса.",
                    "Данные для входа сохраняются в защищённом хранилище устройства.",
                    "Пользователь может отозвать разрешение на геолокацию в настройках устройства.",
                    "Push-уведомления можно отключить в настройках приложения или устройства.",
                  ]
                },
                {
                  icon: "Globe",
                  title: "7. Международная передача данных",
                  items: [
                    "По умолчанию данные не передаются за пределы РФ.",
                    "При необходимости трансграничной передачи применяются стандартные договорные условия защиты данных.",
                    "Пользователи из ЕС имеют дополнительные права в соответствии с Регламентом GDPR.",
                  ]
                },
                {
                  icon: "Bell",
                  title: "8. Изменения политики",
                  items: [
                    "Компания вправе обновлять Политику конфиденциальности. Пользователи уведомляются за 7 дней.",
                    "Продолжение использования сервиса после вступления изменений в силу означает их принятие.",
                    "Актуальная версия всегда доступна в настройках приложения.",
                  ]
                },
              ] as const).map(section => (
                <div key={section.title} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(155,89,182,0.12)" }}>
                      <Icon name={section.icon as "Database"|"Settings"|"Share2"|"Lock"|"UserCheck"|"Cookie"|"Globe"|"Bell"} size={14} className="text-purple-400" />
                    </div>
                    <p className="text-white font-bold text-sm">{section.title}</p>
                  </div>
                  <div className="flex flex-col gap-1.5 pl-9">
                    {section.items.map((item, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-purple-500 text-xs mt-0.5 flex-shrink-0">•</span>
                        <p className="text-white/60 text-xs leading-relaxed">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="rounded-xl px-4 py-3 mt-1" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-white/35 text-[11px] leading-relaxed text-center">
                  Запросы по персональным данным: <span className="text-white/55">info@lbloom.ru</span>
                </p>
              </div>
            </>)}

            <button onClick={() => setShowRules(false)}
              className="w-full py-3.5 rounded-2xl text-white font-bold text-sm mt-1"
              style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
              Понятно, принимаю
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}