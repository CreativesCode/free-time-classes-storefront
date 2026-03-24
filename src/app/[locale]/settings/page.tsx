"use client";

import ConfirmActionDialog from "@/components/common/ConfirmActionDialog";
import { updateUser } from "@/lib/supabase/queries/users";
import { useAuth } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  Settings2,
  Trash2,
  ShieldCheck,
  Bell,
  CreditCard,
  Eye,
  EyeOff,
  Download,
  Search,
  Filter,
  ReceiptText,
  GraduationCap,
  Brain,
  Video,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

function isValidEmail(email: string) {
  // Simple validation for UX; Supabase will still enforce correctness.
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export default function SettingsPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
      <SettingsPage />
    </Suspense>
  );
}

function SettingsPage() {
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
  const [currentTab, setCurrentTab] = useState(initialTab);

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

  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const canUpdateNotifications = Boolean(user?.id);
  const paymentHistory = [
    {
      id: "INV-2024-11",
      title: t("paymentHistoryItem1Title"),
      subtitle: t("paymentHistoryItem1Subtitle"),
      amount: "$49.00",
      status: "paid" as const,
      icon: ReceiptText,
    },
    {
      id: "INV-2024-10",
      title: t("paymentHistoryItem2Title"),
      subtitle: t("paymentHistoryItem2Subtitle"),
      amount: "$129.00",
      status: "paid" as const,
      icon: GraduationCap,
    },
    {
      id: "INV-2024-09",
      title: t("paymentHistoryItem3Title"),
      subtitle: t("paymentHistoryItem3Subtitle"),
      amount: "$75.00",
      status: "pending" as const,
      icon: Brain,
    },
  ];

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
  }, [user]);

  useEffect(() => {
    if (!user?.is_tutor) return;
    fetch("/api/google/status")
      .then((res) => res.json())
      .then((data: { connected?: boolean }) => setGoogleConnected(!!data.connected))
      .catch(() => setGoogleConnected(false));
  }, [user?.is_tutor]);

  useEffect(() => {
    const googleParam = searchParams.get("google");
    if (googleParam === "success") {
      toast.success(t("googleCalendarSuccess"));
      setGoogleConnected(true);
    } else if (googleParam === "error") {
      toast.error(t("googleCalendarError"));
    }
  }, [searchParams, t]);

  const handleUpdateProfileVisibility = async (value: "public" | "booking_only") => {
    if (!user?.id) return;
    setIsUpdatingPrivacy(true);
    try {
      const response = await fetch(`/api/settings/update-privacy`, {
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

  const handleGoogleConnect = async () => {
    setGoogleLoading(true);
    try {
      const res = await fetch("/api/google/auth");
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || t("googleCalendarError"));
        setGoogleLoading(false);
      }
    } catch {
      toast.error(t("googleCalendarError"));
      setGoogleLoading(false);
    }
  };

  const handleGoogleDisconnect = async () => {
    setGoogleLoading(true);
    try {
      const res = await fetch("/api/google/disconnect", { method: "POST" });
      if (res.ok) {
        setGoogleConnected(false);
        toast.success(t("googleCalendarDisconnected"));
      } else {
        toast.error(t("googleCalendarDisconnectError"));
      }
    } catch {
      toast.error(t("googleCalendarDisconnectError"));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleExportData = async () => {
    if (!user?.id) return;
    setIsExporting(true);
    try {
      const response = await fetch(`/api/settings/export-data`, {
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
      const response = await fetch(`/api/settings/update-email`, {
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
      const response = await fetch(`/api/settings/update-password`, {
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
      const res = await fetch(`/api/settings/delete-account`, {
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
  const displayName = user.username || user.email || "U";

  return (
    <div className="relative overflow-hidden bg-[#fef3ff]">
      <div className="pointer-events-none absolute -right-24 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-purple-300/20 blur-3xl" />
      <div className="mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-6 md:py-8 lg:py-10">
        <Tabs
          value={currentTab}
          onValueChange={(value) =>
            setCurrentTab(value as "account" | "notifications" | "payments" | "privacy")
          }
          className="space-y-5"
        >
          <div className="rounded-lg border border-primary/10 bg-white/75 p-4 shadow-[0_20px_60px_-35px_rgba(112,42,225,0.45)] backdrop-blur-md sm:p-6 lg:p-7">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Settings2 className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 md:hidden">
                    {t("title")}
                  </h1>
                  <h1 className="hidden text-3xl font-extrabold tracking-tight text-zinc-900 md:block lg:text-4xl">
                    {t("title")}
                  </h1>
                  <p className="text-sm text-zinc-600 sm:text-base">{t("subtitle")}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
              <TabsList className="grid h-auto w-full grid-cols-4 gap-2 bg-[#faecff] p-1 md:grid-cols-4 lg:sticky lg:top-6 lg:grid-cols-1 lg:gap-1 lg:self-start lg:rounded-lg lg:p-2">
                <TabsTrigger
                  value="account"
                  className="justify-center gap-2 rounded-md py-2.5 text-xs data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm lg:justify-start lg:px-3 lg:text-sm"
                >
                  <ShieldCheck className="h-4 w-4" />
                    <span className="hidden sm:inline">{t("accountTab")}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="notifications"
                  className="justify-center gap-2 rounded-md py-2.5 text-xs data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm lg:justify-start lg:px-3 lg:text-sm"
                >
                  <Bell className="h-4 w-4" />
                    <span className="hidden sm:inline">{t("notificationsTab")}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="payments"
                  className="justify-center gap-2 rounded-md py-2.5 text-xs data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm lg:justify-start lg:px-3 lg:text-sm"
                >
                  <CreditCard className="h-4 w-4" />
                    <span className="hidden sm:inline">
                    {user.is_tutor ? t("paymentsAndPayoutsTab") : t("paymentsTab")}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="privacy"
                  className="justify-center gap-2 rounded-md py-2.5 text-xs data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm lg:justify-start lg:px-3 lg:text-sm"
                >
                  <span className="text-base leading-none">🔒</span>
                    <span className="hidden sm:inline">{t("privacyTab")}</span>
                </TabsTrigger>
              </TabsList>

              <div className="space-y-4">
                <TabsContent value="account" className="space-y-4">
                    <Card className="w-full border-primary/10 bg-white/95 shadow-[0_25px_55px_-40px_rgba(112,42,225,0.65)]">
            <CardHeader>
              <div className="mb-2 flex items-center gap-3 rounded-lg bg-[#faecff] p-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{displayName || t("accountTab")}</p>
                  <p className="text-xs text-zinc-600">{user.email}</p>
                </div>
              </div>
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

                    {user.is_tutor && (
                      <Card className="w-full border-primary/10 bg-white/95 shadow-[0_25px_55px_-40px_rgba(112,42,225,0.65)]">
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <Video className="h-5 w-5" />
                            </div>
                            <div>
                              <CardTitle>{t("googleCalendarIntegrationsTitle")}</CardTitle>
                              <p className="text-sm text-zinc-600">{t("googleCalendarDescription")}</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="rounded-lg border border-primary/10 bg-[#faecff] p-4">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none">
                                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                <div>
                                  <p className="font-semibold text-zinc-900">{t("googleCalendarTitle")}</p>
                                  {googleConnected === null ? (
                                    <div className="flex items-center gap-1 text-sm text-zinc-500">
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    </div>
                                  ) : googleConnected ? (
                                    <div className="flex items-center gap-1 text-sm text-emerald-600">
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                      {t("googleCalendarConnected")}
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 text-sm text-zinc-500">
                                      <XCircle className="h-3.5 w-3.5" />
                                      {t("googleCalendarNotConnected")}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div>
                                {googleConnected ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => void handleGoogleDisconnect()}
                                    disabled={googleLoading}
                                  >
                                    {googleLoading ? t("googleCalendarDisconnecting") : t("googleCalendarDisconnect")}
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => void handleGoogleConnect()}
                                    disabled={googleLoading || googleConnected === null}
                                  >
                                    {googleLoading ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t("googleCalendarConnecting")}
                                      </>
                                    ) : (
                                      t("googleCalendarConnect")
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                            {googleConnected && (
                              <p className="mt-3 text-xs text-zinc-600">
                                {t("googleCalendarAutoMeetHint")}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                </TabsContent>

                <TabsContent value="notifications" className="space-y-4">
                  <Card className="w-full border-primary/10 bg-white/95 shadow-[0_25px_55px_-40px_rgba(112,42,225,0.65)]">
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
                  <Card className="w-full border-primary/10 bg-white/95 shadow-[0_25px_55px_-40px_rgba(112,42,225,0.65)]">
            <CardHeader>
              <CardTitle>{user.is_tutor ? t("paymentsAndPayoutsTab") : t("paymentsTab")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {(user.is_student || user.is_tutor) && (
                <div className="space-y-6">
                  <section className="overflow-hidden rounded-lg bg-gradient-to-br from-primary to-violet-700 p-5 text-white sm:p-6">
                    <div className="relative z-10">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                        {t("currentSubscription")}
                      </p>
                      <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
                        {user.is_tutor ? t("tutorPlanTitle") : t("studentPlanTitle")}
                      </h2>
                      <div className="mt-6 flex items-end justify-between gap-3">
                        <div>
                          <p className="text-sm text-white/80">{t("nextPaymentDateLabel")}</p>
                          <p className="font-semibold">{t("nextPaymentDateValue")}</p>
                        </div>
                        <p className="text-3xl font-black sm:text-4xl">$49</p>
                      </div>
                      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Button className="rounded-md bg-white text-primary hover:bg-white/90">
                          {t("upgradePlan")}
                        </Button>
                        <Button
                          variant="outline"
                          className="rounded-md border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
                        >
                          {t("managePaymentMethod")}
                        </Button>
                      </div>
                    </div>
                  </section>

                  <section className="grid grid-cols-1 gap-4 md:grid-cols-5">
                    <div className="rounded-lg border border-primary/10 bg-[#faecff] p-4 md:col-span-2">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary/70">
                        {t("savedCardLabel")}
                      </p>
                      <div className="mt-5 flex items-center justify-between">
                        <div>
                          <p className="text-xl font-extrabold text-zinc-900">•••• •••• •••• 8812</p>
                          <p className="mt-1 text-sm text-zinc-600">{t("cardExpires")}: 09/27</p>
                        </div>
                        <CreditCard className="h-8 w-8 text-primary" />
                      </div>
                    </div>

                    <div className="rounded-lg border border-primary/10 bg-white p-4 md:col-span-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="text-lg font-bold text-zinc-900">{t("paymentHistoryTitle")}</h3>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-zinc-500">
                            <Search className="h-4 w-4" />
                            <span className="text-xs">{t("searchInvoicesPlaceholder")}</span>
                          </div>
                          <Button variant="outline" size="icon" className="rounded-md">
                            <Filter className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-lg border border-primary/10 bg-[#faf7ff] p-3 sm:p-4">
                    <div className="hidden rounded-md border border-primary/10 bg-white lg:block">
                      <div className="grid grid-cols-12 border-b border-zinc-100 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                        <p className="col-span-5">{t("invoiceColumn")}</p>
                        <p className="col-span-2">{t("amountColumn")}</p>
                        <p className="col-span-2">{t("statusColumn")}</p>
                        <p className="col-span-3 text-right">{t("receiptColumn")}</p>
                      </div>
                      <div className="divide-y divide-zinc-100">
                        {paymentHistory.map((item) => (
                          <div key={item.id} className="grid grid-cols-12 items-center px-4 py-4">
                            <div className="col-span-5 flex items-center gap-3">
                              <div className="rounded-full bg-primary/10 p-2 text-primary">
                                <item.icon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-semibold text-zinc-900">{item.title}</p>
                                <p className="text-xs text-zinc-500">{item.subtitle}</p>
                              </div>
                            </div>
                            <p className="col-span-2 text-base font-bold text-zinc-900">{item.amount}</p>
                            <div className="col-span-2">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  item.status === "paid"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {item.status === "paid" ? t("statusPaid") : t("statusPending")}
                              </span>
                            </div>
                            <div className="col-span-3 flex justify-end">
                              <Button variant="ghost" className="gap-2 text-primary">
                                <Download className="h-4 w-4" />
                                PDF
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 lg:hidden">
                      {paymentHistory.map((item) => (
                        <article key={item.id} className="rounded-md border border-primary/10 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="rounded-full bg-primary/10 p-2 text-primary">
                                <item.icon className="h-4 w-4" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-zinc-900">{item.title}</h4>
                                <p className="text-xs text-zinc-500">{item.subtitle}</p>
                              </div>
                            </div>
                            <p className="text-base font-extrabold text-zinc-900">{item.amount}</p>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                item.status === "paid"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {item.status === "paid" ? t("statusPaid") : t("statusPending")}
                            </span>
                            <Button variant="ghost" size="sm" className="gap-2 text-primary">
                              <Download className="h-4 w-4" />
                              {t("downloadInvoice")}
                            </Button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-lg border border-primary/10 bg-white p-4 sm:p-5">
                    <h3 className="text-base font-bold text-zinc-900">{t("billingSupportTitle")}</h3>
                    <p className="mt-1 text-sm text-zinc-600">{t("billingSupportDescription")}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button variant="outline" className="rounded-md">
                        {t("contactSupport")}
                      </Button>
                      <Button variant="ghost" className="rounded-md text-primary">
                        {t("billingFaq")}
                      </Button>
                    </div>
                  </section>
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
                  <Card className="w-full border-primary/10 bg-white/95 shadow-[0_25px_55px_-40px_rgba(112,42,225,0.65)]">
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
              </div>
            </div>
          </div>
        </Tabs>

        <ConfirmActionDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          title={t("deleteAccountConfirmTitle")}
          description={t("deleteAccountConfirmDescription")}
          cancelLabel={t("cancel")}
          confirmLabel={isDeletingAccount ? t("deleting") : t("deleteAccountConfirm")}
          loading={isDeletingAccount}
          onCancel={() => setIsDeleteDialogOpen(false)}
          onConfirm={() => {
            void handleDeleteAccount();
          }}
        />
      </div>
    </div>
  );
}

