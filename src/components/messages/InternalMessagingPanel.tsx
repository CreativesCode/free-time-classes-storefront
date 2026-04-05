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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const MESSAGING_LOAD_TIMEOUT_MS = 45_000;
import { toast } from "sonner";
import { ArrowLeft, MessageCircle, Search, SendHorizontal } from "lucide-react";

/** Evita desfase horario: ISO sin zona se interpreta como local; timestamptz de Supabase es UTC. */
function dateFromSupabaseTimestamptz(value: string): Date {
  const s = value.trim();
  if (!s) return new Date(NaN);
  if (/[zZ]$/.test(s) || /[+-]\d{2}:\d{2}/.test(s)) {
    return new Date(s);
  }
  const normalized = s.includes("T") ? s : s.replace(" ", "T");
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(normalized)) {
    return new Date(`${normalized}Z`);
  }
  return new Date(s);
}

type InternalMessagingPanelProps = {
  namespace: "studentProfile" | "teacherProfile" | "messagesPage";
};

export default function InternalMessagingPanel({
  namespace,
}: InternalMessagingPanelProps) {
  const { user, isLoading: authLoading } = useAuth();
  const locale = useLocale();
  const t = useTranslations(namespace);
  const tm = useTranslations(`${namespace}.messaging`);
  const tmRef = useRef(tm);
  tmRef.current = tm;
  const loadRequestIdRef = useRef(0);

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
  const [showMobileChat, setShowMobileChat] = useState(false);

  const getPendingContacts = useCallback(async (): Promise<MessageContact[]> => {
    const byId = new Map<string, MessageContact>();

    const loadStudentPending =
      namespace === "studentProfile" ||
      (namespace === "messagesPage" && Boolean(user?.is_student));
    const loadTutorPending =
      namespace === "teacherProfile" ||
      (namespace === "messagesPage" && Boolean(user?.is_tutor));

    if (loadStudentPending) {
      try {
        const studentPending = await fetch(`/api/bookings/student/pending`);
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
    }

    if (loadTutorPending) {
      try {
        const tutorPending = await fetch(`/api/bookings/tutor/pending`);
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
    }

    return Array.from(byId.values());
  }, [namespace, user?.is_student, user?.is_tutor]);

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  );
  const hasConversationData = conversations.length > 0 || contacts.length > 0;

  useEffect(() => {
    const requestId = ++loadRequestIdRef.current;
    let cancelled = false;

    async function loadInitial() {
      if (authLoading) return;
      if (!user?.id) {
        if (!cancelled && loadRequestIdRef.current === requestId) setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const loadPromise = Promise.all([
          getUserConversations(user.id),
          getMessagingContacts(user.id),
          getFavoriteMessagingContacts(user.id),
          getPendingContacts(),
        ]);
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("messaging_load_timeout")), MESSAGING_LOAD_TIMEOUT_MS);
        });
        const [list, bookingContacts, favoriteContacts, pendingContacts] = await Promise.race([
          loadPromise,
          timeoutPromise,
        ]);
        if (cancelled || loadRequestIdRef.current !== requestId) return;
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
        if (list.length > 0) {
          setSelectedConversationId(list[0].id);
        }
      } catch (e) {
        console.error("Error loading messaging module:", e);
        if (!cancelled && loadRequestIdRef.current === requestId) {
          toast.error(tmRef.current("loadError"));
        }
      } finally {
        if (!cancelled && loadRequestIdRef.current === requestId) {
          setLoading(false);
        }
      }
    }
    void loadInitial();
    return () => {
      cancelled = true;
    };
  }, [authLoading, getPendingContacts, user?.id]);

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
        toast.error(tmRef.current("loadMessagesError"));
      }
    }
    void loadMessages();
    return () => {
      cancelled = true;
    };
  }, [selectedConversationId, user?.id]);

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

  const formatMessageDate = (value: string) =>
    dateFromSupabaseTimestamptz(value).toLocaleString(locale, {
      hour: "2-digit",
      minute: "2-digit",
      month: "short",
      day: "numeric",
    });

  const openConversation = (conversationId: number) => {
    setSelectedConversationId(conversationId);
    setShowMobileChat(true);
  };

  if (authLoading || loading) {
    return (
      <div className="rounded-md border border-violet-100 bg-white/80 px-6 py-12 text-center text-sm font-medium text-violet-500 shadow-sm">
        {t("loading")}
      </div>
    );
  }

  if (!user?.id) {
    return (
      <div className="rounded-md border border-violet-100 bg-white/80 px-6 py-12 text-center text-sm text-violet-600 shadow-sm">
        {tm("notAuthenticated")}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-violet-100 bg-[#fefbff] shadow-[0_24px_60px_-40px_rgba(112,42,225,0.4)]">
      {!hasConversationData ? (
        <div className="flex min-h-[560px] flex-col items-center justify-center gap-6 px-8 py-16 text-center">
          <div className="relative">
            <div className="absolute -inset-6 rounded-full bg-violet-200/40 blur-2xl" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-md bg-violet-100 text-violet-700">
              <MessageCircle className="h-11 w-11" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight text-violet-950">{tm("emptyConversations")}</h2>
            <p className="mx-auto max-w-xl text-sm text-violet-500">{tm("selectConversationHelp")}</p>
          </div>
        </div>
      ) : (
        <div className="grid h-[min(78vh,820px)] grid-cols-1 md:grid-cols-[360px_1fr] xl:grid-cols-[380px_1fr]">
          <aside
            className={`flex flex-col border-r border-violet-100 bg-white/80 ${
              showMobileChat ? "hidden md:flex" : "flex"
            }`}
          >
            <div className="border-b border-violet-100 p-4 sm:p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400">{tm("title")}</p>
              <div className="mt-3 rounded-full border border-violet-200 bg-violet-50/70 px-3">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-violet-400" />
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder={tm("searchPlaceholder")}
                    className="h-11 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
                  />
                </div>
              </div>
              {searchTerm.trim().length >= 2 ? (
                <div className="mt-3 space-y-2 rounded-md border border-violet-100 bg-white p-3">
                  {searching ? (
                    <p className="text-xs text-violet-400">{tm("searching")}</p>
                  ) : searchResults.length === 0 ? (
                    <p className="text-xs text-violet-400">{tm("searchNoResults")}</p>
                  ) : (
                    searchResults.map((contact) => (
                      <div
                        key={`search-${contact.id}`}
                        className="flex items-center justify-between gap-2 rounded-md bg-violet-50/60 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-violet-950">{contact.username}</p>
                          <p className="truncate text-xs text-violet-500">{contact.email}</p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="border-violet-200 text-violet-700"
                          disabled={creatingConversationWith === contact.id}
                          onClick={() => void startConversation(contact.id)}
                        >
                          {creatingConversationWith === contact.id ? tm("creating") : tm("open")}
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              ) : null}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {conversations.length === 0 ? (
                <div className="rounded-md border border-dashed border-violet-200 bg-violet-50/50 p-4 text-sm text-violet-500">
                  {tm("emptyConversations")}
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => openConversation(conversation.id)}
                      className={`w-full rounded-md px-4 py-3 text-left transition ${
                        conversation.id === selectedConversationId
                          ? "bg-violet-100 text-violet-900"
                          : "bg-white text-violet-700 hover:bg-violet-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-bold">
                          {conversation.other_user.username}
                        </span>
                        {conversation.unread_count > 0 ? (
                          <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold text-white">
                            {conversation.unread_count}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 truncate text-xs text-violet-500">
                        {conversation.last_message_content || tm("noMessagesYet")}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-4 rounded-md border border-violet-100 bg-white p-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-violet-400">
                  {tm("startConversation")}
                </p>
                <div className="max-h-44 space-y-2 overflow-y-auto">
                  {contacts.length === 0 ? (
                    <p className="text-xs text-violet-500">{tm("noContacts")}</p>
                  ) : (
                    contacts.map((contact) => (
                      <div key={contact.id} className="flex items-center justify-between gap-2 rounded-md bg-violet-50/60 px-3 py-2">
                        <span className="truncate text-sm font-medium text-violet-900">{contact.username}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-md border-violet-200 text-violet-700"
                          disabled={creatingConversationWith === contact.id}
                          onClick={() => void startConversation(contact.id)}
                        >
                          {creatingConversationWith === contact.id ? tm("creating") : tm("open")}
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </aside>

          <section className={`${showMobileChat ? "flex" : "hidden md:flex"} min-h-0 flex-col bg-[#fcf8ff]`}>
            <header className="flex items-center gap-3 border-b border-violet-100 bg-white/70 px-4 py-4 sm:px-6">
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-violet-700 md:hidden"
                onClick={() => setShowMobileChat(false)}
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-black text-violet-950 sm:text-base">
                  {selectedConversation
                    ? tm("chatWith", { name: selectedConversation.other_user.username })
                    : tm("selectConversation")}
                </h2>
                <p className="text-xs text-violet-500">{tm("messagePlaceholder")}</p>
              </div>
            </header>

            {selectedConversationId ? (
              <>
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
                  {messages.length === 0 ? (
                    <div className="rounded-md border border-dashed border-violet-200 bg-white p-4 text-sm text-violet-500">
                      {tm("noMessagesYet")}
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isMine = message.sender_id === user?.id;
                      return (
                        <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[88%] rounded-md px-4 py-3 sm:max-w-[78%] ${
                              isMine
                                ? "rounded-br-md bg-gradient-to-br from-violet-600 to-violet-500 text-white"
                                : "rounded-bl-md bg-white text-violet-900 shadow-sm"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
                            <p className={`mt-1 text-[10px] ${isMine ? "text-violet-100" : "text-violet-400"}`}>
                              {formatMessageDate(message.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="border-t border-violet-100 bg-white/85 px-4 py-3 sm:px-6">
                  <div className="flex items-end gap-2 rounded-md border border-violet-200 bg-white p-2">
                    <Textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key !== "Enter" || e.shiftKey) return;
                        e.preventDefault();
                        if (!messageText.trim() || sending) return;
                        void handleSend();
                      }}
                      placeholder={tm("messagePlaceholder")}
                      rows={2}
                      maxLength={2000}
                      className="min-h-[48px] resize-none border-0 bg-transparent px-2 py-2 text-sm shadow-none focus-visible:ring-0"
                    />
                    <Button
                      type="button"
                      onClick={() => void handleSend()}
                      disabled={!messageText.trim() || sending}
                      className="h-10 rounded-full bg-violet-600 px-4 hover:bg-violet-700"
                    >
                      <SendHorizontal className="mr-1 h-4 w-4" />
                      {sending ? tm("sending") : tm("send")}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-violet-500">
                {tm("selectConversationHelp")}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
