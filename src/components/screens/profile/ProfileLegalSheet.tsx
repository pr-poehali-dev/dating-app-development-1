import React from "react";
import Icon from "@/components/ui/icon";

function PrivItem({ text }: { text: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-purple-500 text-xs mt-0.5 flex-shrink-0">•</span>
      <p className="text-white/60 text-xs leading-relaxed">{text}</p>
    </div>
  );
}

function PrivSection({ icon, title, color, children }: { icon: string; title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(155,89,182,0.1)" }}>
          <Icon name={icon as "BookOpen"|"FileText"|"BookMarked"|"Target"|"Scale"|"Users"|"Database"|"ShieldCheck"|"UserCheck"|"Info"} size={14} className="text-purple-400" />
        </div>
        <p className="text-white font-bold text-sm">{title}</p>
      </div>
      <div className="flex flex-col gap-1.5 pl-9">{children}</div>
    </div>
  );
}

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
              <p className="text-purple-300 text-[11px] leading-relaxed font-semibold">Оператор: Исламгулов Богдан Русланович · Редакция от 27 июня 2026 г.</p>
            </div>

            {/* Нормативная база */}
            <PrivSection icon="BookOpen" title="Нормативная база" color="purple">
              {[
                "Федеральный закон от 27.07.2006 № 152-ФЗ «О персональных данных»",
                "Федеральный закон от 14.07.2022 № 266-ФЗ «О внесении изменений в ФЗ «О персональных данных»»",
                "Федеральный закон от 28.02.2025 № 23-ФЗ (усиление требований к локализации, с 01.07.2025)",
                "Постановление Правительства РФ от 01.11.2012 № 1119",
                "Постановление Правительства РФ от 15.09.2008 № 687",
                "Приказ ФСТЭК России от 18.02.2013 № 21",
              ].map((t, i) => <PrivItem key={i} text={t} />)}
            </PrivSection>

            {/* 1. Общие положения */}
            <PrivSection icon="FileText" title="1. Общие положения" color="purple">
              <p className="text-white/60 text-xs leading-relaxed mb-2">Настоящая Политика определяет порядок обработки персональных данных (ПДн) и подлежит обязательному опубликованию на официальном сайте Оператора.</p>
              {[
                "Самозанятый: Исламгулов Богдан Русланович",
                "ИНН: 025503380449",
                "Адрес: Республика Башкортостан, г. Белебей, ул. Красноармейская, д. 271, кв. 30",
                "Email: info@lbloom.ru",
                "Оператор уведомил Роскомнадзор об обработке персональных данных до начала их обработки (ст. 22 ФЗ-152).",
              ].map((t, i) => <PrivItem key={i} text={t} />)}
            </PrivSection>

            {/* 2. Термины */}
            <PrivSection icon="BookMarked" title="2. Термины и определения" color="purple">
              {[
                "Персональные данные (ПДн) — любая информация, относящаяся к прямо или косвенно определённому физическому лицу.",
                "Оператор — Исламгулов Богдан Русланович (самозанятый), организующий обработку ПДн.",
                "Обработка ПДн — любые действия: сбор, запись, систематизация, хранение, уточнение, извлечение, использование, передача, обезличивание, блокирование, удаление, уничтожение.",
                "ИСПДн — совокупность баз данных ПДн и технических средств их обработки.",
                "Конфиденциальность ПДн — требование не допускать распространения ПДн без согласия субъекта.",
              ].map((t, i) => <PrivItem key={i} text={t} />)}
            </PrivSection>

            {/* 3. Цели */}
            <PrivSection icon="Target" title="3. Цели обработки" color="purple">
              {["Обработка обращений пользователей."].map((t, i) => <PrivItem key={i} text={t} />)}
            </PrivSection>

            {/* 4. Правовые основания */}
            <PrivSection icon="Scale" title="4. Правовые основания" color="purple">
              {["Согласие субъекта персональных данных."].map((t, i) => <PrivItem key={i} text={t} />)}
            </PrivSection>

            {/* 5. Категории */}
            <PrivSection icon="Users" title="5. Категории субъектов и данных" color="purple">
              {[
                "Субъекты: посетители сайта.",
                "Категории ПДн: ФИО, телефон, email.",
              ].map((t, i) => <PrivItem key={i} text={t} />)}
            </PrivSection>

            {/* 6. Порядок хранения */}
            <PrivSection icon="Database" title="6. Порядок обработки и хранения" color="purple">
              {[
                "Способы: автоматизированная (вычислительная техника) и неавтоматизированная (бумажные носители).",
                "Место хранения: база данных на сайте poehali.dev.",
                "Срок хранения: 3 года после окончания договора.",
                "Локализация: базы данных граждан РФ размещаются исключительно на территории Российской Федерации (ч. 5 ст. 18 ФЗ-152 в ред. ФЗ-23 от 28.02.2025).",
                "Передача третьим лицам не осуществляется, кроме случаев, предусмотренных законодательством РФ.",
                "Трансграничная передача персональных данных не осуществляется.",
                "На сайте используются технические cookie для обеспечения работы и безопасности сайта.",
              ].map((t, i) => <PrivItem key={i} text={t} />)}
            </PrivSection>

            {/* 7. Безопасность */}
            <PrivSection icon="ShieldCheck" title="7. Меры безопасности" color="purple">
              {[
                "Назначено лицо, ответственное за организацию обработки ПДн: Исламгулов Богдан Русланович.",
                "Разграничение прав доступа к информационным системам.",
                "Физическая защита помещений и оборудования.",
                "Проведение оценки вреда субъектам ПДн (п. 11 ч. 1 ст. 18.1 ФЗ-152).",
                "При инциденте — уведомление Роскомнадзора в течение 24 часов (предварительное) и 72 часов (итоговое).",
              ].map((t, i) => <PrivItem key={i} text={t} />)}
            </PrivSection>

            {/* 8. Права субъектов */}
            <PrivSection icon="UserCheck" title="8. Права субъектов ПДн" color="purple">
              {[
                "Получение сведений об обработке ПДн (ч. 1, 5 ст. 14 ФЗ-152).",
                "Уточнение, блокирование или уничтожение ПДн при их недостоверности (ст. 21).",
                "Требование прекращения обработки при незаконности или отпадении цели.",
                "Отзыв согласия на обработку (ст. 9) — прекращение обработки в течение 30 дней.",
                "Обжалование действий Оператора в Роскомнадзор или суд (ст. 17).",
                "Срок ответа на запросы: 10 рабочих дней.",
              ].map((t, i) => <PrivItem key={i} text={t} />)}
            </PrivSection>

            {/* 10. Заключительные */}
            <PrivSection icon="Info" title="9–10. Ответственное лицо и заключение" color="purple">
              {[
                "Ответственный за организацию обработки ПДн: Исламгулов Богдан Русланович.",
                "Политика вступает в силу с даты утверждения и подлежит опубликованию на сайте.",
                "Плановый пересмотр — не реже одного раза в год.",
                "Изменения вступают в силу с даты утверждения новой редакции.",
              ].map((t, i) => <PrivItem key={i} text={t} />)}
            </PrivSection>

            <div className="rounded-xl px-4 py-3 mt-1" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-white/35 text-[11px] leading-relaxed text-center">Контакты: <span className="text-white/55">info@lbloom.ru</span></p>
              <p className="text-white/25 text-[10px] leading-relaxed text-center mt-1">Адрес: Республика Башкортостан, г. Белебей, ул. Красноармейская, д. 271, кв. 30</p>
              <p className="text-white/25 text-[10px] leading-relaxed text-center mt-0.5">Исламгулов Богдан Русланович · 27 июня 2026 г.</p>
            </div>
          </>)}
        </div>
      </div>
    </div>
  );
}