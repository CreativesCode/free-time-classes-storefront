"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/UserContext";
import { getPublicUrl } from "@/lib/supabase/storage";
import {
  BookOpen,
  ChevronRight,
  GraduationCap,
  Home,
  LayoutDashboard,
  Menu,
  MessageSquare,
  User,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import LanguageSwitcher from "./LanguageSwitcher";

function UserAvatar({
  user,
  className,
}: {
  user: { username: string; profile_picture?: string | null };
  className?: string;
}) {
  const avatarUrl = user.profile_picture
    ? user.profile_picture.startsWith("http")
      ? user.profile_picture
      : getPublicUrl("avatars", user.profile_picture)
    : null;

  return (
    <Avatar className={className}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={user.username} />}
      <AvatarFallback>
        <User className="h-4 w-4" />
      </AvatarFallback>
    </Avatar>
  );
}

export default function NavbarWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = useLocale();
  const { user } = useAuth();
  const pathname = usePathname();
  const t = useTranslations("navbar");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const logoutTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (logoutTimeoutRef.current) {
        window.clearTimeout(logoutTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    setMobileMenuOpen(false);
    const logoutUrl = `/${locale}/auth/logout`;

    logoutTimeoutRef.current = window.setTimeout(() => {
      window.location.assign(logoutUrl);
    }, 4000);

    try {
      await fetch(logoutUrl, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      window.location.assign(`/${locale}/`);
    } catch (error) {
      console.error("Server logout request failed:", error);
      window.location.assign(logoutUrl);
    }
  };

  const profileHref = user
    ? `/${locale}/${user.is_student ? "student" : "teacher"}-profile`
    : `/${locale}/login`;

  const isActive = useCallback(
    (href: string) => pathname === href || pathname.startsWith(href + "/"),
    [pathname],
  );

  if (pathname.includes("/login") || pathname.includes("/register")) {
    return <>{children}</>;
  }

  const navLinks = [
    { href: `/${locale}/courses`, label: t("courses") },
    { href: `/${locale}/tutors`, label: t("tutors") },
    { href: `/${locale}/about`, label: t("about") },
    { href: `/${locale}/contact`, label: t("contact") },
  ];

  const bottomTabs = [
    { href: `/${locale}/`, icon: Home, label: t("home") },
    { href: `/${locale}/courses`, icon: BookOpen, label: t("courses") },
    {
      href: `/${locale}/${user?.is_tutor ? "tutor/dashboard" : "dashboard"}`,
      icon: LayoutDashboard,
      label: t("dashboard"),
    },
    { href: `/${locale}/messages`, icon: MessageSquare, label: t("messages") },
    { href: profileHref, icon: User, label: t("profile") },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* ── Top navbar ── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-[72px]">
            {/* Left */}
            <div className="flex items-center space-x-8">
              <Link href={`/${locale}/`} className="flex items-center">
                <Image
                  src="/images/isotipo.svg"
                  alt="Free Time Classes Logo"
                  className="h-16 w-auto"
                  width={50}
                  height={60}
                />
              </Link>

              <div className="hidden md:flex items-center space-x-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive(link.href)
                        ? "text-primary bg-primary/5"
                        : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center space-x-3">
              <div className="hidden md:block">
                <LanguageSwitcher />
              </div>

              {/* Desktop user menu */}
              <div className="hidden md:block">
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="relative h-9 gap-2 rounded-full border border-gray-300 bg-primary-100 pl-3 pr-2"
                      >
                        <span className="text-sm">{user.username}</span>
                        <UserAvatar user={user} className="h-6 w-6" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-56"
                      align="end"
                      forceMount
                    >
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {user.username}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={profileHref}>{t("profile")}</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/${locale}/${user.is_tutor ? "tutor/dashboard" : "dashboard"}`}
                        >
                          {t("dashboard")}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/${locale}/bookings`}>
                          {t("bookings")}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/${locale}/messages`}>
                          {t("messages")}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/${locale}/settings`}>
                          {t("settings")}
                        </Link>
                      </DropdownMenuItem>
                      {user.is_tutor && (
                        <DropdownMenuItem asChild>
                          <Link href={`/${locale}/tutor/dashboard`}>
                            <GraduationCap className="mr-2 h-4 w-4" />
                            {t("tutorDashboard")}
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                      >
                        {isLoggingOut ? t("loggingOut") : t("logout")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Link href={`/${locale}/login`}>
                      <Button variant="ghost" size="sm">
                        {t("login")}
                      </Button>
                    </Link>
                    <Link href={`/${locale}/register`}>
                      <Button size="sm">{t("register")}</Button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                type="button"
                className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 focus:outline-none"
                onClick={() => setMobileMenuOpen((v) => !v)}
                aria-label={t("menu")}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile slide-out menu ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 top-0 h-full w-[80%] max-w-sm bg-white shadow-xl overflow-y-auto animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-[72px] border-b border-gray-200">
              {user ? (
                <div className="flex items-center gap-3">
                  <UserAvatar user={user} className="h-10 w-10" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.username}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              ) : (
                <span className="text-sm font-semibold text-gray-900">
                  {t("menu")}
                </span>
              )}
              <button
                type="button"
                className="rounded-md p-2 text-gray-500 hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-3">
              {/* Navigation links */}
              <div className="px-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive(link.href)
                        ? "text-primary bg-primary/5"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {link.label}
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </Link>
                ))}
              </div>

              {user && (
                <>
                  <div className="my-3 border-t border-gray-200" />
                  <div className="px-2">
                    <Link
                      href={profileHref}
                      className={`flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActive(profileHref)
                          ? "text-primary bg-primary/5"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {t("profile")}
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </Link>
                    <Link
                      href={`/${locale}/${user.is_tutor ? "tutor/dashboard" : "dashboard"}`}
                      className="flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      {t("dashboard")}
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </Link>
                    <Link
                      href={`/${locale}/bookings`}
                      className={`flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActive(`/${locale}/bookings`)
                          ? "text-primary bg-primary/5"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {t("bookings")}
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </Link>
                    <Link
                      href={`/${locale}/messages`}
                      className={`flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActive(`/${locale}/messages`)
                          ? "text-primary bg-primary/5"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {t("messages")}
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </Link>
                    <Link
                      href={`/${locale}/settings`}
                      className={`flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActive(`/${locale}/settings`)
                          ? "text-primary bg-primary/5"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {t("settings")}
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </Link>
                    {user.is_tutor && (
                      <Link
                        href={`/${locale}/tutor/dashboard`}
                        className={`flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                          isActive(`/${locale}/tutor/dashboard`)
                            ? "text-primary bg-primary/5"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4" />
                          {t("tutorDashboard")}
                        </span>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </Link>
                    )}
                  </div>
                </>
              )}

              <div className="my-3 border-t border-gray-200" />

              {/* Language switcher */}
              <div className="px-5 py-2">
                <LanguageSwitcher />
              </div>

              <div className="my-3 border-t border-gray-200" />

              {/* Auth actions */}
              <div className="px-4">
                {user ? (
                  <Button
                    variant="outline"
                    className="w-full justify-center"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? t("loggingOut") : t("logout")}
                  </Button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link href={`/${locale}/login`}>
                      <Button variant="outline" className="w-full">
                        {t("login")}
                      </Button>
                    </Link>
                    <Link href={`/${locale}/register`}>
                      <Button className="w-full">{t("register")}</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <main className="flex flex-col flex-1 pb-16 md:pb-0">{children}</main>

      {/* ── Bottom tab bar (mobile only) ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center justify-around h-16">
          {bottomTabs.map((tab) => {
            const Icon = tab.icon;
            const active =
              tab.href === `/${locale}/`
                ? pathname === `/${locale}` || pathname === `/${locale}/`
                : isActive(tab.href);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-[10px] font-medium transition-colors ${
                  active ? "text-primary" : "text-gray-500"
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${active ? "text-primary" : "text-gray-400"}`}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
