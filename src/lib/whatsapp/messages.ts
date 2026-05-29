/**
 * Builds the WhatsApp text body for a notification.
 *
 * The in-app notification's title/body are reused as the base, and we
 * enrich it per type with the scheduled time and the Meet link when present.
 *
 * IMPORTANT (project rule): `scheduled_date_time` is already a wall-clock
 * Madrid string (`YYYY-MM-DDThh:mm:ss`). We parse its parts directly — we do
 * NOT build a `Date`, which would reinterpret it against the server timezone.
 */
import type { NotificationType } from "@/types/notification";

const MONTHS_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** "2026-06-15T14:30:00" → "15 de junio · 14:30" (Madrid wall-clock). */
function formatLessonTime(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!m) return null;
  const [, , month, day, hour, minute] = m;
  const monthName = MONTHS_ES[Number(month) - 1] ?? month;
  return `${Number(day)} de ${monthName} · ${hour}:${minute}`;
}

export function buildWhatsAppMessage(params: {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}): string {
  const { type, title, body, data = {} } = params;

  const lines: string[] = [`*${title}*`, body];

  const when = formatLessonTime(data.scheduled_date_time);
  if (when) lines.push(`🗓️ ${when}`);

  const meetLink = typeof data.meet_link === "string" ? data.meet_link.trim() : "";
  if (type === "booking_confirmed" && meetLink) {
    lines.push(`🔗 ${meetLink}`);
  }

  lines.push("", "_FreeTime Classes_");

  return lines.filter((l) => l !== undefined).join("\n");
}
