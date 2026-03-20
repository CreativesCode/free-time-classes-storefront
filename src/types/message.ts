export interface MessageContact {
  id: string;
  username: string;
  email: string;
  profile_picture?: string | null;
}

export interface ConversationListItem {
  id: number;
  other_user: MessageContact;
  last_message_content?: string | null;
  last_message_created_at?: string | null;
  unread_count: number;
  updated_at: string;
}

export interface DirectMessage {
  id: number;
  conversation_id: number;
  sender_id: string;
  content: string;
  created_at: string;
}
