"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocale, useTranslations } from "@/i18n/translations";
import { useAuth } from "@/context/UserContext";
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

type PendingBookingItem = {
  bookingId: number;
  studentId: string;
  studentName: string | null;
  subjectName: string | null;
  scheduledDateTime: string | null;
  durationMinutes: number | null;
  price: number | null;
};

export default function TutorBookingRequests() {
  const t = useTranslations("teacherProfile.requests");
  const locale = useLocale();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<PendingBookingItem[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PendingBookingItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const loadPendingRequests = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const response = await fetch(`/${locale}/api/bookings/tutor/pending`, {
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
    reason?: string
  ) => {
    setActionLoadingId(bookingId);
    try {
      const response = await fetch(`/${locale}/api/bookings/tutor/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          action,
          ...(action === "reject" ? { reason: reason || "" } : {}),
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error || t("actionError"));
      }
      toast.success(action === "confirm" ? t("confirmSuccess") : t("rejectSuccess"));
      await loadPendingRequests();
      setRejectTarget(null);
      setRejectReason("");
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
                    onClick={() => void respond(item.bookingId, "confirm")}
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
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{t("rejectDialogTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>{t("rejectReasonLabel")}</Label>
            <Input
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder={t("rejectReasonPlaceholder")}
            />
          </div>
          <DialogFooter>
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
    </Card>
  );
}

