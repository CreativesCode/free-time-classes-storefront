"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/UserContext";
import { useTranslations } from "@/i18n/translations";
import { createLesson } from "@/lib/supabase/queries/lessons";
import { getSubjects } from "@/lib/supabase/queries/subjects";
import type { Subject } from "@/types/subject";
import { useEffect, useState } from "react";

interface AddAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialDate?: Date;
}

function toLocalDateTimeInputValue(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

function toDatabaseLocalDateTime(value: string): string {
  // `datetime-local` has no timezone; keep local wall-clock time as-is.
  // Postgres timestamp columns expect "YYYY-MM-DDTHH:mm:ss" here.
  if (!value) return value;
  return value.length === 16 ? `${value}:00` : value;
}

function getNextHourDate(): Date {
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setMinutes(0, 0, 0);
  nextHour.setHours(nextHour.getHours() + 1);
  return nextHour;
}

export default function AddAvailabilityModal({
  isOpen,
  onClose,
  onSuccess,
  initialDate,
}: AddAvailabilityModalProps) {
  const t = useTranslations("teacherProfile.addAvailabilityModal");
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    subject_id: "",
    scheduled_date_time: initialDate ? toLocalDateTimeInputValue(initialDate) : "",
    duration_minutes: "60",
    price: "10.00",
  });

  // Keep date/time input synced when opening modal from calendar selection.
  useEffect(() => {
    if (!isOpen) return;

    setFormData((prev) => ({
      ...prev,
      scheduled_date_time: initialDate
        ? toLocalDateTimeInputValue(initialDate)
        : toLocalDateTimeInputValue(getNextHourDate()),
    }));
  }, [isOpen, initialDate]);

  // Load subjects from database
  useEffect(() => {
    async function loadSubjects() {
      try {
        const data = await getSubjects();
        setSubjects(data);
      } catch (err) {
        console.error("Error loading subjects:", err);
      }
    }
    loadSubjects();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user?.id) {
      setError("User not authenticated");
      return;
    }

    try {
      setLoading(true);

      // Create the lesson (availability) in the database
      await createLesson({
        tutor_id: user.id,
        subject_id: parseInt(formData.subject_id),
        scheduled_date_time: toDatabaseLocalDateTime(formData.scheduled_date_time),
        duration_minutes: parseInt(formData.duration_minutes),
        price: parseFloat(formData.price),
        status: "available",
      });

      // Reset form and close modal
      setFormData({
        subject_id: "",
        scheduled_date_time: "",
        duration_minutes: "60",
        price: "10.00",
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error creating availability:", err);
      setError(err instanceof Error ? err.message : "Failed to create availability");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden p-0 sm:max-w-[525px]">
        <DialogHeader className="px-4 pt-6 sm:px-6">
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4 pt-1 sm:px-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

          <div className="space-y-2">
            <Label htmlFor="subject">{t("subject")}</Label>
            <select
              id="subject"
              value={formData.subject_id}
              onChange={(e) => handleChange("subject_id", e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">{t("selectSubject")}</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="datetime">{t("dateTime")}</Label>
            <Input
              id="datetime"
              type="datetime-local"
              value={formData.scheduled_date_time}
              onChange={(e) =>
                handleChange("scheduled_date_time", e.target.value)
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">{t("duration")}</Label>
            <select
              id="duration"
              value={formData.duration_minutes}
              onChange={(e) => handleChange("duration_minutes", e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="30">30 {t("minutes")}</option>
              <option value="60">60 {t("minutes")}</option>
              <option value="90">90 {t("minutes")}</option>
              <option value="120">120 {t("minutes")}</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">{t("price")}</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => handleChange("price", e.target.value)}
              required
            />
          </div>

          </div>
          <div className="mt-2 flex shrink-0 justify-end gap-2 border-t bg-background px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t("creating") : t("create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
