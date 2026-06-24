import { useState } from "react";
import Icon from "@/components/ui/icon";
import { type User } from "@/lib/api";

const FALLBACK_PHOTO = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/65f53640-73d5-4fab-a51a-5f8fff69172e.jpg";

// Единый стандартный фон обложки для всех (если своя обложка не загружена)
const DEFAULT_COVER = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/bucket/6edc6c8d-3e28-4f1a-b881-05852bc47b49.jpg";

function DefaultCover() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <img src={DEFAULT_COVER} className="w-full h-full object-cover" />
    </div>
  );
}

type SettingsScreen = "account" | "privacy" | "notifications" | "appearance" | "sounds" | "videochat" | "private_photos" | "blocked" | "help" | "security";
type ActiveTab = null | "settings" | "stats" | "shop" | "photos" | "private" | "gifts";

export function ProfileHeader({
  currentUser,
  localPhoto,
  localCover,
  photoUploading,
  coverUploading,
  photoError,
  activeTab,
  onEditOpen,
  onAvatarClick,
  onCoverClick,
  onTabChange,
  onSettingsScreen,
  onLogout,
  onVerify,
  onPremium,
}: {
  currentUser: User;
  localPhoto: string;
  localCover: string;
  photoUploading: boolean;
  coverUploading: boolean;
  photoError: string;
  activeTab: ActiveTab;
  onEditOpen: () => void;
  onAvatarClick: () => void;
  onCoverClick: () => void;
  onTabChange: (tab: ActiveTab) => void;
  onSettingsScreen: (s: SettingsScreen) => void;
  onLogout: () => void;
  onVerify: () => void;
  onPremium: () => void;
}) {
  const displayPhoto = localPhoto || FALLBACK_PHOTO;

  const tabs = [
    { key: "photos", icon: "Image", label: "Фото" },
    { key: "gifts",  icon: "Gift",  label: "Подарки" },
  ] as const;

  return (
    <div className="flex flex-col items-center mb-0">

      {/* ── Обложка ── */}
      <div className="relative w-full" style={{ marginBottom: 52 }}>
        <div className="w-full overflow-hidden relative"
          style={{ height: 150 }}>
          {localCover
            ? <img src={localCover} className="w-full h-full object-cover"
                style={{ opacity: coverUploading ? 0.5 : 1 }} />
            : <DefaultCover />}
          {localCover && (
            <div className="absolute inset-0"
              style={{ background: "linear-gradient(to bottom, transparent 30%, rgba(10,6,20,0.55) 100%)" }} />
          )}
          {coverUploading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-7 h-7 rounded-full border-2 border-white border-t-transparent animate-spin" />
            </div>
          )}
          {!coverUploading && (
            <button onClick={onCoverClick}
              className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-white/85 text-xs font-semibold transition-all active:scale-95"
              style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.18)" }}>
              <Icon name="ImagePlus" size={12} />Фон
            </button>
          )}
        </div>

        {/* ── Аватар ── */}
        <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: -48 }}>
          <div className="relative" onClick={onAvatarClick} style={{ cursor: "pointer" }}>
            <div className="w-24 h-24 rounded-full"
              style={{
                padding: 3,
                background: currentUser.premium
                  ? "linear-gradient(135deg,#FF2D78,#FFD700,#9B59B6)"
                  : "linear-gradient(135deg,#FF2D78,#9B59B6)",
                boxShadow: "0 4px 20px rgba(255,45,120,0.45)",
              }}>
              <div className="w-full h-full rounded-full overflow-hidden bg-[var(--spark-dark)]">
                <img src={displayPhoto} className="w-full h-full object-cover"
                  style={{ opacity: photoUploading ? 0.5 : 1 }} />
              </div>
            </div>
            {photoUploading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-white border-t-transparent animate-spin" />
              </div>
            ) : (
              <div className="absolute bottom-0.5 right-0.5 w-6 h-6 rounded-full flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg,#FF2D78,#9B59B6)",
                  boxShadow: "0 2px 8px rgba(255,45,120,0.5)",
                  outline: "2px solid var(--spark-dark)",
                }}>
                <Icon name="Camera" size={11} className="text-white" />
              </div>
            )}
          </div>
        </div>
      </div>

      {photoError && <p className="text-red-400 text-xs mb-1 text-center px-4">{photoError}</p>}

      {/* ── Имя и бейджи ── */}
      <div className="flex flex-col items-center gap-1 px-5">
        <div className="flex items-center gap-2">
          <h3 className="text-white font-bold text-xl leading-tight">
            {currentUser.name}{currentUser.age ? `, ${currentUser.age}` : ""}
          </h3>
          {currentUser.verified && (
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(59,130,246,0.2)" }}>
              <Icon name="BadgeCheck" size={14} className="text-blue-400" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {currentUser.username && (
            <span className="text-white/35 text-xs font-mono">@{currentUser.username}</span>
          )}
          {currentUser.premium && (
            <span className="relative overflow-hidden text-[10px] px-2.5 py-0.5 rounded-full font-black leading-none tracking-wide select-none"
              style={{
                background: "linear-gradient(120deg,#B8860B,#FFD700,#FFF0A0,#FFD700,#B8860B)",
                backgroundSize: "200% 100%",
                color: "#1a1000",
                boxShadow: "0 0 8px rgba(255,215,0,0.6), 0 0 2px rgba(255,215,0,0.9), inset 0 1px 0 rgba(255,255,255,0.4)",
                animation: "goldShimmer 2.5s linear infinite",
                border: "1px solid rgba(255,215,0,0.5)",
                textShadow: "0 1px 0 rgba(255,255,255,0.4)",
              }}>
              ✦ PREMIUM
            </span>
          )}
        </div>
      </div>

      {/* ── Табы: Фото / Приватное / Подарки ── */}
      <div className="w-full mt-6 px-4">
        <div className="flex rounded-2xl gap-1 p-1"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {tabs.map(({ key, icon, label }) => {
            const isActive = (activeTab as string) === key;
            return (
              <button
                key={key}
                onClick={() => onTabChange((isActive ? null : key) as ActiveTab)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all active:scale-[0.97]"
                style={isActive
                  ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)", boxShadow: "0 2px 10px rgba(255,45,120,0.35)" }
                  : { background: "transparent" }}>
                <Icon name={icon} size={14} className={isActive ? "text-white" : "text-white/35"} />
                <span className={`text-xs font-semibold ${isActive ? "text-white" : "text-white/35"}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ProfileTopBar({
  menuOpen,
  onEditOpen,
  onMenuToggle,
  onSettingsScreen,
  onLogout,
  onVerify,
  currentUser,
  isDark,
  onToggleTheme,
}: {
  menuOpen: boolean;
  onEditOpen: () => void;
  onMenuToggle: (open: boolean) => void;
  onSettingsScreen: (s: SettingsScreen) => void;
  onLogout: () => void;
  onVerify: () => void;
  currentUser: User;
  isDark?: boolean;
  onToggleTheme?: () => void;
}) {
  const [showLegal, setShowLegal] = useState(false);
  const [legalTab, setLegalTab] = useState<"terms" | "privacy">("terms");

  return (
    <>
    {/* Шторка — правовые документы */}
    {showLegal && (
      <div className="fixed inset-0 z-50 flex flex-col justify-end"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
        onClick={() => setShowLegal(false)}>
        <div className="w-full max-h-[92vh] flex flex-col rounded-t-3xl overflow-hidden"
          style={{ background: "linear-gradient(160deg,#1a1030,#130d22)", border: "1px solid rgba(255,255,255,0.08)" }}
          onClick={e => e.stopPropagation()}>
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
          </div>
          <div className="flex items-center justify-between px-5 py-3 flex-shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,45,120,0.12)" }}>
                <Icon name="Scale" size={19} className="text-pink-400" />
              </div>
              <div>
                <p className="text-white font-bold text-base">Правовые документы</p>
                <p className="text-white/35 text-xs">Редакция от 1 июня 2026 г.</p>
              </div>
            </div>
            <button onClick={() => setShowLegal(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.07)" }}>
              <Icon name="X" size={16} className="text-white/60" />
            </button>
          </div>
          <div className="flex-shrink-0 px-5 pt-3 pb-0">
            <div className="flex rounded-2xl p-1" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.07)" }}>
              {([{ id: "terms", label: "Условия использования" }, { id: "privacy", label: "Политика конфиденциальности" }] as const).map(tab => (
                <button key={tab.id} onClick={() => setLegalTab(tab.id)}
                  className={`flex-1 py-2 text-[11px] font-semibold transition-all rounded-xl ${legalTab === tab.id ? "text-white" : "text-white/40"}`}
                  style={legalTab === tab.id ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)" } : undefined}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4" style={{ scrollbarWidth: "none" }}>
            {legalTab === "terms" && (<>
              <div className="rounded-2xl px-4 py-3" style={{ background: "rgba(255,45,120,0.08)", border: "1px solid rgba(255,45,120,0.15)" }}>
                <p className="text-pink-300 text-xs leading-relaxed">Настоящие Условия использования регулируют отношения между ООО «ЛавБлум» и пользователями сервиса LoveBloom. Использование приложения означает полное принятие Условий в соответствии со ст. 428 ГК РФ (договор присоединения).</p>
              </div>
              {([
                { icon: "BookOpen", title: "1. Общие положения", items: ["Сервис LoveBloom — платформа для социального общения и знакомств, доступная лицам старше 18 лет.", "Компания действует в соответствии с Федеральным законом № 149-ФЗ «Об информации, информационных технологиях и о защите информации».", "Регистрация означает согласие с настоящими Условиями и Политикой конфиденциальности.", "Компания вправе изменять Условия, уведомив пользователей за 3 дня через push-уведомление или email."] },
                { icon: "UserCheck", title: "2. Регистрация и аккаунт", items: ["Для регистрации необходим действующий email. Предоставление ложных данных запрещено.", "Пользователь обязан обеспечивать конфиденциальность пароля.", "Создание более одного аккаунта запрещено. Мультиаккаунты блокируются без предупреждения.", "Минимальный возраст — 18 лет. Аккаунты несовершеннолетних удаляются немедленно (ФЗ-436)."] },
                { icon: "Shield", title: "3. Правила поведения", items: ["Запрещён контент, нарушающий законодательство РФ: пропаганда насилия, экстремизм, терроризм (ст. 280, 205.2 УК РФ).", "Запрещена пропаганда наркотиков, суицида в соответствии с законодательством РФ.", "Запрещено распространение персональных данных третьих лиц без согласия (ФЗ-152).", "Запрещён спам, фишинг и мошенничество (ст. 159 УК РФ). Запрещено использование ботов.", "Запрещена публикация материалов, нарушающих авторские права (ст. 1259 ГК РФ)."] },
                { icon: "Image", title: "4. Пользовательский контент", items: ["Загружая контент, пользователь гарантирует наличие прав на него.", "Компания вправе удалить любой контент, нарушающий Условия, без предупреждения.", "Фотографии профиля должны изображать только самого пользователя."] },
                { icon: "CreditCard", title: "5. Платные функции", items: ["Подписка оформляется на условиях публичной оферты через сертифицированные платёжные системы.", "Возврат средств за неиспользованный период — по ст. 32 Закона РФ «О защите прав потребителей».", "Виртуальные подарки не подлежат обмену на реальные деньги."] },
                { icon: "Scale", title: "6. Ответственность и споры", items: ["Компания не несёт ответственности за содержание переписки между пользователями.", "Споры разрешаются в претензионном порядке (срок ответа — 30 дней).", "К отношениям применяется законодательство Российской Федерации."] },
                { icon: "Trash2", title: "7. Блокировка и удаление", items: ["Компания вправе заблокировать аккаунт за нарушение Условий без возмещения убытков.", "Пользователь может удалить аккаунт через настройки. Данные удаляются в течение 30 дней.", "При противоправных действиях Компания обязана передать данные правоохранительным органам."] },
              ] as const).map(section => (
                <div key={section.title} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,45,120,0.1)" }}>
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
                <p className="text-white/35 text-[11px] leading-relaxed text-center">По вопросам: <span className="text-white/55">info@lbloom.ru</span></p>
              </div>
            </>)}
            {legalTab === "privacy" && (<>
              <div className="rounded-2xl px-4 py-3" style={{ background: "rgba(155,89,182,0.08)", border: "1px solid rgba(155,89,182,0.2)" }}>
                <p className="text-purple-300 text-xs leading-relaxed">Политика конфиденциальности разработана в соответствии с ФЗ-152 «О персональных данных» и описывает порядок сбора, хранения, обработки и защиты персональных данных пользователей.</p>
              </div>
              {([
                { icon: "Database", title: "1. Какие данные мы собираем", items: ["Регистрационные данные: имя, email, дата рождения.", "Данные профиля: фотографии, описание, город, интересы.", "Технические данные: IP-адрес, тип устройства, ОС, версия приложения.", "Данные геолокации — только при явном разрешении пользователя.", "Данные об использовании: история действий, статистика активности.", "Платёжные данные обрабатываются платёжными системами; Компания карты не хранит."] },
                { icon: "Settings", title: "2. Цели обработки", items: ["Предоставление функционала сервиса (ст. 6 ФЗ-152).", "Обеспечение безопасности и противодействие мошенничеству.", "Улучшение алгоритмов подбора совместимых пользователей.", "Выполнение требований законодательства РФ."] },
                { icon: "Share2", title: "3. Передача данных третьим лицам", items: ["Данные не продаются и не передаются в коммерческих целях.", "Данные передаются партнёрам-обработчикам (хостинг, аналитика) на основании договоров о конфиденциальности.", "Данные передаются правоохранительным органам по законному запросу."] },
                { icon: "Lock", title: "4. Хранение и защита", items: ["Данные хранятся на серверах на территории РФ (ч. 5 ст. 18 ФЗ-152).", "Применяются шифрование TLS/SSL, хэширование паролей (bcrypt), контроль доступа.", "Персональные данные хранятся в течение срока действия аккаунта и 30 дней после удаления.", "При утечке данных Компания уведомит пользователей в течение 72 часов."] },
                { icon: "UserCheck", title: "5. Права пользователей", items: ["Право на доступ: запросить копию своих данных (ст. 14 ФЗ-152).", "Право на исправление: скорректировать данные через настройки.", "Право на удаление: потребовать удаления данных в течение 30 дней.", "Право на возражение: отозвать согласие, направив запрос на info@lbloom.ru."] },
                { icon: "Globe", title: "6. Международная передача", items: ["По умолчанию данные не передаются за пределы РФ.", "При трансграничной передаче применяются стандартные договорные условия защиты данных.", "Пользователи из ЕС имеют дополнительные права по GDPR."] },
                { icon: "Bell", title: "7. Изменения политики", items: ["Пользователи уведомляются об изменениях за 7 дней.", "Продолжение использования сервиса означает принятие изменений.", "Актуальная версия всегда доступна в настройках приложения."] },
              ] as const).map(section => (
                <div key={section.title} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(155,89,182,0.12)" }}>
                      <Icon name={section.icon as "Database"|"Settings"|"Share2"|"Lock"|"UserCheck"|"Globe"|"Bell"} size={14} className="text-purple-400" />
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
                <p className="text-white/35 text-[11px] leading-relaxed text-center">Запросы по персональным данным: <span className="text-white/55">info@lbloom.ru</span></p>
              </div>
            </>)}
            <button onClick={() => setShowLegal(false)}
              className="w-full py-3.5 rounded-2xl text-white font-bold text-sm mt-1"
              style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
              Закрыть
            </button>
          </div>
        </div>
      </div>
    )}
    <div className="px-4 pt-5 pb-2 flex items-center justify-between flex-shrink-0">
      <h2 className="text-white font-bold text-2xl">Профиль</h2>
      <div className="flex items-center gap-2">
        {/* Изменить */}
        <button onClick={onEditOpen}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-white/75 text-sm font-medium transition-all active:scale-95"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <Icon name="Pencil" size={14} />
          <span>Изменить</span>
        </button>

        {/* Меню */}
        <div className="relative">
          <button onClick={() => onMenuToggle(!menuOpen)}
            className="w-9 h-9 rounded-2xl flex items-center justify-center transition-all active:scale-95"
            style={menuOpen
              ? { background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }
              : { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <Icon name="MoreVertical" size={18} className="text-white/80" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-12 z-50 min-w-[260px] flex flex-col overflow-y-auto"
              style={{
                background: "linear-gradient(160deg, rgba(28,18,45,0.99) 0%, rgba(18,10,30,0.99) 100%)",
                border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: 20,
                boxShadow: "0 24px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04) inset",
                backdropFilter: "blur(32px)",
                maxHeight: "calc(100dvh - 220px)",
              }}>

              {/* Шапка меню — аватар + имя */}
              <div className="flex items-center gap-3 px-4 py-3.5"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
                <img
                  src={currentUser.photo_url || "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/65f53640-73d5-4fab-a51a-5f8fff69172e.jpg"}
                  className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                  style={{ border: "2px solid rgba(255,45,120,0.4)" }}
                />
                <div className="min-w-0">
                  <p className="text-white font-bold text-sm leading-tight truncate">{currentUser.name || "Профиль"}</p>
                  <p className="text-white/35 text-xs truncate">@{currentUser.username || currentUser.email?.split("@")[0] || "user"}</p>
                </div>
              </div>

              {/* Группа 1: Верификация + Настройки */}
              <div className="px-2 py-2 flex flex-col gap-0.5">
                {[
                  {
                    icon: "BadgeCheck" as const,
                    label: currentUser.verified ? "Верифицирован" : "Верификация",
                    sub: currentUser.verified ? "Профиль подтверждён" : "Подтверди личность",
                    action: () => { onVerify(); onMenuToggle(false); },
                    iconBg: currentUser.verified ? "rgba(59,130,246,0.18)" : "rgba(255,255,255,0.07)",
                    iconColor: currentUser.verified ? "text-blue-400" : "text-white/50",
                    badge: currentUser.verified ? "✓" : undefined,
                  },
                  {
                    icon: "Settings" as const,
                    label: "Настройки аккаунта",
                    sub: "Имя, почта, юзернейм",
                    action: () => { onSettingsScreen("account"); onMenuToggle(false); },
                    iconBg: "rgba(255,255,255,0.07)",
                    iconColor: "text-white/50",
                  },
                  {
                    icon: "Shield" as const,
                    label: "Конфиденциальность",
                    sub: "Онлайн, видимость",
                    action: () => { onSettingsScreen("privacy"); onMenuToggle(false); },
                    iconBg: "rgba(255,255,255,0.07)",
                    iconColor: "text-white/50",
                  },
                  {
                    icon: "Bell" as const,
                    label: "Уведомления",
                    sub: "Матчи, сообщения",
                    action: () => { onSettingsScreen("notifications"); onMenuToggle(false); },
                    iconBg: "rgba(255,255,255,0.07)",
                    iconColor: "text-white/50",
                  },
                  {
                    icon: "Ban" as const,
                    label: "Заблокированные",
                    sub: "Управление блокировками",
                    action: () => { onSettingsScreen("blocked"); onMenuToggle(false); },
                    iconBg: "rgba(255,255,255,0.07)",
                    iconColor: "text-white/50",
                  },
                  {
                    icon: "ShieldCheck" as const,
                    label: "Безопасность",
                    sub: "Пароль, устройства, сессии",
                    action: () => { onSettingsScreen("security"); onMenuToggle(false); },
                    iconBg: "rgba(255,45,120,0.12)",
                    iconColor: "text-pink-400",
                  },
                  {
                    icon: "HelpCircle" as const,
                    label: "Помощь",
                    sub: "Поддержка и FAQ",
                    action: () => { onSettingsScreen("help"); onMenuToggle(false); },
                    iconBg: "rgba(255,255,255,0.07)",
                    iconColor: "text-white/50",
                  },
                  {
                    icon: "Scale" as const,
                    label: "Правовые документы",
                    sub: "Условия и конфиденциальность",
                    action: () => { setShowLegal(true); onMenuToggle(false); },
                    iconBg: "rgba(255,255,255,0.07)",
                    iconColor: "text-white/50",
                    badge: undefined,
                  },
                ].map((item) => (
                  <button key={item.label} onClick={item.action}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all active:scale-[0.98]"
                    style={{ background: "transparent" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: item.iconBg }}>
                      <Icon name={item.icon} size={15} className={item.iconColor} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/90 text-sm font-semibold leading-tight">{item.label}</p>
                      <p className="text-white/30 text-[11px] leading-tight mt-0.5">{item.sub}</p>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded-full flex-shrink-0">{item.badge}</span>
                    )}
                    <Icon name="ChevronRight" size={13} className="text-white/20 flex-shrink-0" />
                  </button>
                ))}
              </div>

              {/* Тема */}
              {onToggleTheme && (
                <div className="px-2 pb-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <button disabled
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl mt-2 cursor-not-allowed opacity-50"
                    style={{ background: "transparent" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: isDark ? "rgba(251,191,36,0.12)" : "rgba(99,102,241,0.12)" }}>
                        <Icon name={isDark ? "Sun" : "Moon"} size={15} className={isDark ? "text-amber-400" : "text-indigo-400"} />
                      </div>
                      <div>
                        <p className="text-white/90 text-sm font-semibold leading-tight">{isDark ? "Светлая тема" : "Тёмная тема"}</p>
                        <p className="text-white/30 text-[11px] leading-tight mt-0.5">Заработает в следующем обновлении</p>
                      </div>
                    </div>
                    <div className="w-11 h-6 rounded-full relative flex-shrink-0"
                      style={{ background: "rgba(255,255,255,0.1)" }}>
                      <div className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md"
                        style={{ left: "3px" }} />
                    </div>
                  </button>
                </div>
              )}

              {/* Выйти */}
              <div className="px-2 pb-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <button onClick={() => { onLogout(); onMenuToggle(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all active:scale-[0.98] mt-2"
                  style={{ background: "transparent" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.07)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(239,68,68,0.1)" }}>
                    <Icon name="LogOut" size={15} className="text-red-400" />
                  </div>
                  <div>
                    <p className="text-red-400 text-sm font-semibold leading-tight">Выйти из аккаунта</p>
                    <p className="text-red-400/40 text-[11px] leading-tight mt-0.5">Завершить сессию</p>
                  </div>
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}