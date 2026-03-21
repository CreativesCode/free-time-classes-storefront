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
import { cn } from "@/lib/utils";

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
  const [selectedHighlights, setSelectedHighlights] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const MAX_COMMENT_LENGTH = 500;
  const highlightOptions = [
    "Preciso",
    "Constructivo",
    "Inspirador",
    "Experto",
    "Puntual",
  ];

  const isReady = useMemo(
    () => Boolean(user?.id && props.bookingId && props.tutorId),
    [props.bookingId, props.tutorId, user?.id]
  );

  useEffect(() => {
    if (!props.open) return;
    setRating(5);
    setComment("");
    setSelectedHighlights([]);
  }, [props.open, props.bookingId, props.tutorId]);

  function toggleHighlight(tag: string) {
    setSelectedHighlights((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  }

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
              comment:
                selectedHighlights.length > 0
                  ? `[${selectedHighlights.join(", ")}] ${trimmed}`
                  : trimmed,
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
      <DialogContent className="max-h-[92vh] w-[calc(100%-1rem)] overflow-y-auto rounded-3xl border-0 bg-white p-5 shadow-[0_28px_80px_rgba(112,42,225,0.22)] sm:max-w-[640px] sm:p-8 [&>button]:hidden">
        <DialogHeader className="mb-1 text-left">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="font-plus-jakarta text-xl font-extrabold tracking-tight text-zinc-900 sm:text-2xl">
                {t("leaveReviewTitle")}
              </DialogTitle>
              <DialogDescription className="mt-2 max-w-[54ch] text-sm leading-relaxed text-zinc-600">
                {t("leaveReviewDescription")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          <div className="rounded-2xl bg-violet-50/70 p-4 sm:p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">
              {t("reviewRating")}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5 sm:gap-2">
              {Array.from({ length: 5 }).map((_, idx) => {
                const value = idx + 1;
                const active = value <= rating;
                return (
                  <button
                    key={value}
                    type="button"
                    className={cn(
                      "rounded-full p-1 transition-transform hover:scale-110",
                      active ? "text-violet-600" : "text-violet-200"
                    )}
                    onClick={() => setRating(value)}
                    aria-label={`${value}/5`}
                  >
                    <Star
                      className={cn("h-8 w-8 sm:h-9 sm:w-9", active ? "text-violet-600" : "text-violet-200")}
                      fill={active ? "currentColor" : "transparent"}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Lo que más destacó
            </div>
            <div className="flex flex-wrap gap-2">
              {highlightOptions.map((option) => {
                const isActive = selectedHighlights.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleHighlight(option)}
                    className={cn(
                      "rounded-full px-4 py-2 text-xs font-semibold transition-colors sm:text-sm",
                      isActive
                        ? "bg-violet-600 text-white shadow-[0_8px_24px_rgba(112,42,225,0.24)]"
                        : "bg-zinc-100 text-zinc-600 hover:bg-violet-100 hover:text-violet-700"
                    )}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold text-zinc-700">{t("reviewComment")}</div>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("reviewCommentPlaceholder")}
              maxLength={MAX_COMMENT_LENGTH}
              className="min-h-[140px] resize-none rounded-2xl border-0 bg-zinc-100/70 px-4 py-3 text-zinc-900 placeholder:text-zinc-500 focus-visible:ring-2 focus-visible:ring-violet-200"
            />
            <div className="text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
              {comment.length} / {MAX_COMMENT_LENGTH}
            </div>
          </div>

          <DialogFooter className="flex-col gap-3 sm:flex-row sm:justify-end sm:gap-3">
            <Button
              type="button"
              variant="ghost"
              className="h-12 w-full rounded-full text-zinc-600 hover:bg-zinc-100 sm:order-1 sm:w-auto sm:min-w-[160px]"
              onClick={() => props.onOpenChange(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              className="h-12 w-full rounded-full bg-gradient-to-r from-violet-600 to-violet-700 font-semibold text-white shadow-[0_12px_30px_rgba(112,42,225,0.26)] hover:opacity-95 sm:order-2 sm:w-auto sm:min-w-[190px]"
              disabled={!isReady || submitting}
            >
              {submitting ? t("reviewSubmitting") : t("reviewSubmit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

