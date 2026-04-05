"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "@/i18n/translations";
import { useAuth } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type PendingBookingItem = {
  bookingId: number;
  tutorId: string;
  tutorName: string | null;
  subjectName: string | null;
  scheduledDateTime: string | null;
  durationMinutes: number | null;
  price: number | null;
};

export default function StudentBookingRequests() {
  const t = useTranslations("studentProfile.requests");
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<PendingBookingItem[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const loadPendingRequests = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/bookings/student/pending`, {
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
      console.error("Error loading student requests:", error);
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPendingRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const cancelRequest = async (bookingId: number) => {
    setActionLoadingId(bookingId);
    try {
      const response = await fetch(`/api/bookings/student/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error || t("cancelError"));
      }
      toast.success(t("cancelSuccess"));
      await loadPendingRequests();
    } catch (error) {
      console.error("Error cancelling request:", error);
      toast.error(error instanceof Error ? error.message : t("cancelError"));
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <Card className="w-full rounded-md border-border/60">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle>{t("title")}</CardTitle>
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
              <div key={item.bookingId} className="space-y-3 rounded-md border border-border/60 bg-white p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">
                      {item.subjectName ?? t("lessonUnknown")}
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {t("teacher")}: {item.tutorName ?? item.tutorId}
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
                <div className="flex justify-end pt-2 border-t">
                  <Button
                    variant="destructive"
                    disabled={actionLoadingId === item.bookingId}
                    onClick={() => void cancelRequest(item.bookingId)}
                  >
                    {actionLoadingId === item.bookingId
                      ? t("cancelRequestLoading")
                      : t("cancelRequest")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

