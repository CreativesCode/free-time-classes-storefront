"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "@/i18n/translations";
import { useAuth } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Video } from "lucide-react";

type PendingBookingItem = {
  bookingId: number;
  studentId: string;
  studentName: string | null;
  subjectName: string | null;
  scheduledDateTime: string | null;
  durationMinutes: number | null;
  price: number | null;
};

export default function TutorBookingRequests({
  onRequestResponded,
}: {
  onRequestResponded?: () => void;
}) {
  const t = useTranslations("teacherProfile.requests");
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<PendingBookingItem[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PendingBookingItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [confirmTarget, setConfirmTarget] = useState<PendingBookingItem | null>(null);
  const [meetLink, setMeetLink] = useState("");

  const loadPendingRequests = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/bookings/tutor/pending`, {
        method: "GET",
      });
      const result = (await response.json()) as {
        error?: string;
        items?: PendingBookingItem[];
      };
      if (!response.ok) {
        throw new Error(result.error || t("loadError"));
      }
      setItems(result.items || []);
    } catch (error) {
      console.error("Error loading tutor requests:", error);
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPendingRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const respond = async (
    bookingId: number,
    action: "confirm" | "reject",
    reason?: string,
    videoLink?: string
  ) => {
    setActionLoadingId(bookingId);
    try {
      const response = await fetch(`/api/bookings/tutor/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          action,
          ...(action === "reject" ? { reason: reason || "" } : {}),
          ...(action === "confirm" && videoLink ? { meetLink: videoLink } : {}),
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error || t("actionError"));
      }
      toast.success(action === "confirm" ? t("confirmSuccess") : t("rejectSuccess"));
      setItems((previous) => previous.filter((item) => item.bookingId !== bookingId));
      await loadPendingRequests();
      onRequestResponded?.();
      router.refresh();
      setRejectTarget(null);
      setRejectReason("");
      setConfirmTarget(null);
      setMeetLink("");
    } catch (error) {
      console.error("Error responding booking:", error);
      toast.error(error instanceof Error ? error.message : t("actionError"));
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="text-primary-800">{t("title")}</CardTitle>
          <p className="text-sm text-gray-600">{t("description")}</p>
        </div>
        <Badge variant="secondary">
          {items.length} {t("pendingCount")}
        </Badge>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 text-center text-sm text-gray-500">{t("loading")}</div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">{t("empty")}</div>
        ) : (
          <div className="grid gap-4">
            {items.map((item) => (
              <div key={item.bookingId} className="rounded-lg border bg-white p-4 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">
                      {item.subjectName ?? t("lessonUnknown")}
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {t("student")}: {item.studentName ?? item.studentId}
                    </p>
                  </div>
                  <Badge variant="secondary">{t("pendingBadge")}</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-700">
                  <div>
                    <p className="text-gray-500">{t("dateTime")}</p>
                    <p>
                      {item.scheduledDateTime
                        ? new Date(item.scheduledDateTime).toLocaleString()
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">{t("duration")}</p>
                    <p>
                      {item.durationMinutes ?? "—"} {t("minutes")}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">{t("price")}</p>
                    <p>${item.price ?? "—"}</p>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    disabled={actionLoadingId === item.bookingId}
                    onClick={() => setRejectTarget(item)}
                  >
                    {actionLoadingId === item.bookingId
                      ? t("rejectLoading")
                      : t("reject")}
                  </Button>
                  <Button
                    disabled={actionLoadingId === item.bookingId}
                    onClick={() => {
                      setConfirmTarget(item);
                      setMeetLink("");
                    }}
                  >
                    {actionLoadingId === item.bookingId
                      ? t("acceptLoading")
                      : t("accept")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog
        open={!!rejectTarget}
        onOpenChange={(open) => {
          if (!open && actionLoadingId === null) {
            setRejectTarget(null);
            setRejectReason("");
          }
        }}
      >
        <DialogContent className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden p-0 sm:max-w-[520px]">
          <DialogHeader className="px-4 pt-6 sm:px-6">
            <DialogTitle>{t("rejectDialogTitle")}</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-1 sm:px-6">
            <div className="space-y-2">
              <Label>{t("rejectReasonLabel")}</Label>
              <Input
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder={t("rejectReasonPlaceholder")}
              />
            </div>
          </div>
          <DialogFooter className="mt-2 flex shrink-0 flex-col gap-2 border-t bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-6">
            <Button
              variant="outline"
              onClick={() => setRejectTarget(null)}
              disabled={actionLoadingId !== null}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                rejectTarget && void respond(rejectTarget.bookingId, "reject", rejectReason)
              }
              disabled={actionLoadingId !== null}
            >
              {t("confirmReject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!confirmTarget}
        onOpenChange={(open) => {
          if (!open && actionLoadingId === null) {
            setConfirmTarget(null);
            setMeetLink("");
          }
        }}
      >
        <DialogContent className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden p-0 sm:max-w-[520px]">
          <DialogHeader className="px-4 pt-6 sm:px-6">
            <DialogTitle>{t("accept")}</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-1 sm:px-6">
            <div className="space-y-3">
              {confirmTarget && (
                <div className="rounded-lg bg-violet-50 p-3 text-sm text-slate-700">
                  <p className="font-semibold">{confirmTarget.subjectName ?? t("lessonUnknown")}</p>
                  <p className="text-xs text-slate-500">
                    {t("student")}: {confirmTarget.studentName ?? confirmTarget.studentId}
                    {" · "}
                    {confirmTarget.scheduledDateTime
                      ? new Date(confirmTarget.scheduledDateTime).toLocaleString()
                      : "—"}
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-violet-600" />
                  {t("meetLinkLabel")}
                </Label>
                <Input
                  type="url"
                  value={meetLink}
                  onChange={(event) => setMeetLink(event.target.value)}
                  placeholder={t("meetLinkPlaceholder")}
                />
                <p className="text-xs text-slate-500">{t("meetLinkHint")}</p>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-2 flex shrink-0 flex-col gap-2 border-t bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-6">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmTarget(null);
                setMeetLink("");
              }}
              disabled={actionLoadingId !== null}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={() =>
                confirmTarget &&
                void respond(confirmTarget.bookingId, "confirm", undefined, meetLink)
              }
              disabled={actionLoadingId !== null}
            >
              {actionLoadingId !== null ? t("acceptLoading") : meetLink ? t("confirmWithLink") : t("accept")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

