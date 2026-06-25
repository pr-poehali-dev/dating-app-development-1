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
              <p className="text-pink-300 text-xs leading-relaxed">Используя приложение, ты соглашаешься с этими правилами. Регистрация означает принятие всех условий.</p>
            </div>
            {([
              { icon: "BookOpen", title: "Общие", items: ["Сервис предназначен для общения и знакомств. Доступ — с 18 лет.", "Мы можем обновлять правила — важные изменения сообщим заранее.", "Регистрируясь, ты подтверждаешь, что ознакомился с условиями."] },
              { icon: "UserCheck", title: "Аккаунт", items: ["Один человек — один аккаунт. Несколько аккаунтов блокируются.", "Ты отвечаешь за безопасность своего пароля.", "Если тебе нет 18 лет — использование запрещено."] },
              { icon: "Shield", title: "Правила поведения", items: ["Запрещён оскорбительный, незаконный или вредоносный контент.", "Спам, боты и мошенничество — повод для блокировки.", "Уважай других пользователей и их личные границы."] },
              { icon: "Image", title: "Контент", items: ["Публикуй только тот контент, права на который есть у тебя.", "Фото в профиле должно изображать именно тебя.", "Мы можем удалить контент, нарушающий правила."] },
              { icon: "CreditCard", title: "Платные функции", items: ["Оплата проходит через защищённые платёжные системы.", "Возврат за неиспользованный период — по запросу в поддержку.", "Виртуальные подарки и монеты не обмениваются на деньги."] },
              { icon: "Trash2", title: "Блокировка и удаление", items: ["Нарушение правил может привести к блокировке без предупреждения.", "Удалить аккаунт можно в настройках — данные удалятся в течение 30 дней."] },
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
              <p className="text-purple-300 text-xs leading-relaxed">Мы бережно относимся к твоим данным и собираем только то, что нужно для работы сервиса.</p>
            </div>
            {([
              { icon: "Database", title: "Что мы собираем", items: ["Имя, email, дата рождения — для создания аккаунта.", "Фото, описание, город, интересы — для заполнения профиля.", "Геолокация — только с твоего разрешения.", "Данные об устройстве и активности — для работы и безопасности сервиса.", "Платёжные данные обрабатываются платёжными системами напрямую — мы их не храним."] },
              { icon: "Settings", title: "Зачем это нужно", items: ["Чтобы сервис работал и показывал подходящих людей.", "Чтобы обеспечить безопасность и защитить от мошенников.", "Чтобы улучшать приложение."] },
              { icon: "Share2", title: "Кому передаём данные", items: ["Данные не продаются третьим лицам.", "Технические партнёры (хостинг, аналитика) работают на условиях конфиденциальности.", "По законному запросу — правоохранительным органам."] },
              { icon: "Lock", title: "Как защищаем", items: ["Шифрование при передаче данных (TLS/SSL).", "Пароли хранятся в зашифрованном виде.", "Данные удаляются в течение 30 дней после удаления аккаунта."] },
              { icon: "UserCheck", title: "Твои права", items: ["Ты можешь запросить свои данные или удалить аккаунт в любой момент.", "Можно отозвать согласие на обработку данных — через настройки или письмом в поддержку."] },
            ] as const).map(section => (
              <div key={section.title} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(155,89,182,0.1)" }}>
                    <Icon name={section.icon as "Database"|"Settings"|"Share2"|"Lock"|"UserCheck"} size={14} className="text-purple-400" />
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