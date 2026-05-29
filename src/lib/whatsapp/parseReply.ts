import type { RespondAction } from "@/lib/bookings/respond";

/**
 * Parse a free-text WhatsApp reply into a booking action.
 *
 * Accepts a small set of Spanish/English affirmatives and negatives, plus
 * the "1"/"2" shortcuts. Returns null when the text isn't a clear yes/no so
 * the caller can ignore it (or send a hint).
 */
const CONFIRM = new Set([
  "si", "sí", "1", "yes", "y", "ok", "okay", "vale",
  "confirmar", "confirmo", "aceptar", "acepto", "👍", "✅",
]);

const REJECT = new Set([
  "no", "2", "n", "nope", "rechazar", "rechazo", "cancelar", "cancelo", "👎", "❌",
]);

function normalize(text: string): string {
  return text
    .trim()
    .toLowerCase()
    // strip accents so "sí" matches "si" (combining marks only; emoji unaffected)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[.!¡¿?]+$/g, "")
    .trim();
}

export function parseReply(body: string): RespondAction | null {
  const raw = (body ?? "").trim();
  if (!raw) return null;

  // Match the whole message first, then the first token (handles "Sí, confirmo").
  const candidates = [normalize(raw), normalize(raw.split(/\s+/)[0] ?? "")];

  for (const c of candidates) {
    if (CONFIRM.has(c)) return "confirm";
    if (REJECT.has(c)) return "reject";
  }
  return null;
}
