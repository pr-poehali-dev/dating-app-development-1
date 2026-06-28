// ── SVG-иконки знаков зодиака ─────────────────────────────────────────────────
export function ZodiacIcon({ sign, color, size = 22 }: { sign: string; color: string; size?: number }) {
  const s = size;
  const c = color;
  const props = { fill: "none", stroke: c, strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  const icons: Record<string, JSX.Element> = {
    // Овен — два завитка рогов с центральным изгибом
    aries: <svg width={s} height={s} viewBox="0 0 24 24" {...props}>
      <path d="M12 20 C12 14, 6 14, 6 9 C6 5, 9 3, 12 6" />
      <path d="M12 20 C12 14, 18 14, 18 9 C18 5, 15 3, 12 6" />
      <circle cx="12" cy="6" r="1.2" fill={c} stroke="none" />
    </svg>,

    // Телец — круг с рогами наверху
    taurus: <svg width={s} height={s} viewBox="0 0 24 24" {...props}>
      <circle cx="12" cy="14" r="5.5" />
      <path d="M6.5 8.5 C6.5 5, 9 3.5, 12 3.5" />
      <path d="M17.5 8.5 C17.5 5, 15 3.5, 12 3.5" />
    </svg>,

    // Близнецы — две параллельные колонны с горизонталями
    gemini: <svg width={s} height={s} viewBox="0 0 24 24" {...props}>
      <line x1="8" y1="4" x2="8" y2="20" />
      <line x1="16" y1="4" x2="16" y2="20" />
      <path d="M5 4 C7 3, 9 4, 12 4 C15 4, 17 3, 19 4" />
      <path d="M5 20 C7 21, 9 20, 12 20 C15 20, 17 21, 19 20" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>,

    // Рак — два завитка (клешни) с кругами
    cancer: <svg width={s} height={s} viewBox="0 0 24 24" {...props}>
      <path d="M6 8 C4 8, 3 10, 4 12 C5 14, 7 14, 9 12 C11 10, 13 10, 15 12 C17 14, 19 14, 20 12 C21 10, 20 8, 18 8" />
      <circle cx="7" cy="7" r="2" />
      <circle cx="17" cy="7" r="2" />
    </svg>,

    // Лев — завиток с хвостом и гривой
    leo: <svg width={s} height={s} viewBox="0 0 24 24" {...props}>
      <circle cx="11" cy="10" r="4.5" />
      <path d="M15.5 10 C17 10, 19 11, 20 13 C21 15, 20.5 18, 19 19 C17.5 20, 16 19.5, 15.5 18" />
      <path d="M7 6 C5 4, 4 3, 5 2" strokeWidth={1.2} />
      <path d="M9 5 C8 3, 8 2, 10 2" strokeWidth={1.2} />
      <path d="M11 5 C11 3, 12 2, 13 2" strokeWidth={1.2} />
    </svg>,

    // Дева — буква M с петлёй
    virgo: <svg width={s} height={s} viewBox="0 0 24 24" {...props}>
      <path d="M6 4 L6 16 C6 18.5, 7.5 20, 10 20 C12.5 20, 14 18.5, 14 16 L14 4" />
      <path d="M6 12 C6 12, 10 12, 10 8 C10 5.5, 8.5 4, 7 4" />
      <path d="M14 12 C14 12, 18 12, 18 8 C18 5.5, 16.5 4, 15 4" />
      <path d="M14 16 C14 18.5, 15.5 20, 17 20" />
    </svg>,

    // Весы — чаши весов на перекладине
    libra: <svg width={s} height={s} viewBox="0 0 24 24" {...props}>
      <line x1="4" y1="19" x2="20" y2="19" />
      <line x1="12" y1="4" x2="12" y2="19" />
      <line x1="6" y1="8" x2="18" y2="8" />
      <path d="M6 8 L4 13 Q6 15, 8 13 L6 8" />
      <path d="M18 8 L16 13 Q18 15, 20 13 L18 8" />
    </svg>,

    // Скорпион — буква M со стрелой-хвостом
    scorpio: <svg width={s} height={s} viewBox="0 0 24 24" {...props}>
      <path d="M4 4 L4 14 C4 16, 5.5 17, 7 17" />
      <path d="M4 10 C4 10, 8 10, 8 6 C8 4, 6.5 3, 5 4" />
      <path d="M12 4 L12 14 C12 16, 13.5 17, 15 17" />
      <path d="M12 10 C12 10, 16 10, 16 6 C16 4, 14.5 3, 13 4" />
      <path d="M15 17 C17 17, 19 16, 20 14 C21 12, 20 10, 20 10" />
      <polyline points="18,8 20,10 22,8" />
    </svg>,

    // Стрелец — стрела по диагонали с крестом
    sagittarius: <svg width={s} height={s} viewBox="0 0 24 24" {...props}>
      <line x1="5" y1="19" x2="19" y2="5" strokeWidth={2} />
      <polyline points="12,5 19,5 19,12" />
      <line x1="5" y1="11" x2="11" y2="11" strokeWidth={1.2} />
      <line x1="13" y1="19" x2="13" y2="13" strokeWidth={1.2} />
    </svg>,

    // Козерог — буква V с завитком
    capricorn: <svg width={s} height={s} viewBox="0 0 24 24" {...props}>
      <path d="M5 4 L5 15 C5 18, 7 20, 10 20 C13 20, 15 18, 15 15 L15 12" />
      <path d="M5 10 C5 10, 9 10, 9 6 C9 4, 7.5 3, 6 4" />
      <path d="M15 12 C16 14, 18 16, 20 14 C22 12, 21 9, 19 10" />
    </svg>,

    // Водолей — две волнистые линии
    aquarius: <svg width={s} height={s} viewBox="0 0 24 24" {...props}>
      <path d="M3 9 C5 7, 7 11, 9 9 C11 7, 13 11, 15 9 C17 7, 19 11, 21 9" strokeWidth={2} />
      <path d="M3 15 C5 13, 7 17, 9 15 C11 13, 13 17, 15 15 C17 13, 19 17, 21 15" strokeWidth={2} />
    </svg>,

    // Рыбы — две дуги рыб со связкой
    pisces: <svg width={s} height={s} viewBox="0 0 24 24" {...props}>
      <path d="M12 4 C8 4, 4 7, 4 12 C4 17, 8 20, 12 20" />
      <path d="M12 4 C16 4, 20 7, 20 12 C20 17, 16 20, 12 20" />
      <line x1="12" y1="4" x2="12" y2="20" />
      <path d="M9 4 C10 2, 12 2, 14 4" />
      <path d="M9 20 C10 22, 12 22, 14 20" />
    </svg>,
  };

  return icons[sign] ?? <svg width={s} height={s} viewBox="0 0 24 24" {...props}><circle cx="12" cy="12" r="8"/></svg>;
}

export default ZodiacIcon;
