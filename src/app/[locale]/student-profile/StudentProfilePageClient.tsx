"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChevronRight,
  Globe,
  LogOut,
  MessageCircle,
  Receipt,
  Shield,
  Sparkles,
  User,
  CalendarRange,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { StudentSidebarNav } from "@/components/ds/StudentSidebarNav";
import StudentProfileEdit from "@/components/student/StudentProfileEdit";
import { useAuth } from "@/context/UserContext";
import { useTranslations } from "@/i18n/translations";
import { getPublicUrl } from "@/lib/supabase/storage";
import type { StudentProfile } from "@/types/student";

export type StudentProfilePageUser = {
  id: string;
  username: string;
  email: string;
  phone: string | null;
  country: string | null;
  profile_picture: string | null;
  created_at: string;
  updated_at: string;
};

export type StudentProfileStats = {
  classes: number;
  hoursLearned: number;
  tutors: number;
};

const LANGUAGE_LEVEL_PROGRESS: Record<
  NonNullable<StudentProfile["language_level"]>,
  { label: string; percent: number; next: string }
> = {
  beginner: { label: "A1", percent: 17, next: "A2" },
  elementary: { label: "A2", percent: 33, next: "B1" },
  intermediate: { label: "B1", percent: 50, next: "B2" },
  upper_intermediate: { label: "B2", percent: 67, next: "C1" },
  advanced: { label: "C1", percent: 83, next: "C2" },
  proficient: { label: "C2", percent: 100, next: "—" },
};

export default function StudentProfilePageClient({
  locale,
  pageUser,
  initialStudentProfile,
  stats,
}: {
  locale: string;
  pageUser: StudentProfilePageUser;
  initialStudentProfile: StudentProfile | null;
  stats: StudentProfileStats;
}) {
  const t = useTranslations("studentProfile");
  const router = useRouter();
  const { logout } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(
    initialStudentProfile
  );

  const profilePictureUrl =
    pageUser.profile_picture && typeof pageUser.profile_picture === "string"
      ? pageUser.profile_picture.startsWith("http")
        ? pageUser.profile_picture
        : getPublicUrl("avatars", pageUser.profile_picture)
      : null;

  const memberSinceYear = pageUser.created_at
    ? new Date(pageUser.created_at).getFullYear()
    : null;

  const progress = studentProfile?.language_level
    ? LANGUAGE_LEVEL_PROGRESS[studentProfile.language_level]
    : null;

  const settingsItems: Array<{
    icon: LucideIcon;
    label: string;
    sub: string;
    onClick: () => void;
  }> = [
    {
      icon: User,
      label: t("editProfile"),
      sub: t("editProfileSub"),
      onClick: () => setIsEditModalOpen(true),
    },
    {
      icon: CalendarRange,
      label: t("myClasses"),
      sub: t("myClassesSub"),
      onClick: () => router.push(`/${locale}/bookings`),
    },
    {
      icon: MessageCircle,
      label: t("myMessages"),
      sub: t("myMessagesSub"),
      onClick: () => router.push(`/${locale}/messages`),
    },
    {
      icon: Bell,
      label: t("notifications"),
      sub: t("notificationsSub"),
      onClick: () => router.push(`/${locale}/settings?tab=notifications`),
    },
    {
      icon: Globe,
      label: t("languageRegion"),
      sub: t("languageRegionSub", {
        timezone: studentProfile?.timezone ?? "Europe/Madrid",
      }),
      onClick: () => router.push(`/${locale}/settings?tab=privacy`),
    },
    {
      icon: Receipt,
      label: t("paymentsTitle"),
      sub: t("paymentsSub"),
      onClick: () => router.push(`/${locale}/settings?tab=payments`),
    },
    {
      icon: Shield,
      label: t("privacy"),
      sub: t("privacySub"),
      onClick: () => router.push(`/${locale}/settings?tab=privacy`),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-screen-md md:max-w-screen-lg lg:max-w-screen-xl lg:px-9 lg:py-8">
      <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-8">
        <StudentSidebarNav isTutor={false} />

        <div className="min-w-0">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pb-3.5 pt-[18px] md:px-9 md:pt-8 lg:px-0 lg:pt-0">
        <h1 className="m-0 text-[28px] font-semibold tracking-[-0.03em] text-ft-ink md:text-[32px]">
          {t("title")}
        </h1>
        <button
          type="button"
          onClick={() => router.push(`/${locale}/settings`)}
          aria-label={t("openSettings")}
          className="grid h-[38px] w-[38px] place-items-center rounded-full border border-ft-line bg-ft-paper transition-colors hover:bg-ft-surface-1"
        >
          <Sparkles width={16} height={16} className="text-ft-ink" />
        </button>
      </header>

      {/* User card */}
      <div className="px-5 pb-5 md:px-9 lg:px-0">
        <div className="rounded-ft-2xl border border-ft-line bg-gradient-to-br from-ft-surface-2 to-ft-surface-1 px-5 py-6 text-center lg:mx-auto lg:max-w-md lg:py-8">
          <div className="mx-auto h-[84px] w-[84px] overflow-hidden rounded-full bg-ft-surface-2">
            {profilePictureUrl ? (
              <Image
                src={profilePictureUrl}
                alt={pageUser.username}
                width={84}
                height={84}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <div className="grid h-full w-full place-items-center bg-gradient-to-br from-ft-accent to-ft-accent-deep text-3xl font-semibold text-ft-paper">
                {pageUser.username[0]?.toUpperCase() ?? "U"}
              </div>
            )}
          </div>
          <div className="mt-3.5 text-[20px] font-semibold tracking-[-0.02em] text-ft-ink">
            {pageUser.username}
          </div>
          <div className="mt-0.5 text-[13px] text-ft-ink-3">
            {pageUser.country ?? "—"}
            {memberSinceYear ? ` · ${t("memberSince", { year: memberSinceYear })}` : ""}
          </div>

          <div className="mt-[18px] grid grid-cols-3 gap-1.5 border-t border-ft-line-soft pt-3.5">
            <div>
              <div className="text-[18px] font-semibold text-ft-ink">{stats.classes}</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-ft-ink-3">
                {t("statClasses")}
              </div>
            </div>
            <div className="border-x border-ft-line-soft">
              <div className="text-[18px] font-semibold text-ft-ink">
                {stats.hoursLearned}h
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-ft-ink-3">
                {t("statLearned")}
              </div>
            </div>
            <div>
              <div className="text-[18px] font-semibold text-ft-ink">{stats.tutors}</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-ft-ink-3">
                {t("statTutors")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress card */}
      {progress && (
        <>
          <h2 className="m-0 px-5 pb-2.5 pt-2 text-base font-semibold tracking-tight text-ft-ink md:px-9 lg:px-0">
            {t("yourProgress")}
          </h2>
          <div className="px-5 pb-4 md:px-9 lg:px-0">
            <div className="rounded-ft-lg border border-ft-line-soft bg-ft-paper p-[18px]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ft-accent-deep">
                    {t("progressLevelLabel", { level: progress.label })}
                  </div>
                  <div className="mt-1 text-[15px] font-semibold tracking-tight text-ft-ink">
                    {t("progressPercent", { percent: progress.percent })}
                  </div>
                </div>
                <div className="text-[11px] text-ft-ink-3">
                  {t("progressNext", { level: progress.next })}
                </div>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-ft-xs bg-ft-surface-2">
                <div
                  className="h-full bg-gradient-to-r from-ft-accent to-ft-accent-deep"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Settings list */}
      <h2 className="m-0 px-5 pb-2.5 pt-2 text-base font-semibold tracking-tight text-ft-ink md:px-9 lg:px-0">
        {t("settings")}
      </h2>
      <div className="px-5 md:px-9 lg:grid lg:grid-cols-2 lg:gap-x-6 lg:px-0">
        {settingsItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className="flex w-full items-center gap-3.5 border-0 border-b border-ft-line-soft bg-transparent px-0 py-3.5 text-left transition-colors hover:bg-ft-surface-1/40"
            >
              <span className="grid h-[38px] w-[38px] flex-shrink-0 place-items-center rounded-ft border border-ft-line-soft bg-ft-surface-1">
                <Icon width={16} height={16} className="text-ft-ink" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-medium text-ft-ink">
                  {item.label}
                </span>
                <span className="mt-px block truncate text-[11px] text-ft-ink-3">
                  {item.sub}
                </span>
              </span>
              <ChevronRight width={14} height={14} className="text-ft-ink-3" />
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => void logout()}
          className="flex w-full items-center gap-3.5 border-0 bg-transparent px-0 py-3.5 text-left text-red-700 transition-colors hover:opacity-80 lg:col-span-2"
        >
          <span className="grid h-[38px] w-[38px] flex-shrink-0 place-items-center rounded-ft border border-red-100 bg-red-50">
            <LogOut width={16} height={16} />
          </span>
          <span className="text-[14px] font-medium">{t("signOut")}</span>
        </button>
      </div>

      <div className="h-6" />

      <StudentProfileEdit
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        studentProfile={studentProfile}
        onUpdated={() => {
          // refresh local copy from latest server data
          router.refresh();
          setStudentProfile((prev) => prev);
        }}
      />
        </div>
      </div>
    </div>
  );
}
