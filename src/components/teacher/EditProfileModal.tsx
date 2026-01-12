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
import { updateUser } from "@/lib/supabase/queries/users";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  username: string;
  phone: string;
  profile_picture: string;
  date_of_birth: string;
  country: string;
}

export default function EditProfileModal({
  isOpen,
  onClose,
}: EditProfileModalProps) {
  const { user, refreshUser } = useAuth();
  const t = useTranslations("teacherProfile");
  const [formData, setFormData] = useState<FormData>({
    username: user?.username || "",
    phone: user?.phone || "",
    profile_picture: user?.profile_picture || "",
    date_of_birth: user?.date_of_birth || "",
    country: user?.country || "",
  });

  const [loading, setLoading] = useState(false);

  // Update form data when user data changes
  useEffect(() => {
    setFormData({
      username: user?.username || "",
      phone: user?.phone || "",
      profile_picture: user?.profile_picture || "",
      date_of_birth: user?.date_of_birth || "",
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
    if (formData.profile_picture)
      formDataToUpdate.profile_picture = formData.profile_picture;
    if (formData.date_of_birth)
      formDataToUpdate.date_of_birth = formData.date_of_birth;
    if (formData.country) formDataToUpdate.country = formData.country;

    try {
      await updateUser(user.id, formDataToUpdate);
      await refreshUser();
      toast.success(t("profileUpdated"));
      onClose();
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error(t("updateError"));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
            <Label htmlFor="profile_picture">{t("profilePicture")}</Label>
            <Input
              id="profile_picture"
              name="profile_picture"
              value={formData.profile_picture}
              onChange={handleChange}
              placeholder="URL de la imagen"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">{t("dateOfBirth")}</Label>
              <Input
                id="date_of_birth"
                name="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">{t("country")}</Label>
              <Input
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="España"
              />
            </div>
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
