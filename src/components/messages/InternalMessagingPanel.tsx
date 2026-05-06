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
      setShowMobileChat(true);
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
      <div className="rounded-ft-lg border border-ft-line-soft bg-ft-paper px-6 py-12 text-center text-sm font-medium text-ft-ink-3">
        {t("loading")}
      </div>
    );
  }

  if (!user?.id) {
    return (
      <div className="rounded-ft-lg border border-ft-line-soft bg-ft-paper px-6 py-12 text-center text-sm text-ft-ink-2">
        {tm("notAuthenticated")}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-ft-lg border border-ft-line-soft bg-ft-paper">
      {!hasConversationData ? (
        <div className="flex min-h-[560px] flex-col items-center justify-center gap-6 px-8 py-16 text-center">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-ft-surface-2 text-ft-accent-deep">
            <MessageCircle className="h-9 w-9" />
          </div>
          <div className="space-y-2">
            <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-ft-ink">
              {tm("emptyConversations")}
            </h2>
            <p className="mx-auto max-w-xl text-[13px] text-ft-ink-3">
              {tm("selectConversationHelp")}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid h-[min(78vh,820px)] grid-cols-1 md:grid-cols-[320px_1fr] xl:grid-cols-[360px_1fr]">
          <aside
            className={`flex flex-col border-r border-ft-line-soft bg-ft-paper ${
              showMobileChat ? "hidden md:flex" : "flex"
            }`}
          >
            <div className="border-b border-ft-line-soft p-4 sm:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ft-ink-3">
                {tm("title")}
              </p>
              <div className="mt-3 flex items-center gap-2 rounded-ft border border-ft-line bg-ft-surface-1 px-3">
                <Search className="h-4 w-4 text-ft-ink-3" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={tm("searchPlaceholder")}
                  className="h-11 border-0 bg-transparent px-0 text-sm shadow-none placeholder:text-ft-ink-3 focus-visible:ring-0"
                />
              </div>
              {searchTerm.trim().length >= 2 ? (
                <div className="mt-3 space-y-2 rounded-ft border border-ft-line-soft bg-ft-paper-deep p-3">
                  {searching ? (
                    <p className="text-[12px] text-ft-ink-3">{tm("searching")}</p>
                  ) : searchResults.length === 0 ? (
                    <p className="text-[12px] text-ft-ink-3">{tm("searchNoResults")}</p>
                  ) : (
                    searchResults.map((contact) => (
                      <div
                        key={`search-${contact.id}`}
                        className="flex items-center justify-between gap-2 rounded-ft bg-ft-paper px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-ft-ink">
                            {contact.username}
                          </p>
                          <p className="truncate text-[11px] text-ft-ink-3">
                            {contact.email}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-full border-ft-line bg-ft-paper text-ft-ink hover:bg-ft-surface-1"
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
                <div className="rounded-ft border border-dashed border-ft-line bg-ft-surface-1 p-4 text-[13px] text-ft-ink-3">
                  {tm("emptyConversations")}
                </div>
              ) : (
                <div className="space-y-1">
                  {conversations.map((conversation) => {
                    const isActive = conversation.id === selectedConversationId;
                    return (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() => openConversation(conversation.id)}
                        className={`w-full rounded-ft px-3 py-3 text-left transition-colors ${
                          isActive
                            ? "bg-ft-surface-1 text-ft-ink"
                            : "bg-transparent text-ft-ink-2 hover:bg-ft-paper-deep"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-[14px] font-semibold tracking-tight text-ft-ink">
                            {conversation.other_user.username}
                          </span>
                          {conversation.unread_count > 0 ? (
                            <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-ft-accent px-1.5 text-[10px] font-bold text-[#1a1410]">
                              {conversation.unread_count}
                            </span>
                          ) : null}
                        </div>
                        <p
                          className={`mt-1 truncate text-[12px] ${
                            conversation.unread_count > 0
                              ? "font-medium text-ft-ink-2"
                              : "text-ft-ink-3"
                          }`}
                        >
                          {conversation.last_message_content || tm("noMessagesYet")}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 rounded-ft border border-ft-line-soft bg-ft-paper-deep p-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ft-ink-3">
                  {tm("startConversation")}
                </p>
                <div className="max-h-44 space-y-1 overflow-y-auto">
                  {contacts.length === 0 ? (
                    <p className="text-[12px] text-ft-ink-3">{tm("noContacts")}</p>
                  ) : (
                    contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="flex items-center justify-between gap-2 rounded-ft bg-ft-paper px-3 py-2"
                      >
                        <span className="truncate text-[13px] font-medium text-ft-ink">
                          {contact.username}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-full border-ft-line bg-ft-paper text-ft-ink hover:bg-ft-surface-1"
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

          <section
            className={`${showMobileChat ? "flex" : "hidden md:flex"} min-h-0 flex-col bg-ft-paper-deep`}
          >
            <header className="flex items-center gap-3 border-b border-ft-line-soft bg-ft-paper px-4 py-4 sm:px-6">
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-full border border-ft-line bg-ft-paper text-ft-ink hover:bg-ft-surface-1 md:hidden"
                onClick={() => setShowMobileChat(false)}
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <h2 className="truncate text-[14px] font-semibold tracking-tight text-ft-ink sm:text-[15px]">
                  {selectedConversation
                    ? tm("chatWith", { name: selectedConversation.other_user.username })
                    : tm("selectConversation")}
                </h2>
                <p className="text-[11px] text-ft-ink-3">
                  {tm("messagePlaceholder")}
                </p>
              </div>
            </header>

            {selectedConversationId ? (
              <>
                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-5 sm:px-6">
                  {messages.length === 0 ? (
                    <div className="rounded-ft border border-dashed border-ft-line bg-ft-paper p-4 text-[13px] text-ft-ink-3">
                      {tm("noMessagesYet")}
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isMine = message.sender_id === user?.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[78%] rounded-ft-lg px-4 py-2.5 text-[13.5px] leading-relaxed ${
                              isMine
                                ? "bg-ft-ink text-ft-paper"
                                : "border border-ft-line-soft bg-ft-paper text-ft-ink"
                            }`}
                            style={{
                              borderBottomRightRadius: isMine ? 6 : undefined,
                              borderBottomLeftRadius: isMine ? undefined : 6,
                            }}
                          >
                            <p className="m-0 whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                            <p
                              className={`mt-1 text-right text-[10px] tracking-[0.04em] ${
                                isMine ? "text-ft-paper/55" : "text-ft-ink-3"
                              }`}
                            >
                              {formatMessageDate(message.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="border-t border-ft-line-soft bg-ft-paper px-4 py-3 sm:px-6">
                  <div className="flex items-end gap-2 rounded-ft-md border border-ft-line bg-ft-surface-1 p-2">
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
                      className="min-h-[48px] resize-none border-0 bg-transparent px-2 py-2 text-[13.5px] text-ft-ink shadow-none placeholder:text-ft-ink-3 focus-visible:ring-0"
                    />
                    <Button
                      type="button"
                      onClick={() => void handleSend()}
                      disabled={!messageText.trim() || sending}
                      className="h-10 rounded-full bg-ft-ink px-4 text-[13px] font-semibold text-ft-paper hover:bg-[#2a241b] disabled:opacity-60"
                    >
                      <SendHorizontal className="mr-1 h-4 w-4" />
                      {sending ? tm("sending") : tm("send")}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center px-6 text-center text-[13px] text-ft-ink-3">
                {tm("selectConversationHelp")}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
