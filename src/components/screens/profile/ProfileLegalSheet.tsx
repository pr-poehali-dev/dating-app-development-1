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
            {([{ id: "terms", label: "Условия использования" }, { id: "privacy", label: "Конфиденциальность" }] as const).map(tab => (
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
              <p className="text-pink-300 text-xs leading-relaxed font-semibold">ВНИМАНИЕ: Создавая профиль, входя в аккаунт или используя LoveBloom любым иным способом, ты принимаешь настоящее Лицензионное соглашение в полном объёме.</p>
            </div>

            {([
              { icon: "BookOpen", title: "1. Общие положения", items: [
                "Настоящее соглашение регулирует отношения между сервисом LoveBloom и пользователем (Лицензиатом) в части использования платформы для знакомств и общения.",
                "LoveBloom — программный сервис, предоставляющий возможность создавать анкеты, просматривать профили других участников, обмениваться сообщениями, вести прямые трансляции и пользоваться иными функциями.",
                "Сервис доступен для лиц, достигших 18 лет. Регистрация до 18 лет запрещена.",
                "Мы можем обновлять условия соглашения — продолжая пользоваться сервисом после изменений, ты принимаешь новую редакцию.",
              ]},
              { icon: "UserCheck", title: "2. Аккаунт и регистрация", items: [
                "Один человек — один аккаунт. Регистрация нескольких аккаунтов одним лицом запрещена и является основанием для блокировки.",
                "При регистрации необходимо указывать достоверные данные — имя, email и прочие сведения.",
                "Ты несёшь ответственность за конфиденциальность пароля и все действия, совершённые с твоего аккаунта.",
                "Аккаунт, зарегистрированный для использования группой лиц или организацией, будет заблокирован.",
              ]},
              { icon: "Shield", title: "3. Правила поведения", items: [
                "Запрещено размещать оскорбительный, незаконный, дискриминационный или вредоносный контент.",
                "Запрещены спам, боты, автоматизированные скрипты и любые формы мошенничества.",
                "Уважай других пользователей, их личные границы и право на конфиденциальность.",
                "Запрещены угрозы, пропаганда насилия, экстремизм, контент с участием несовершеннолетних.",
                "Нельзя размещать чужие личные данные без согласия этих лиц.",
              ]},
              { icon: "Image", title: "4. Контент и права", items: [
                "Публикуй только тот контент, права на который принадлежат тебе или получены у правообладателя.",
                "Фотография профиля должна изображать именно тебя, а не другого человека, персонажа или предмет.",
                "Размещая контент в LoveBloom, ты предоставляешь нам право использовать его в рамках работы сервиса.",
                "Мы можем удалить любой контент, нарушающий эти правила, без предупреждения и объяснения причин.",
              ]},
              { icon: "CreditCard", title: "5. Premium-подписка и оплата", items: [
                "Часть функций (инкогнито, суперлайки, приоритет и др.) доступна по платной подписке LoveBloom Premium.",
                "Оплата проходит через защищённые платёжные системы — мы не храним данные банковских карт.",
                "Виртуальные подарки, монеты и иные внутренние ценности не обмениваются на реальные деньги.",
                "Вознаграждение за неиспользованный период подписки при самостоятельном удалении аккаунта не возвращается.",
                "По вопросам возврата обращайся в службу поддержки.",
              ]},
              { icon: "Trash2", title: "6. Блокировка и прекращение", items: [
                "Нарушение правил может привести к блокировке аккаунта без предупреждения.",
                "Мы вправе приостановить или прекратить доступ к сервису без объяснения причин.",
                "Удалить аккаунт можно самостоятельно в настройках — данные удалятся в течение 30 дней.",
                "При грубом нарушении соглашения оплаченная подписка не возвращается.",
              ]},
            ] as const).map(section => (
              <div key={section.title} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,45,120,0.1)" }}>
                    <Icon name={section.icon as "BookOpen"|"UserCheck"|"Shield"|"Image"|"CreditCard"|"Trash2"} size={14} className="text-pink-400" />
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
              <p className="text-white/35 text-[11px] leading-relaxed text-center">Вопросы и обращения: <span className="text-white/55">info@lbloom.ru</span></p>
            </div>
          </>)}

          {legalTab === "privacy" && (<>
            <div className="rounded-2xl px-4 py-3" style={{ background: "rgba(155,89,182,0.08)", border: "1px solid rgba(155,89,182,0.2)" }}>
              <p className="text-purple-300 text-xs leading-relaxed">Мы бережно относимся к твоим данным и собираем только то, что необходимо для работы сервиса LoveBloom.</p>
            </div>
            {([
              { icon: "Database", title: "1. Что мы собираем", items: [
                "Имя, email — для создания и идентификации аккаунта.",
                "Фото, описание, город, возраст, интересы — для заполнения профиля и подбора анкет.",
                "Геолокация — только с твоего явного разрешения, для показа людей рядом.",
                "Данные об устройстве, браузере, IP-адресе и активности — для безопасности и работы сервиса.",
                "Платёжные данные обрабатываются платёжными системами напрямую — мы их не храним.",
                "Переписка в чатах хранится на защищённых серверах для обеспечения работы мессенджера.",
              ]},
              { icon: "Settings", title: "2. Зачем это нужно", items: [
                "Чтобы сервис работал и подбирал подходящих тебе людей.",
                "Чтобы обеспечить безопасность и защитить от мошенников и спама.",
                "Чтобы улучшать алгоритмы рекомендаций и качество приложения.",
                "Для рассылки уведомлений о матчах, сообщениях и акциях (с возможностью отключить в настройках).",
              ]},
              { icon: "Share2", title: "3. Кому передаём данные", items: [
                "Твои данные никогда не продаются третьим лицам.",
                "Технические партнёры (хостинг, платёжные системы, аналитика) работают строго на условиях конфиденциальности.",
                "По законному запросу правоохранительных органов — только в объёме, предусмотренном законодательством.",
              ]},
              { icon: "Lock", title: "4. Как мы защищаем данные", items: [
                "Шифрование при передаче данных (TLS/SSL).",
                "Пароли хранятся в зашифрованном виде (bcrypt) — мы не знаем твой пароль.",
                "Доступ к данным имеет ограниченный круг сотрудников.",
                "Данные удаляются в течение 30 дней после удаления аккаунта.",
              ]},
              { icon: "Eye", title: "5. Рекомендательные технологии", items: [
                "LoveBloom использует алгоритмы для подбора анкет на основе твоих предпочтений, активности и настроек поиска.",
                "Система анализирует твои взаимодействия (лайки, просмотры, матчи) для улучшения рекомендаций.",
                "Ты можешь в любой момент изменить параметры поиска в настройках фильтров.",
              ]},
              { icon: "UserCheck", title: "6. Твои права", items: [
                "Ты можешь в любой момент запросить свои данные или удалить аккаунт через настройки.",
                "Можно отозвать согласие на обработку данных — напишите в поддержку на info@lbloom.ru.",
                "Ты вправе ограничить видимость своего профиля, отключить геолокацию и статус онлайн в настройках конфиденциальности.",
              ]},
            ] as const).map(section => (
              <div key={section.title} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(155,89,182,0.1)" }}>
                    <Icon name={section.icon as "Database"|"Settings"|"Share2"|"Lock"|"Eye"|"UserCheck"} size={14} className="text-purple-400" />
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
              <p className="text-white/35 text-[11px] leading-relaxed text-center">По вопросам конфиденциальности: <span className="text-white/55">info@lbloom.ru</span></p>
            </div>
          </>)}
        </div>
      </div>
    </div>
  );
}