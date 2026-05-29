import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Resolve which pending booking an inbound WhatsApp reply belongs to.
 *
 * WhatsApp reports the sender as an `@lid` (an anonymous Linked ID) that is
 * NOT the phone number we sent to. We can't match it against `users.phone`.
 * Instead we match `from` against the delivered `message_id` of our outbound
 * messages (the id contains the delivered chatId — guide §5.4), and fall back
 * to the stored `chat_id` digit suffix when the reply comes as `@c.us`.
 *
 * Among matches, we return the most recent one whose booking is still pending.
 */
export async function matchPendingBooking(
  admin: SupabaseClient,
  from: string,
): Promise<{ bookingId: number; tutorId: string } | null> {
  const fromTrimmed = (from ?? "").trim();
  if (!fromTrimmed) return null;

  // The bare identifier without the @c.us / @lid suffix.
  const bareId = fromTrimmed.replace(/@(c\.us|lid|s\.whatsapp\.net)$/i, "");
  const digits = bareId.replace(/[^\d]/g, "");

  // Outbound rows whose delivered message_id embeds this sender id, or whose
  // chat_id shares the same trailing digits. Newest first.
  const orFilters = [`message_id.ilike.%${bareId}%`];
  if (digits) orFilters.push(`chat_id.ilike.%${digits}@c.us`);

  const { data: rows, error } = await admin
    .from("wa_messages")
    .select("booking_id, user_id, created_at")
    .eq("direction", "outbound")
    .not("booking_id", "is", null)
    .or(orFilters.join(","))
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !rows?.length) return null;

  // De-dup booking ids preserving recency, then pick the first still pending.
  const seen = new Set<number>();
  for (const row of rows) {
    const bookingId = row.booking_id as number | null;
    const tutorId = row.user_id as string | null;
    if (!bookingId || !tutorId || seen.has(bookingId)) continue;
    seen.add(bookingId);

    const { data: booking } = await admin
      .from("bookings")
      .select("id, status, tutor_id")
      .eq("id", bookingId)
      .single();

    if (booking?.status === "pending" && booking.tutor_id === tutorId) {
      return { bookingId, tutorId };
    }
  }

  return null;
}
