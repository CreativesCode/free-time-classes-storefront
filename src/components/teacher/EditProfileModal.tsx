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
// import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/UserContext";
import { useTranslations } from "@/i18n/translations";
import { COUNTRIES } from "@/lib/constants/countries";
import { updateUser } from "@/lib/supabase/queries/users";
import { getPublicUrl, uploadAvatar } from "@/lib/supabase/storage";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  username: string;
  phone: string;
  country: string;
}

export default function EditProfileModal({
  isOpen,
  onClose,
}: EditProfileModalProps) {
  const { user, refreshUser } = useAuth();
  const t = useTranslations("teacherProfile");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<FormData>({
    username: user?.username || "",
    phone: user?.phone || "",
    country: user?.country || "",
  });

  const [loading, setLoading] = useState(false);

  // Update form data when user data changes
  useEffect(() => {
    setFormData({
      username: user?.username || "",
      phone: user?.phone || "",
      country: user?.country || "",
    });
  }, [user]);

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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t("editProfile")}</DialogTitle>
          <DialogDescription>{t("editProfileDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <select
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
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
                />
              </div>
            ) : null}
          </div>

          {/* <div className="space-y-2">
            <Label htmlFor="specialties">{t("specialties")}</Label>
            <Input
              id="specialties"
              name="specialties"
              value={formData.specialties}
              onChange={handleChange}
              placeholder={t("specialtiesPlaceholder")}
            />
          </div> */}

          {/* <div className="space-y-2">
            <Label htmlFor="experience">{t("experience")}</Label>
            <Input
              id="experience"
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              placeholder={t("experiencePlaceholder")}
            />
          </div> */}

          {/* <div className="space-y-2">
            <Label htmlFor="bio">{t("bio")}</Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder={t("bioPlaceholder")}
              className="min-h-[100px]"
            />
          </div> */}

          <DialogFooter>
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
