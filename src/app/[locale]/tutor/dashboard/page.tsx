"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/UserContext";
import { useTranslations } from "@/i18n/translations";
import {
  createBookingRejection,
  getBookingsByTutor,
  updateBooking,
} from "@/lib/supabase/queries/bookings";
import { getLessonWithRelations, updateLesson } from "@/lib/supabase/queries/lessons";
import type {
  Booking,
  BookingRejectionReason,
} from "@/types/booking";
import type { LessonWithRelations } from "@/types/lesson";

type PendingBookingItem = {
  booking: Booking;
  lesson: LessonWithRelations | null;
};

const REJECTION_REASONS: Array<{
  value: BookingRejectionReason;
  translationKey: string;
}> = [
  { value: "tutor unavailable", translationKey: "tutorUnavailable" },
  { value: "sick tutor", translationKey: "sickTutor" },
  { value: "sick student", translationKey: "sickStudent" },
  { value: "scheduling conflict", translationKey: "schedulingConflict" },
  { value: "emergency", translationKey: "emergency" },
  { value: "technical issues", translationKey: "technicalIssues" },
  { value: "other", translationKey: "other" },
];

export default function TutorDashboardPage() {
  const t = useTranslations("tutorDashboardPage");
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [pendingItems, setPendingItems] = useState<PendingBookingItem[]>([]);

  const [actionLoadingBookingId, setActionLoadingBookingId] = useState<number | null>(null);

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<PendingBookingItem | null>(null);
  const [rejectReason, setRejectReason] = useState<BookingRejectionReason>("tutor unavailable");

  const loadPending = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const bookings = await getBookingsByTutor(user.id);
      const pendingBookings = bookings.filter(
        (b) => b.status === "pending" && typeof b.lesson_id === "number"
      );

      const items = await Promise.all(
        pendingBookings.map(async (booking) => {
          const lesson =
            typeof booking.lesson_id === "number"
              ? await getLessonWithRelations(booking.lesson_id)
              : null;

          return { booking, lesson } satisfies PendingBookingItem;
        })
      );

      setPendingItems(items);
    } catch (e) {
      console.error("Error loading pending bookings:", e);
      toast.error(t("loadingError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const openRejectDialog = (item: PendingBookingItem) => {
    setRejectTarget(item);
    setRejectReason("tutor unavailable");
    setRejectDialogOpen(true);
  };

  const handleConfirm = async (booking: Booking) => {
    if (!user?.id) return;
    if (typeof booking.lesson_id !== "number") return;

    setActionLoadingBookingId(booking.id);
    try {
      await updateBooking(booking.id, { status: "confirmed" });

      toast.success(t("confirmSuccess"));
      await loadPending();
    } catch (e) {
      console.error("Error confirming booking:", e);
      toast.error(t("confirmError"));
    } finally {
      setActionLoadingBookingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget || !user?.id) return;
    if (typeof rejectTarget.booking.lesson_id !== "number") return;

    const { booking } = rejectTarget;
    const lessonId = booking.lesson_id;
    if (typeof lessonId !== "number") return;

    setActionLoadingBookingId(booking.id);
    try {
      await updateBooking(booking.id, { status: "rejected" });

      // Store the rejection reason
      await createBookingRejection({
        booking_id: booking.id,
        student_id: booking.student_id,
        tutor_id: booking.tutor_id,
        reason: rejectReason,
      });

      // Make the lesson available again
      await updateLesson(lessonId, {
        student_id: null,
        status: "available",
      });

      setRejectDialogOpen(false);
      setRejectTarget(null);

      toast.success(t("rejectSuccess"));
      await loadPending();
    } catch (e) {
      console.error("Error rejecting booking:", e);
      toast.error(t("rejectError"));
    } finally {
      setActionLoadingBookingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>{t("title")}</CardTitle>
            <p className="text-sm text-gray-600">{t("description")}</p>
          </div>
          <Badge variant="secondary">
            {pendingItems.length} {t("pending")}
          </Badge>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-sm text-gray-500">{t("loading")}</div>
          ) : pendingItems.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-500">
              {t("noPendingBookings")}
            </div>
          ) : (
            <div className="grid gap-4">
              {pendingItems.map(({ booking, lesson }) => {
                const scheduledLabel =
                  lesson?.scheduled_date_time
                    ? new Date(lesson.scheduled_date_time).toLocaleString()
                    : "—";

                const studentName =
                  lesson?.student?.user?.username ?? booking.student_id;

                return (
                  <div
                    key={booking.id}
                    className="border rounded-lg p-4 bg-white space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="font-semibold truncate">
                          {lesson?.subject?.name ?? t("lessonUnknown")}
                        </div>
                        <div className="text-sm text-gray-600 truncate">
                          {t("student")}: {studentName}
                        </div>
                      </div>
                      <Badge variant="secondary">{t("pending")}</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-700">
                      <div>
                        <div className="text-gray-500">{t("scheduledAt")}</div>
                        <div>{scheduledLabel}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">{t("duration")}</div>
                        <div>
                          {lesson?.duration_minutes ?? "—"} {t("minutes")}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">{t("price")}</div>
                        <div>${lesson?.price ?? "—"}</div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        onClick={() => openRejectDialog({ booking, lesson })}
                        disabled={actionLoadingBookingId === booking.id}
                      >
                        {t("reject")}
                      </Button>
                      <Button
                        onClick={() => handleConfirm(booking)}
                        disabled={actionLoadingBookingId === booking.id}
                      >
                        {t("accept")}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle>{t("rejectDialogTitle")}</DialogTitle>
          </DialogHeader>

          {rejectTarget ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("rejectReason")}</Label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value as BookingRejectionReason)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {REJECTION_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {t(`rejectionReasons.${r.translationKey}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>{t("notesOptional")}</Label>
                <Input
                  placeholder={t("notesOptionalPlaceholder")}
                  value={rejectTarget.booking.notes ?? ""}
                  disabled
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                  {t("cancelReject")}
                </Button>
                <Button
                  onClick={() => void handleReject()}
                  disabled={actionLoadingBookingId === rejectTarget.booking.id}
                >
                  {t("confirmReject")}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

