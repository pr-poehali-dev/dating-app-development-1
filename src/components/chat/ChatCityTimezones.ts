// ─── Маппинг города → IANA часовой пояс ───────────────────────────────────────
export const CITY_TIMEZONES: Record<string, string> = {
  "москва": "Europe/Moscow",
  "санкт-петербург": "Europe/Moscow",
  "санкт петербург": "Europe/Moscow",
  "спб": "Europe/Moscow",
  "питер": "Europe/Moscow",
  "сочи": "Europe/Moscow",
  "краснодар": "Europe/Moscow",
  "ростов-на-дону": "Europe/Moscow",
  "нижний новгород": "Europe/Moscow",
  "казань": "Europe/Moscow",
  "воронеж": "Europe/Moscow",
  "волгоград": "Europe/Volgograd",
  "самара": "Europe/Samara",
  "ижевск": "Europe/Samara",
  "саратов": "Europe/Saratov",
  "ульяновск": "Europe/Ulyanovsk",
  "астрахань": "Europe/Astrakhan",
  "калининград": "Europe/Kaliningrad",
  "уфа": "Asia/Yekaterinburg",
  "екатеринбург": "Asia/Yekaterinburg",
  "челябинск": "Asia/Yekaterinburg",
  "пермь": "Asia/Yekaterinburg",
  "тюмень": "Asia/Yekaterinburg",
  "оренбург": "Asia/Yekaterinburg",
  "омск": "Asia/Omsk",
  "новосибирск": "Asia/Novosibirsk",
  "барнаул": "Asia/Barnaul",
  "томск": "Asia/Tomsk",
  "кемерово": "Asia/Novokuznetsk",
  "новокузнецк": "Asia/Novokuznetsk",
  "красноярск": "Asia/Krasnoyarsk",
  "норильск": "Asia/Krasnoyarsk",
  "иркутск": "Asia/Irkutsk",
  "улан-удэ": "Asia/Irkutsk",
  "чита": "Asia/Chita",
  "якутск": "Asia/Yakutsk",
  "благовещенск": "Asia/Yakutsk",
  "хабаровск": "Asia/Vladivostok",
  "владивосток": "Asia/Vladivostok",
  "магадан": "Asia/Magadan",
  "сахалин": "Asia/Sakhalin",
  "южно-сахалинск": "Asia/Sakhalin",
  "петропавловск-камчатский": "Asia/Kamchatka",
  "анадырь": "Asia/Anadyr",
  "минск": "Europe/Minsk",
  "киев": "Europe/Kiev",
  "алматы": "Asia/Almaty",
  "астана": "Asia/Almaty",
  "нур-султан": "Asia/Almaty",
  "ташкент": "Asia/Tashkent",
  "бишкек": "Asia/Bishkek",
  "ереван": "Asia/Yerevan",
  "тбилиси": "Asia/Tbilisi",
  "баку": "Asia/Baku",
};

export function getTimezoneByCity(city?: string | null): string | undefined {
  if (!city) return undefined;
  const key = city.trim().toLowerCase();
  if (CITY_TIMEZONES[key]) return CITY_TIMEZONES[key];
  for (const [k, tz] of Object.entries(CITY_TIMEZONES)) {
    if (key.includes(k)) return tz;
  }
  return undefined;
}
