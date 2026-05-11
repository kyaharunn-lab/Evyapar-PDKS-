export const TR_LOCALE = "tr-TR";
export const TURKEY_TIME_ZONE = "Europe/Istanbul";

export const TIME_INPUT_PROPS = {
  type: "text",
  lang: TR_LOCALE,
  inputMode: "numeric",
  pattern: "[0-2][0-9]:[0-5][0-9]",
  placeholder: "HH:mm",
  maxLength: 5,
  autoComplete: "off",
  "data-locale": TR_LOCALE,
  "data-time-zone": TURKEY_TIME_ZONE,
  "data-hour12": "false",
} as const;

export function toDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") return value.toDate();

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatTimeTR(value: any, options: { seconds?: boolean } = {}) {
  const date = toDate(value);
  if (!date) return "-";

  return new Intl.DateTimeFormat(TR_LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    second: options.seconds ? "2-digit" : undefined,
    hour12: false,
    hourCycle: "h23",
    timeZone: TURKEY_TIME_ZONE,
  }).format(date);
}

export function formatDateTimeTR(value: any) {
  const date = toDate(value);
  if (!date) return "-";

  return new Intl.DateTimeFormat(TR_LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
    timeZone: TURKEY_TIME_ZONE,
  }).format(date);
}

export function formatTimeValueTR(value?: string) {
  const match = value?.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return value || "-";

  const hour = match[1].padStart(2, "0");
  return `${hour}:${match[2]}`;
}

export function getCurrentTimeInputValueTR() {
  const parts = new Intl.DateTimeFormat(TR_LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
    timeZone: TURKEY_TIME_ZONE,
  }).formatToParts(new Date());

  const hour = parts.find((part) => part.type === "hour")?.value || "00";
  const minute = parts.find((part) => part.type === "minute")?.value || "00";
  return `${hour}:${minute}`;
}

export function normalizeTimeInputTR(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}
