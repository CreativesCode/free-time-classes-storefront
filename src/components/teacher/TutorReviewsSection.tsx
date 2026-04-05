"use client";

import { useAuth } from "@/context/UserContext";
import { getReviewsByTutor, updateReviewTutorResponse } from "@/lib/supabase/queries/reviews";
import type { ReviewWithStudent } from "@/types/review";
import { useTranslations } from "@/i18n/translations";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Star } from "lucide-react";

export default function TutorReviewsSection() {
  const { user } = useAuth();
  const t = useTranslations("teacherProfile");

  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState<ReviewWithStudent[]>([]);

  const [responseByReviewId, setResponseByReviewId] = useState<Record<string, string>>(
    {}
  );
  const [respondingReviewId, setRespondingReviewId] = useState<string | null>(null);

  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;

    let cancelled = false;

    async function load() {
      if (!userId) return;
      setLoading(true);
      try {
        const data = await getReviewsByTutor(userId, 8);
        if (cancelled) return;
        setReviews(data);

        // Initialize response inputs for reviews that don't have one yet.
        const next: Record<string, string> = {};
        for (const r of data) {
          if (!r.tutor_response) next[r.id] = "";
        }
        setResponseByReviewId(next);
      } catch (e) {
        console.error("[reviews] load tutor reviews error:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const canRespond = useMemo(() => Boolean(user?.id), [user?.id]);

  async function handleSubmitResponse(reviewId: string) {
    if (!canRespond || !user?.id) return;

    const text = (responseByReviewId[reviewId] ?? "").trim();
    if (!text) {
      toast.error(t("responseCommentRequired"));
      return;
    }

    setRespondingReviewId(reviewId);
    try {
      const updated = await updateReviewTutorResponse({
        reviewId,
        tutor_response: text,
      });

      setReviews((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );
      toast.success(t("responseSavedSuccess"));
    } catch (e) {
      console.error("[reviews] updateReviewTutorResponse error:", e);
      toast.error(t("responseSubmitError"));
    } finally {
      setRespondingReviewId(null);
    }
  }

  return (
    <Card className="w-full rounded-md border border-violet-100 bg-white/80 shadow-none">
      <CardHeader>
        <CardTitle>{t("reviewsTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-6 text-sm text-slate-500">Cargando...</div>
        ) : reviews.length === 0 ? (
          <div className="py-6 text-sm text-slate-500">{t("noReviews")}</div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => {
              const studentName = review.student?.user?.username ?? t("studentUnknown");
              const showResponseForm = !review.tutor_response;
              const isResponding = respondingReviewId === review.id;

              return (
                <div
                  key={review.id}
                  className="space-y-3 rounded-md border border-violet-100 bg-white/80 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="font-medium text-gray-900">{studentName}</div>
                    <div className="flex items-center gap-1 text-sm text-primary-700">
                      <Star className="h-4 w-4" fill="currentColor" />
                      <span className="font-medium">{review.rating}/5</span>
                    </div>
                  </div>

                  {review.comment ? (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {review.comment}
                    </p>
                  ) : null}

                  {review.tutor_response ? (
                    <div className="text-sm space-y-1">
                      <div className="font-medium text-gray-900">
                        {t("tutorResponse")}
                      </div>
                      <p className="whitespace-pre-wrap text-gray-700">
                        {review.tutor_response}
                      </p>
                    </div>
                  ) : showResponseForm ? (
                    <form
                      className="space-y-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void handleSubmitResponse(review.id);
                      }}
                    >
                      <Textarea
                        value={responseByReviewId[review.id] ?? ""}
                        onChange={(e) =>
                          setResponseByReviewId((prev) => ({
                            ...prev,
                            [review.id]: e.target.value,
                          }))
                        }
                        placeholder={t("responsePlaceholder")}
                        className="min-h-[100px]"
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          type="submit"
                          disabled={!canRespond || isResponding}
                        >
                          {isResponding
                            ? t("responseSubmitting")
                            : t("responseSubmit")}
                        </Button>
                      </div>
                    </form>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

