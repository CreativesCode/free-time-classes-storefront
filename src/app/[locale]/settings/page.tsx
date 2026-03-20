"use client";

import { updateUser } from "@/lib/supabase/queries/users";
import { useAuth } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Settings2,
  Trash2,
  ShieldCheck,
  Bell,
  CreditCard,
  Eye,
  EyeOff,
} from "lucide-react";

function isValidEmail(email: string) {
  // Simple validation for UX; Supabase will still enforce correctness.
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export default function SettingsPage() {
  const { user, isLoading } = useAuth();
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("settingsPage");
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab =
    tabParam === "account" ||
    tabParam === "notifications" ||
    tabParam === "payments" ||
    tabParam === "privacy"
      ? tabParam
      : "account";

  const [newEmail, setNewEmail] = useState("");
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const [isUpdatingNotifications, setIsUpdatingNotifications] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState({
    receive_email_notifications: false,
    receive_sms_notifications: false,
  });
  const [profileVisibility, setProfileVisibility] = useState<
    "public" | "booking_only"
  >("public");
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const canUpdateNotifications = Boolean(user?.id);

  useEffect(() => {
    if (!user) return;

    setNotificationPrefs({
      receive_email_notifications: !!user.receive_email_notifications,
      receive_sms_notifications: !!user.receive_sms_notifications,
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const value = user.profile_visibility;
    if (value === "public" || value === "booking_only") {
      setProfileVisibility(value);
    } else {
      setProfileVisibility("public");
    }
  }, [user?.profile_visibility]);

  const handleUpdateProfileVisibility = async (value: "public" | "booking_only") => {
    if (!user?.id) return;
    setIsUpdatingPrivacy(true);
    try {
      const response = await fetch(`/${locale}/api/settings/update-privacy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_visibility: value }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; profile_visibility?: "public" | "booking_only" }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error || t("privacyUpdateError"));
      }

      if (payload?.profile_visibility === value) {
        setProfileVisibility(value);
      }

      toast.success(t("privacyUpdated"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("privacyUpdateError"));
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  const handleExportData = async () => {
    if (!user?.id) return;
    setIsExporting(true);
    try {
      const response = await fetch(`/${locale}/api/settings/export-data`, {
        method: "POST",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error || t("exportFailed"));
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `export-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success(t("exportDownloaded"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("exportFailed"));
    } finally {
      setIsExporting(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!user?.id) return;
    const email = newEmail.trim();
    if (!isValidEmail(email)) {
      toast.error(t("invalidNewEmail"));
      return;
    }

    setIsUpdatingEmail(true);
    try {
      const response = await fetch(`/${locale}/api/settings/update-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; user?: { email?: string | null } }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error || t("emailUpdateError"));
      }

      setNewEmail("");
      toast.success(
        payload?.user?.email === email ? t("emailUpdated") : t("emailConfirmationSent")
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("emailUpdateError")
      );
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!user?.id) return;

    if (newPassword.length < 6) {
      toast.error(t("passwordTooShort"));
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error(t("passwordsDontMatch"));
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const response = await fetch(`/${locale}/api/settings/update-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: newPassword }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error || t("passwordUpdateError"));
      }

      setNewPassword("");
      setConfirmNewPassword("");
      toast.success(t("passwordUpdated"));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("passwordUpdateError")
      );
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleUpdateNotifications = async (updates: {
    receive_email_notifications: boolean;
    receive_sms_notifications: boolean;
  }) => {
    if (!user?.id) return;

    setIsUpdatingNotifications(true);
    try {
      const updatedUser = await updateUser(user.id, updates);
      setNotificationPrefs({
        receive_email_notifications: !!updatedUser.receive_email_notifications,
        receive_sms_notifications: !!updatedUser.receive_sms_notifications,
      });
      toast.success(t("notificationsUpdated"));
    } catch (err) {
      console.error("[settings] notifications update error:", err);
      toast.error(t("notificationsUpdateError"));
    } finally {
      setIsUpdatingNotifications(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.id) return;

    setIsDeletingAccount(true);
    try {
      const res = await fetch(`/${locale}/api/settings/delete-account`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error || t("deleteAccountFailed"));
      }

      // Ensure client session is cleared.
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.auth.signOut();
      toast.success(t("deleteAccountDeleted"));
      router.push(`/${locale}/login`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("deleteAccountFailed"));
    } finally {
      setIsDeletingAccount(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center">
          <Settings2 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-gray-600">{t("subtitle")}</p>
        </div>
      </div>

      <Tabs defaultValue={initialTab} className="space-y-4">
        <TabsList className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <TabsTrigger value="account" className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            {t("accountTab")}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            {t("notificationsTab")}
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            {user.is_tutor ? t("paymentsAndPayoutsTab") : t("paymentsTab")}
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            {t("privacyTab")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-4">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>{t("accountSectionTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleUpdateEmail();
                }}
              >
                <h2 className="text-lg font-semibold">{t("emailSectionTitle")}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <div className="space-y-2">
                    <Label>{t("currentEmail")}</Label>
                    <p className="text-sm text-gray-700">{user.email}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newEmail">{t("newEmail")}</Label>
                    <Input
                      id="newEmail"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder={t("newEmailPlaceholder")}
                      type="email"
                      autoComplete="email"
                      disabled={isUpdatingEmail || isUpdatingPassword}
                    />
                    <p className="text-xs text-gray-500">
                      {t("emailVerificationHint")}
                    </p>
                  </div>
                </div>
                <Button type="submit" disabled={isUpdatingEmail}>
                  {isUpdatingEmail ? t("updating") : t("updateEmail")}
                </Button>
              </form>

              <form
                className="border-t pt-6 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleUpdatePassword();
                }}
              >
                <h2 className="text-lg font-semibold">{t("passwordSectionTitle")}</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">{t("newPassword")}</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder={t("newPasswordPlaceholder")}
                        autoComplete="new-password"
                        disabled={isUpdatingPassword}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        disabled={isUpdatingPassword}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmNewPassword">{t("confirmNewPassword")}</Label>
                    <div className="relative">
                      <Input
                        id="confirmNewPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmNewPassword}
                        onChange={(e) =>
                          setConfirmNewPassword(e.target.value)
                        }
                        placeholder={t("confirmNewPasswordPlaceholder")}
                        autoComplete="new-password"
                        disabled={isUpdatingPassword}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        disabled={isUpdatingPassword}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <Button type="submit" disabled={isUpdatingPassword}>
                  {isUpdatingPassword ? t("updating") : t("updatePassword")}
                </Button>
              </form>

              <div className="border-t pt-6 space-y-4">
                <h2 className="text-lg font-semibold">{t("deleteSectionTitle")}</h2>
                <p className="text-sm text-gray-600">{t("deleteSectionDescription")}</p>
                <Button
                  variant="destructive"
                  className="flex items-center gap-2"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={isDeletingAccount}
                >
                  <Trash2 className="h-4 w-4" />
                  {t("deleteAccount")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>{t("notificationsSectionTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-base">{t("emailNotifications")}</Label>
                <label className="flex items-center gap-2 text-sm pt-1">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.receive_email_notifications}
                    disabled={!canUpdateNotifications || isUpdatingNotifications}
                    onChange={(e) =>
                      void handleUpdateNotifications({
                        receive_email_notifications: e.target.checked,
                        receive_sms_notifications: notificationPrefs.receive_sms_notifications,
                      })
                    }
                  />
                  {t("enabled")}
                </label>
              </div>

              <div className="space-y-2">
                <Label className="text-base">{t("smsNotifications")}</Label>
                <label className="flex items-center gap-2 text-sm pt-1">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.receive_sms_notifications}
                    disabled={!canUpdateNotifications || isUpdatingNotifications}
                    onChange={(e) =>
                      void handleUpdateNotifications({
                        receive_email_notifications: notificationPrefs.receive_email_notifications,
                        receive_sms_notifications: e.target.checked,
                      })
                    }
                  />
                  {t("enabled")}
                </label>
              </div>

              <div className="border-t pt-6 space-y-3">
                <h2 className="text-lg font-semibold">{t("pushNotifications")}</h2>
                <p className="text-sm text-gray-600">{t("pushNotificationsDescription")}</p>
                <Button variant="outline" disabled>
                  {t("configurePush")}
                  {" "}
                  ({t("comingSoon")})
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>{user.is_tutor ? t("paymentsAndPayoutsTab") : t("paymentsTab")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {user.is_student && (
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold">{t("paymentsMethodsTitle")}</h2>
                  <Button variant="outline" className="w-full justify-start" disabled>
                    {t("savedPaymentMethods")} ({t("comingSoon")})
                  </Button>
                  <p className="text-sm text-gray-600">{t("paymentHistory")}</p>
                </div>
              )}

              {user.is_tutor && (
                <div className="border-t pt-6 space-y-3">
                  <h2 className="text-lg font-semibold">{t("tutorPayoutsTitle")}</h2>
                  <Button variant="outline" className="w-full justify-start" disabled>
                    {t("connectBankAccount")} ({t("comingSoon")})
                  </Button>
                  <p className="text-sm text-gray-600">
                    {t("earningsHistory")}
                  </p>
                  <p className="text-sm text-gray-600">{t("upcomingPayouts")}</p>
                </div>
              )}

              {!user.is_student && !user.is_tutor && (
                <p className="text-sm text-gray-600">{t("noPaymentRole")}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>{t("privacySectionTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">{t("profileVisibility")}</h2>
                <p className="text-sm text-gray-600">{t("profileVisibilityDescription")}</p>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant={profileVisibility === "public" ? "default" : "outline"}
                    className="justify-start w-full"
                    aria-pressed={profileVisibility === "public"}
                    onClick={() => void handleUpdateProfileVisibility("public")}
                    disabled={isUpdatingPrivacy}
                  >
                    {t("profileVisibilityPublic")}
                  </Button>
                  <Button
                    type="button"
                    variant={
                      profileVisibility === "booking_only" ? "default" : "outline"
                    }
                    className="justify-start w-full"
                    aria-pressed={profileVisibility === "booking_only"}
                    onClick={() => void handleUpdateProfileVisibility("booking_only")}
                    disabled={isUpdatingPrivacy}
                  >
                    {t("profileVisibilityOnlyWithBooking")}
                  </Button>
                </div>
              </div>

              <div className="border-t pt-6 space-y-3">
                <h2 className="text-lg font-semibold">{t("exportData")}</h2>
                <p className="text-sm text-gray-600">{t("exportDataDescription")}</p>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => void handleExportData()}
                  disabled={isExporting}
                >
                  {isExporting ? t("exporting") : t("exportDataButton")}
                </Button>
                <p className="text-xs text-gray-500">{t("exportUnavailable")}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{t("deleteAccountConfirmTitle")}</DialogTitle>
            <DialogDescription>{t("deleteAccountConfirmDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              type="button"
              disabled={isDeletingAccount}
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              type="button"
              onClick={() => void handleDeleteAccount()}
              disabled={isDeletingAccount}
            >
              {isDeletingAccount ? t("deleting") : t("deleteAccountConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

