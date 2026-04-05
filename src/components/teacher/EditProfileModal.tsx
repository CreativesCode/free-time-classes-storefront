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
import { SelectMenu } from "@/components/ui/select-menu";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/UserContext";
import { useTranslations } from "@/i18n/translations";
import { COUNTRIES } from "@/lib/constants/countries";
import { updateTutorProfile } from "@/lib/supabase/queries/tutors";
import { updateUser } from "@/lib/supabase/queries/users";
import type { TutorProfile } from "@/types/tutor";
import { getPublicUrl, uploadAvatar } from "@/lib/supabase/storage";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Mismo `id` que `tutor_profiles` (FK a `users`). */
  tutorId: string;
  initialBio?: string | null;
  initialYearsOfExperience?: number | null;
  initialCertifications?: string | null;
  onTutorProfileUpdated?: (updates: Partial<TutorProfile>) => void;
}

interface FormData {
  username: string;
  phone: string;
  country: string;
  bio: string;
  yearsOfExperience: string;
  certifications: string;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  tutorId,
  initialBio = "",
  initialYearsOfExperience,
  initialCertifications,
  onTutorProfileUpdated,
}: EditProfileModalProps) {
  const { user, refreshUser } = useAuth();
  const t = useTranslations("teacherProfile");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<FormData>({
    username: user?.username || "",
    phone: user?.phone || "",
    country: user?.country || "",
    bio: initialBio ?? "",
    yearsOfExperience: initialYearsOfExperience != null ? String(initialYearsOfExperience) : "",
    certifications: initialCertifications ?? "",
  });

  const [loading, setLoading] = useState(false);
  const dialogBodyScrollRef = useRef<HTMLDivElement>(null);

  const countryMenuOptions = useMemo(
    () => [
      { value: "", label: t("selectCountry") },
      ...COUNTRIES.map((c) => ({ value: c, label: c })),
    ],
    [t]
  );

  // Update form data when user data changes
  useEffect(() => {
    setFormData({
      username: user?.username || "",
      phone: user?.phone || "",
      country: user?.country || "",
      bio: initialBio ?? "",
      yearsOfExperience: initialYearsOfExperience != null ? String(initialYearsOfExperience) : "",
      certifications: initialCertifications ?? "",
    });
  }, [user, initialBio, initialYearsOfExperience, initialCertifications]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setLoading(true);

    // Filter out empty values and prepare update object
    const formDataToUpdate: Partial<FormData> = {};
    if (formData.username) formDataToUpdate.username = formData.username;
    if (formData.phone) formDataToUpdate.phone = formData.phone;
    if (formData.country) formDataToUpdate.country = formData.country;

    try {
      let profilePicture = user.profile_picture || null;
      if (avatarFile) {
        profilePicture = await uploadAvatar(user.id, avatarFile);
      }

      await updateUser(user.id, {
        ...formDataToUpdate,
        profile_picture: profilePicture,
      });
      const bioValue = formData.bio.trim() || null;
      const yearsValue = formData.yearsOfExperience ? parseInt(formData.yearsOfExperience, 10) : null;
      const certificationsValue = formData.certifications.trim() || null;
      const tutorUpdates: Partial<TutorProfile> = {
        bio: bioValue,
        years_of_experience: Number.isNaN(yearsValue) ? null : yearsValue,
        certifications: certificationsValue,
      };
      await updateTutorProfile(tutorId, tutorUpdates);
      onTutorProfileUpdated?.(tutorUpdates);
      await refreshUser();
      toast.success(t("profileUpdated"));
      setAvatarFile(null);
      onClose();
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error(t("updateError"));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  const avatarPreviewUrl = avatarFile
    ? URL.createObjectURL(avatarFile)
    : user?.profile_picture
      ? user.profile_picture.startsWith("http")
        ? user.profile_picture
        : getPublicUrl("avatars", user.profile_picture)
      : null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setAvatarFile(null);
          onClose();
        }
      }}
    >
      <DialogContent className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden p-0 sm:max-w-[600px]">
        <DialogHeader className="px-4 pt-6 sm:px-6">
          <DialogTitle>{t("editProfile")}</DialogTitle>
          <DialogDescription>{t("editProfileDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div
            ref={dialogBodyScrollRef}
            className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4 pt-1 sm:px-6"
          >
            <div className="space-y-2">
            <Label htmlFor="username">{t("name")}</Label>
            <Input
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder={t("namePlaceholder") || "Nombre completo"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t("phone")}</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+34 123 456 789"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">{t("country")}</Label>
            <SelectMenu
              id="country"
              value={formData.country}
              onValueChange={(country) =>
                setFormData((prev) => ({ ...prev, country }))
              }
              options={countryMenuOptions}
              aria-label={t("country")}
              nestedScrollParentRef={dialogBodyScrollRef}
              searchable
              searchPlaceholder={t("countrySearchPlaceholder")}
              emptySearchMessage={t("countrySearchEmpty")}
              triggerClassName="h-10 rounded-md border border-input bg-background shadow-sm hover:bg-accent/40"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">{t("bio")}</Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder={t("bioPlaceholder")}
              className="min-h-[100px] resize-y"
            />
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

          <div className="space-y-2">
            <Label htmlFor="yearsOfExperience">{t("experience")}</Label>
            <Input
              id="yearsOfExperience"
              name="yearsOfExperience"
              type="number"
              min="0"
              max="99"
              value={formData.yearsOfExperience}
              onChange={handleChange}
              placeholder={t("experiencePlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="certifications">{t("certifications")}</Label>
            <Textarea
              id="certifications"
              name="certifications"
              value={formData.certifications}
              onChange={handleChange}
              placeholder={t("certificationsPlaceholder")}
              className="min-h-[80px] resize-y"
            />
          </div>

          </div>
          <DialogFooter className="mt-2 flex shrink-0 flex-col gap-2 border-t bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-6">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t("saving") : t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
