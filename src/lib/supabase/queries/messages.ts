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

export async function getUserConversations(
  userId: string
): Promise<ConversationListItem[]> {
  const { data: ownParticipants, error: ownParticipantsError } = await supabase
    .from("conversation_participants")
    .select("conversation_id, last_read_at, conversations(id, updated_at)")
    .eq("user_id", userId);

  if (ownParticipantsError) throw ownParticipantsError;

  const conversationIds = (ownParticipants || []).map((p) => p.conversation_id);
  if (conversationIds.length === 0) return [];

  const { data: allParticipants, error: allParticipantsError } = await supabase
    .from("conversation_participants")
    .select("conversation_id, user_id")
    .in("conversation_id", conversationIds)
    .neq("user_id", userId);

  if (allParticipantsError) throw allParticipantsError;

  const otherUserByConversation = new Map<number, string>();
  const otherUserIds = new Set<string>();
  for (const p of allParticipants || []) {
    if (p.user_id) {
      otherUserByConversation.set(p.conversation_id, p.user_id);
      otherUserIds.add(p.user_id);
    }
  }

  const { data: otherUsers, error: otherUsersError } = await supabase
    .from("users")
    .select("id, username, email, profile_picture")
    .in("id", Array.from(otherUserIds));

  if (otherUsersError) throw otherUsersError;

  const userById = new Map<string, MessageContact>(
    (otherUsers || []).map((u) => [u.id, u as MessageContact])
  );

  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("id, conversation_id, content, created_at")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false });

  if (messagesError) throw messagesError;

  const lastMessageByConversation = new Map<
    number,
    { content: string; created_at: string }
  >();
  for (const msg of messages || []) {
    if (!lastMessageByConversation.has(msg.conversation_id)) {
      lastMessageByConversation.set(msg.conversation_id, {
        content: msg.content,
        created_at: msg.created_at,
      });
    }
  }

  const unreadByConversation = new Map<number, number>();
  const readAtByConversation = new Map<number, string | null>();
  for (const p of ownParticipants || []) {
    readAtByConversation.set(p.conversation_id, p.last_read_at || null);
  }
  for (const msg of messages || []) {
    const lastReadAt = readAtByConversation.get(msg.conversation_id);
    if (!lastReadAt || new Date(msg.created_at) > new Date(lastReadAt)) {
      unreadByConversation.set(
        msg.conversation_id,
        (unreadByConversation.get(msg.conversation_id) || 0) + 1
      );
    }
  }

  const rows: ConversationListItem[] = [];
  for (const p of ownParticipants || []) {
    const conversation = Array.isArray(p.conversations)
      ? p.conversations[0]
      : p.conversations;
    const otherUserId = otherUserByConversation.get(p.conversation_id);
    if (!otherUserId) continue;
    const otherUser = userById.get(otherUserId);
    if (!otherUser) continue;

    const lastMessage = lastMessageByConversation.get(p.conversation_id);
    rows.push({
      id: p.conversation_id,
      other_user: otherUser,
      last_message_content: lastMessage?.content || null,
      last_message_created_at: lastMessage?.created_at || null,
      unread_count: unreadByConversation.get(p.conversation_id) || 0,
      updated_at: conversation?.updated_at || new Date().toISOString(),
    });
  }

  return rows.sort((a, b) => {
    const aTime = new Date(
      a.last_message_created_at || a.updated_at
    ).getTime();
    const bTime = new Date(
      b.last_message_created_at || b.updated_at
    ).getTime();
    return bTime - aTime;
  });
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
  senderId: string,
  content: string
): Promise<DirectMessage> {
  const text = content.trim();
  if (!text) {
    throw new Error("El mensaje no puede estar vacío.");
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content: text,
    })
    .select("id, conversation_id, sender_id, content, created_at")
    .single();

  if (error) throw error;
  return data as DirectMessage;
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
