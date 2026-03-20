"use client";

import { useAuth } from "@/context/UserContext";
import {
  getFavoriteMessagingContacts,
  getConversationMessages,
  getMessagingContacts,
  getOrCreateDirectConversationId,
  searchMessagingUsers,
  getUserConversations,
  markConversationAsRead,
  sendMessage,
} from "@/lib/supabase/queries/messages";
import type { ConversationListItem, DirectMessage, MessageContact } from "@/types/message";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type InternalMessagingPanelProps = {
  namespace: "studentProfile" | "teacherProfile" | "messagesPage";
};

export default function InternalMessagingPanel({
  namespace,
}: InternalMessagingPanelProps) {
  const { user } = useAuth();
  const locale = useLocale();
  const t = useTranslations(namespace);
  const tm = useTranslations(`${namespace}.messaging`);

  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [contacts, setContacts] = useState<MessageContact[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(
    null
  );
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [creatingConversationWith, setCreatingConversationWith] = useState<string | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<MessageContact[]>([]);
  const [searching, setSearching] = useState(false);

  const getPendingContacts = useCallback(async (): Promise<MessageContact[]> => {
    const byId = new Map<string, MessageContact>();

    try {
      const studentPending = await fetch(`/${locale}/api/bookings/student/pending`);
      if (studentPending.ok) {
        const result = (await studentPending.json()) as {
          items?: Array<{ tutorId: string; tutorName?: string | null }>;
        };
        for (const item of result.items || []) {
          if (!item.tutorId) continue;
          byId.set(item.tutorId, {
            id: item.tutorId,
            username: item.tutorName || item.tutorId,
            email: "",
            profile_picture: null,
          });
        }
      }
    } catch (error) {
      console.error("Error loading student pending contacts:", error);
    }

    try {
      const tutorPending = await fetch(`/${locale}/api/bookings/tutor/pending`);
      if (tutorPending.ok) {
        const result = (await tutorPending.json()) as {
          items?: Array<{ studentId: string; studentName?: string | null }>;
        };
        for (const item of result.items || []) {
          if (!item.studentId) continue;
          byId.set(item.studentId, {
            id: item.studentId,
            username: item.studentName || item.studentId,
            email: "",
            profile_picture: null,
          });
        }
      }
    } catch (error) {
      console.error("Error loading tutor pending contacts:", error);
    }

    return Array.from(byId.values());
  }, [locale]);

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  );

  useEffect(() => {
    let cancelled = false;
    async function loadInitial() {
      if (!user?.id) return;
      try {
        setLoading(true);
        const [list, bookingContacts, favoriteContacts, pendingContacts] = await Promise.all([
          getUserConversations(user.id),
          getMessagingContacts(user.id),
          getFavoriteMessagingContacts(user.id),
          getPendingContacts(),
        ]);
        if (cancelled) return;
        setConversations(list);
        const mergedById = new Map<string, MessageContact>();
        for (const group of [bookingContacts, favoriteContacts, pendingContacts]) {
          for (const contact of group) {
            if (contact.id !== user.id && !mergedById.has(contact.id)) {
              mergedById.set(contact.id, contact);
            }
          }
        }
        const merged = Array.from(mergedById.values()).sort((a, b) =>
          (a.username || "").localeCompare(b.username || "")
        );
        setContacts(merged);
        if (list.length > 0) setSelectedConversationId(list[0].id);
      } catch (e) {
        console.error("Error loading messaging module:", e);
        toast.error(tm("loadError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadInitial();
    return () => {
      cancelled = true;
    };
  }, [getPendingContacts, tm, user?.id]);

  useEffect(() => {
    let cancelled = false;
    async function runSearch() {
      if (!user?.id) return;
      const term = searchTerm.trim();
      if (term.length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        setSearching(true);
        const results = await searchMessagingUsers(user.id, term);
        if (cancelled) return;
        setSearchResults(results);
      } catch (error) {
        console.error("Error searching messaging users:", error);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }

    const timeout = setTimeout(() => {
      void runSearch();
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [searchTerm, user?.id]);

  useEffect(() => {
    let cancelled = false;
    async function loadMessages() {
      if (!user?.id || !selectedConversationId) return;
      try {
        const list = await getConversationMessages(selectedConversationId);
        if (cancelled) return;
        setMessages(list);
        await markConversationAsRead(selectedConversationId, user.id);
        if (cancelled) return;
        setConversations((prev) =>
          prev.map((c) => (c.id === selectedConversationId ? { ...c, unread_count: 0 } : c))
        );
      } catch (e) {
        console.error("Error loading conversation messages:", e);
        toast.error(tm("loadMessagesError"));
      }
    }
    void loadMessages();
    return () => {
      cancelled = true;
    };
  }, [selectedConversationId, user?.id, tm]);

  const startConversation = async (contactId: string) => {
    if (!user?.id) return;
    try {
      setCreatingConversationWith(contactId);
      const conversationId = await getOrCreateDirectConversationId(contactId);
      const refreshed = await getUserConversations(user.id);
      setConversations(refreshed);
      setSelectedConversationId(conversationId);
    } catch (e) {
      console.error("Error creating direct conversation:", e);
      toast.error(tm("createConversationError"));
    } finally {
      setCreatingConversationWith(null);
    }
  };

  const handleSend = async () => {
    if (!user?.id || !selectedConversationId || !messageText.trim() || sending) return;
    try {
      setSending(true);
      const created = await sendMessage(selectedConversationId, user.id, messageText);
      setMessages((prev) => [...prev, created]);
      setMessageText("");
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConversationId
            ? {
                ...c,
                last_message_content: created.content,
                last_message_created_at: created.created_at,
              }
            : c
        )
      );
    } catch (e) {
      console.error("Error sending message:", e);
      toast.error(tm("sendError"));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-gray-500">
          {t("loading")}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>{tm("title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-h-64 overflow-y-auto space-y-2">
            {conversations.length === 0 ? (
              <p className="text-sm text-gray-500">{tm("emptyConversations")}</p>
            ) : (
              conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setSelectedConversationId(conversation.id)}
                  className={`w-full rounded-md border p-3 text-left transition ${
                    conversation.id === selectedConversationId
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium truncate">
                      {conversation.other_user.username}
                    </span>
                    {conversation.unread_count > 0 ? (
                      <span className="text-xs rounded-full bg-primary-600 px-2 py-0.5 text-white">
                        {conversation.unread_count}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-gray-500 truncate">
                    {conversation.last_message_content || tm("noMessagesYet")}
                  </p>
                </button>
              ))
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">{tm("startConversation")}</p>
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={tm("searchPlaceholder")}
            />
            {searchTerm.trim().length >= 2 ? (
              <div className="max-h-40 overflow-y-auto space-y-2 rounded-md border border-gray-200 p-2">
                {searching ? (
                  <p className="text-xs text-gray-500">{tm("searching")}</p>
                ) : searchResults.length === 0 ? (
                  <p className="text-xs text-gray-500">{tm("searchNoResults")}</p>
                ) : (
                  searchResults.map((contact) => (
                    <div
                      key={`search-${contact.id}`}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm truncate">{contact.username}</p>
                        <p className="text-xs text-gray-500 truncate">{contact.email}</p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={creatingConversationWith === contact.id}
                        onClick={() => void startConversation(contact.id)}
                      >
                        {creatingConversationWith === contact.id
                          ? tm("creating")
                          : tm("open")}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            ) : null}
            <div className="max-h-56 overflow-y-auto space-y-2">
              {contacts.length === 0 ? (
                <p className="text-xs text-gray-500">{tm("noContacts")}</p>
              ) : (
                contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-gray-200 p-2"
                  >
                    <span className="text-sm truncate">{contact.username}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={creatingConversationWith === contact.id}
                      onClick={() => void startConversation(contact.id)}
                    >
                      {creatingConversationWith === contact.id
                        ? tm("creating")
                        : tm("open")}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedConversation
              ? tm("chatWith", { name: selectedConversation.other_user.username })
              : tm("selectConversation")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedConversationId ? (
            <div className="space-y-3">
              <div className="h-[360px] overflow-y-auto rounded-md border border-gray-200 p-3 space-y-3">
                {messages.length === 0 ? (
                  <p className="text-sm text-gray-500">{tm("noMessagesYet")}</p>
                ) : (
                  messages.map((message) => {
                    const isMine = message.sender_id === user?.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                            isMine
                              ? "bg-primary-600 text-white"
                              : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{message.content}</p>
                          <p
                            className={`mt-1 text-[11px] ${
                              isMine ? "text-primary-100" : "text-gray-500"
                            }`}
                          >
                            {new Date(message.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="space-y-2">
                <Textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={tm("messagePlaceholder")}
                  rows={3}
                  maxLength={2000}
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={() => void handleSend()}
                    disabled={!messageText.trim() || sending}
                  >
                    {sending ? tm("sending") : tm("send")}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">{tm("selectConversationHelp")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
