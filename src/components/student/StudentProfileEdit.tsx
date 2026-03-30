"use client";

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
import { Textarea } from "@/components/ui/textarea";
import { COUNTRIES } from "@/lib/constants/countries";
import { getPublicUrl, uploadAvatar } from "@/lib/supabase/storage";
import { updateStudentProfile } from "@/lib/supabase/queries/students";
import { updateUser } from "@/lib/supabase/queries/users";
import { useAuth } from "@/context/UserContext";
import { useTranslations } from "@/i18n/translations";
import { toast } from "sonner";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { StudentProfile } from "@/types/student";

type LanguageLevel = NonNullable<StudentProfile["language_level"]>;

interface StudentProfileEditProps {
  isOpen: boolean;
  onClose: () => void;
  studentProfile: StudentProfile | null;
  onUpdated: () => void;
}

const LANGUAGE_LEVEL_OPTIONS: Array<{
  value: LanguageLevel;
  tKey: `languageLevels.${Lowercase<LanguageLevel>}`;
}> = [
  { value: "beginner", tKey: "languageLevels.beginner" },
  { value: "elementary", tKey: "languageLevels.elementary" },
  { value: "intermediate", tKey: "languageLevels.intermediate" },
  { value: "upper_intermediate", tKey: "languageLevels.upper_intermediate" },
  { value: "advanced", tKey: "languageLevels.advanced" },
  { value: "proficient", tKey: "languageLevels.proficient" },
];

function getTimezones(): string[] {
  try {
    // Available in modern browsers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supported = (Intl as any)?.supportedValuesOf?.("timeZone");
    if (Array.isArray(supported) && supported.length > 0) return supported;
  } catch {
    // ignore
  }

  // Fallback list (enough for the demo)
  return ["Europe/Madrid", "Europe/Paris", "UTC", "America/New_York"];
}

export default function StudentProfileEdit({
  isOpen,
  onClose,
  studentProfile,
  onUpdated,
}: StudentProfileEditProps) {
  const { user, refreshUser } = useAuth();
  const t = useTranslations("studentProfile");

  const timezones = useMemo(() => getTimezones(), []);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    phone: "",
    country: "",
    bio: "",
    learningGoals: "",
    languageLevel: "" as "" | LanguageLevel,
    timezone: "",
    prefersAudioCalls: false,
    prefersVideoCalls: false,
    prefersTextChat: false,
  });

  useEffect(() => {
    if (!user) return;

    setFormData({
      username: user.username || "",
      phone: user.phone || "",
      country: user.country || "",
      bio: studentProfile?.bio ?? "",
      learningGoals: studentProfile?.learning_goals ?? "",
      languageLevel: (studentProfile?.language_level ?? "") as
        | "" | LanguageLevel,
      timezone: studentProfile?.timezone ?? "",
      prefersAudioCalls: !!studentProfile?.prefers_audio_calls,
      prefersVideoCalls: !!studentProfile?.prefers_video_calls,
      prefersTextChat: !!studentProfile?.prefers_text_chat,
    });
  }, [user, studentProfile]);

  const avatarPreviewUrl = useMemo(() => {
    if (avatarFile) return URL.createObjectURL(avatarFile);

    if (!user?.profile_picture || typeof user.profile_picture !== "string") {
      return null;
    }

    return user.profile_picture.startsWith("http")
      ? user.profile_picture
      : getPublicUrl("avatars", user.profile_picture);
  }, [avatarFile, user?.profile_picture]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name as keyof typeof formData]: value,
    }));
  };

  const handleCheckboxChange = (
    name: keyof typeof formData,
    checked: boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(t("invalidImageType"));
      return;
    }

    setAvatarFile(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsSaving(true);
    try {
      let profilePicture = user.profile_picture || null;
      if (avatarFile) {
        profilePicture = await uploadAvatar(user.id, avatarFile);
      }

      await updateUser(user.id, {
        username: formData.username || user.username,
        phone: formData.phone ? formData.phone : null,
        country: formData.country ? formData.country : null,
        profile_picture: profilePicture,
      });

      await updateStudentProfile(user.id, {
        bio: formData.bio ? formData.bio : null,
        learning_goals: formData.learningGoals ? formData.learningGoals : null,
        language_level: formData.languageLevel ? formData.languageLevel : null,
        timezone: formData.timezone ? formData.timezone : null,
        prefers_audio_calls: formData.prefersAudioCalls,
        prefers_video_calls: formData.prefersVideoCalls,
        prefers_text_chat: formData.prefersTextChat,
      });

      await refreshUser();
      toast.success(t("profileUpdated"));
      setAvatarFile(null);
      onUpdated();
      onClose();
    } catch (error) {
      console.error("Error updating student profile:", error);
      toast.error(
        error instanceof Error ? error.message : t("updateError")
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) setAvatarFile(null);
        if (!open) onClose();
      }}
    >
      <DialogContent className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden p-0 sm:max-w-[700px]">
        <DialogHeader className="px-4 pt-6 sm:px-6">
          <DialogTitle>{t("editProfile")}</DialogTitle>
          <DialogDescription>{t("editProfileDescription")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pb-4 pt-1 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">{t("name")}</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t("phone")}</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+34 123 456 789"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">{t("country")}</Label>
              <select
                id="country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">{t("selectCountry")}</option>
                {COUNTRIES.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">{t("timezone")}</Label>
              <select
                id="timezone"
                name="timezone"
                value={formData.timezone}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">{t("notProvided")}</option>
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">{t("bio")}</Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder={t("bioPlaceholder")}
              className="min-h-[110px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="learningGoals">{t("learningGoals")}</Label>
            <Textarea
              id="learningGoals"
              name="learningGoals"
              value={formData.learningGoals}
              onChange={handleInputChange}
              placeholder={t("learningGoalsPlaceholder")}
              className="min-h-[90px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="languageLevel">{t("languageLevel")}</Label>
              <select
                id="languageLevel"
                name="languageLevel"
                value={formData.languageLevel}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">{t("notProvided")}</option>
                {LANGUAGE_LEVEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {t(opt.tKey)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>{t("preferredCommunication")}</Label>
              <div className="flex flex-col gap-2 pt-1">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.prefersAudioCalls}
                    onChange={(e) =>
                      handleCheckboxChange("prefersAudioCalls", e.target.checked)
                    }
                  />
                  {t("prefersAudioCalls")}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.prefersVideoCalls}
                    onChange={(e) =>
                      handleCheckboxChange(
                        "prefersVideoCalls",
                        e.target.checked
                      )
                    }
                  />
                  {t("prefersVideoCalls")}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.prefersTextChat}
                    onChange={(e) =>
                      handleCheckboxChange("prefersTextChat", e.target.checked)
                    }
                  />
                  {t("prefersTextChat")}
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar_file">{t("uploadNewPhoto")}</Label>
            <Input
              id="avatar_file"
              name="avatar_file"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
            />

            {avatarPreviewUrl ? (
              <div className="relative h-16 w-16 overflow-hidden rounded-full border">
                <Image
                  src={avatarPreviewUrl}
                  alt={t("profilePicturePreviewAlt")}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
            ) : null}
          </div>

          </div>
          <DialogFooter className="mt-2 flex shrink-0 flex-col gap-2 border-t bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-6">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? t("saving") : t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

