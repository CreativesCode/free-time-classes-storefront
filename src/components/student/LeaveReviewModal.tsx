"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/UserContext";
import { useTranslations } from "@/i18n/translations";
import { toast } from "sonner";
import { Star } from "lucide-react";
import type { Review } from "@/types/review";
import { createReview } from "@/lib/supabase/queries/reviews";

export default function LeaveReviewModal(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: number | null;
  tutorId: string | null;
  onCreated: (review: Review) => void;
}) {
  const { user } = useAuth();
  const t = useTranslations("studentProfile");

  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const isReady = useMemo(
    () => Boolean(user?.id && props.bookingId && props.tutorId),
    [props.bookingId, props.tutorId, user?.id]
  );

  useEffect(() => {
    if (!props.open) return;
    setRating(5);
    setComment("");
  }, [props.open, props.bookingId, props.tutorId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user?.id || !props.bookingId || !props.tutorId) return;

    const trimmed = comment.trim();
    if (trimmed.length === 0) {
      toast.error(t("reviewCommentRequired"));
      return;
    }

    setSubmitting(true);
    try {
      const created = await createReview({
        booking_id: props.bookingId,
        student_id: user.id,
        tutor_id: props.tutorId,
        rating,
        comment: trimmed,
      });

      props.onCreated(created);
      toast.success(t("reviewSubmittedSuccess"));
      props.onOpenChange(false);
    } catch (err) {
      console.error("[reviews] createReview error:", err);
      toast.error(t("reviewSubmitError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{t("leaveReviewTitle")}</DialogTitle>
          <DialogDescription>{t("leaveReviewDescription")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">{t("reviewRating")}</div>
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, idx) => {
                const value = idx + 1;
                const active = value <= rating;
                return (
                  <button
                    key={value}
                    type="button"
                    className="p-0.5 rounded hover:opacity-90"
                    onClick={() => setRating(value)}
                    aria-label={`${value}/5`}
                  >
                    <Star
                      className={active ? "h-6 w-6 text-primary-600" : "h-6 w-6 text-gray-300"}
                      fill={active ? "currentColor" : "transparent"}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">{t("reviewComment")}</div>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("reviewCommentPlaceholder")}
              className="min-h-[120px]"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={!isReady || submitting}>
              {submitting ? t("reviewSubmitting") : t("reviewSubmit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

