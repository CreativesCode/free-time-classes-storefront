import type {
  ConversationListItem,
  DirectMessage,
  MessageContact,
} from "@/types/message";
import { createClient } from "../client";

const supabase = createClient();

async function getUsersByIds(ids: string[]): Promise<MessageContact[]> {
  if (ids.length === 0) return [];

  const { data: users, error } = await supabase
    .from("users")
    .select("id, username, email, profile_picture")
    .in("id", ids)
    .order("username", { ascending: true });

  if (error) throw error;
  return (users || []) as MessageContact[];
}

export async function getMessagingContacts(userId: string): Promise<MessageContact[]> {
  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("student_id, tutor_id")
    .or(`student_id.eq.${userId},tutor_id.eq.${userId}`);

  if (bookingsError) throw bookingsError;

  const ids = new Set<string>();
  for (const row of bookings || []) {
    if (row.student_id && row.student_id !== userId) ids.add(row.student_id);
    if (row.tutor_id && row.tutor_id !== userId) ids.add(row.tutor_id);
  }

  return getUsersByIds(Array.from(ids));
}

export async function getFavoriteMessagingContacts(
  userId: string
): Promise<MessageContact[]> {
  const { data: favoriteRows, error } = await supabase
    .from("student_favorite_tutors")
    .select("student_id, tutor_id")
    .or(`student_id.eq.${userId},tutor_id.eq.${userId}`);

  if (error) throw error;

  const ids = new Set<string>();
  for (const row of favoriteRows || []) {
    if (row.student_id && row.student_id !== userId) ids.add(row.student_id);
    if (row.tutor_id && row.tutor_id !== userId) ids.add(row.tutor_id);
  }

  return getUsersByIds(Array.from(ids));
}

export async function searchMessagingUsers(
  currentUserId: string,
  term: string
): Promise<MessageContact[]> {
  const query = term.trim();
  if (query.length < 2) return [];

  const { data, error } = await supabase
    .from("users")
    .select("id, username, email, profile_picture")
    .neq("id", currentUserId)
    .or(`username.ilike.%${query}%,email.ilike.%${query}%`)
    .order("username", { ascending: true })
    .limit(10);

  if (error) throw error;
  return (data || []) as MessageContact[];
}

type InboxRpcRow = {
  id: number;
  other_user: MessageContact;
  last_message_content: string | null;
  last_message_created_at: string | null;
  unread_count: number;
  updated_at: string;
};

/**
 * Loads direct conversations for the current session user.
 * Uses DB RPC (list_my_conversation_inbox): tutors cannot SELECT student rows in public.users
 * under RLS (only is_tutor profiles are publicly readable), so the old client-side join dropped
 * every thread for tutors when the other party was a student.
 */
export async function getUserConversations(userId: string): Promise<ConversationListItem[]> {
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser?.id || authUser.id !== userId) {
    return [];
  }

  const { data, error } = await supabase.rpc("list_my_conversation_inbox");
  if (error) throw error;

  const raw = data as InboxRpcRow[] | null;
  if (!raw || !Array.isArray(raw)) {
    return [];
  }

  return raw.map((row) => ({
    id: row.id,
    other_user: {
      id: row.other_user.id,
      username: row.other_user.username,
      email: row.other_user.email,
      profile_picture: row.other_user.profile_picture ?? null,
    },
    last_message_content: row.last_message_content,
    last_message_created_at: row.last_message_created_at,
    unread_count: row.unread_count ?? 0,
    updated_at: row.updated_at,
  }));
}

export async function getOrCreateDirectConversationId(
  otherUserId: string
): Promise<number> {
  const { data, error } = await supabase.rpc("get_or_create_direct_conversation", {
    other_user: otherUserId,
  });
  if (error) throw error;
  return data as number;
}

export async function getConversationMessages(
  conversationId: number
): Promise<DirectMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []) as DirectMessage[];
}

export async function sendMessage(
  conversationId: number,
  _senderId: string,
  content: string
): Promise<DirectMessage> {
  const text = content.trim();
  if (!text) {
    throw new Error("El mensaje no puede estar vacío.");
  }

  // Routed through the server so it can notify the other participant (in-app +
  // WhatsApp). The sender is derived from the session there, so _senderId is
  // kept only for signature compatibility.
  const res = await fetch("/api/messages/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversationId, content: text }),
  });

  const payload = (await res.json().catch(() => null)) as
    | (DirectMessage & { error?: string })
    | null;

  if (!res.ok || !payload || payload.error) {
    throw new Error(payload?.error || "No se pudo enviar el mensaje.");
  }

  return payload as DirectMessage;
}

export async function markConversationAsRead(
  conversationId: number,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);
  if (error) throw error;
}
