"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarPlus, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectMenu } from "@/components/ui/select-menu";
import { Textarea } from "@/components/ui/textarea";
import {
  FT_BTN_OUTLINE,
  FT_BTN_PRIMARY,
  FT_FIELD,
  FT_LABEL,
  FT_SELECT_TRIGGER,
  FT_TEXTAREA,
} from "@/components/teacher/ftStyles";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/UserContext";
import { useLocale, useTranslations } from "@/i18n/translations";

const ALLOWED_DURATIONS = [15, 30, 45, 60, 90, 120] as const;
const MIN_LEAD_MINUTES = 30;
const NOTES_MAX_LENGTH = 500;

type SubjectOption = { id: number; name: string };

type Props = {
  tutorId: string;
  tutorName: string;
  subjects: SubjectOption[];
  /** Override the default trigger button styling (used by the FreeTime redesign). */
  triggerClassName?: string;
  /** Custom trigger label. Defaults to t("ctaOpen"). */
  triggerLabel?: string;
  /** Hide the calendar icon inside the trigger. */
  hideTriggerIcon?: boolean;
};

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function defaultStartLocalValue(): string {
  // datetime-local default: now + 60min, rounded down to the next 5-minute mark
  const d = new Date(Date.now() + 60 * 60_000);
  d.setSeconds(0, 0);
  d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function RequestCustomClassButton({
  tutorId,
  tutorName,
  subjects,
  triggerClassName,
  triggerLabel,
  hideTriggerIcon = false,
}: Props) {
  const t = useTranslations("requestCustomClass");
  const locale = useLocale();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [subjectId, setSubjectId] = useState<string>(
    subjects[0] ? String(subjects[0].id) : ""
  );
  const [scheduledLocal, setScheduledLocal] = useState<string>(defaultStartLocalValue);
  const [duration, setDuration] = useState<string>("30");
  const [notes, setNotes] = useState<string>("");

  const subjectOptions = useMemo(
    () => subjects.map((s) => ({ value: String(s.id), label: s.name })),
    [subjects]
  );

  const durationOptions = useMemo(
    () =>
      ALLOWED_DURATIONS.map((d) => ({
        value: String(d),
        label: `${d} ${t("minutesShort")}`,
      })),
    [t]
  );

  const isStudent = user?.is_student ?? false;
  const canRequest = !!user && isStudent;

  const handleSubmit = async () => {
    if (!subjectId) {
      toast.error(t("errorSubjectRequired"));
      return;
    }
    if (!scheduledLocal) {
      toast.error(t("errorDateTimeRequired"));
      return;
    }
    setSubmitting(true);
    try {
      // datetime-local already gives us "YYYY-MM-DDTHH:mm" — server treats as Madrid wall-clock
      const response = await fetch("/api/bookings/custom-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tutorId,
          subjectId: Number(subjectId),
          scheduledDateTime: scheduledLocal,
          durationMinutes: Number(duration),
          notes: notes.trim() || undefined,
        }),
      });
      const result = (await response.json()) as { error?: string; code?: string };
      if (!response.ok) {
        if (result.code === "lead_time_too_short") {
          toast.error(t("errorLeadTimeTooShort", { minutes: MIN_LEAD_MINUTES }));
        } else if (result.code === "too_many_open_requests") {
          toast.error(t("errorTooManyOpenRequests"));
        } else {
          toast.error(result.error || t("errorGeneric"));
        }
        return;
      }
      toast.success(t("success"));
      setOpen(false);
      setNotes("");
      router.refresh();
    } catch (e) {
      console.error("[RequestCustomClassButton] submit failed:", e);
      toast.error(t("errorGeneric"));
    } finally {
      setSubmitting(false);
    }
  };

  if (subjects.length === 0) {
    // Tutor doesn't list any subject — can't request anything sensibly.
    return null;
  }

  if (authLoading) {
    return null;
  }

  if (!user) {
    return (
      <Button
        asChild
        variant="outline"
        className="h-11 w-full justify-center gap-2 px-5 text-sm"
      >
        <Link href={`/${locale}/login?redirect=/${locale}/tutors/${tutorId}`}>
          <CalendarPlus className="h-4 w-4 shrink-0" />
          <span className="truncate">{t("ctaLoginToRequest")}</span>
        </Link>
      </Button>
    );
  }

  if (!isStudent) {
    return null;
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className={
          triggerClassName ??
          cn(FT_BTN_PRIMARY, "h-11 w-full gap-2 px-5 text-sm")
        }
      >
        {!hideTriggerIcon && <CalendarPlus className="h-4 w-4 shrink-0" />}
        <span className="truncate">{triggerLabel ?? t("ctaOpen")}</span>
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!submitting) setOpen(next);
        }}
      >
        <DialogContent
          data-theme="freetime"
          className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden border-ft-line bg-ft-paper p-0 text-ft-ink sm:max-w-[520px] sm:rounded-ft-2xl"
        >
          <DialogHeader className="px-4 pt-6 sm:px-6">
            <DialogTitle className="text-[20px] font-semibold tracking-[-0.02em] text-ft-ink">{t("dialogTitle")}</DialogTitle>
            <DialogDescription className="text-ft-ink-3">
              {t("dialogDescription", { tutor: tutorName })}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4 pt-1 sm:px-6">
            <div className="space-y-2">
              <Label htmlFor="rcc-subject" className={FT_LABEL}>{t("subjectLabel")}</Label>
              <SelectMenu
                id="rcc-subject"
                value={subjectId}
                onValueChange={setSubjectId}
                options={subjectOptions}
                disabled={submitting}
                aria-label={t("subjectLabel")}
                triggerClassName={FT_SELECT_TRIGGER}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rcc-when" className={FT_LABEL}>{t("whenLabel")}</Label>
              <Input
                id="rcc-when"
                type="datetime-local"
                value={scheduledLocal}
                onChange={(e) => setScheduledLocal(e.target.value)}
                disabled={submitting}
                className={FT_FIELD}
              />
              <p className="text-xs text-ft-ink-3">{t("whenHintMadrid")}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rcc-duration" className={FT_LABEL}>{t("durationLabel")}</Label>
              <SelectMenu
                id="rcc-duration"
                value={duration}
                onValueChange={setDuration}
                options={durationOptions}
                disabled={submitting}
                aria-label={t("durationLabel")}
                triggerClassName={FT_SELECT_TRIGGER}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rcc-notes" className={FT_LABEL}>{t("notesLabel")}</Label>
              <Textarea
                id="rcc-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value.slice(0, NOTES_MAX_LENGTH))}
                placeholder={t("notesPlaceholder")}
                disabled={submitting}
                rows={3}
                className={FT_TEXTAREA}
              />
              <p className="text-right text-xs text-ft-ink-3">
                {notes.length}/{NOTES_MAX_LENGTH}
              </p>
            </div>

            <p className="rounded-ft border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {t("expiryWarning")}
            </p>
          </div>

          <DialogFooter className="mt-2 flex shrink-0 flex-col gap-2 border-t border-ft-line bg-ft-paper px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-6">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
              className={FT_BTN_OUTLINE}
            >
              {t("cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !canRequest} className={FT_BTN_PRIMARY}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("submitting")}
                </>
              ) : (
                t("submit")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
