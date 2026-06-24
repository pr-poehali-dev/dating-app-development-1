import Icon from "@/components/ui/icon";

export function ProfileLegalSheet({
  legalTab,
  onTabChange,
  onClose,
}: {
  legalTab: "terms" | "privacy";
  onTabChange: (tab: "terms" | "privacy") => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      onClick={onClose}>
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
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.07)" }}>
            <Icon name="X" size={16} className="text-white/60" />
          </button>
        </div>

        <div className="flex-shrink-0 px-5 pt-3 pb-0">
          <div className="flex rounded-2xl p-1" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.07)" }}>
            {([{ id: "terms", label: "Условия использования" }, { id: "privacy", label: "Политика конфиденциальности" }] as const).map(tab => (
              <button key={tab.id} onClick={() => onTabChange(tab.id)}
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

          <button onClick={onClose}
            className="w-full py-3.5 rounded-2xl text-white font-bold text-sm mt-1"
            style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
