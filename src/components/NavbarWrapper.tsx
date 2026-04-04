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
  CircleHelp,
  CreditCard,
  FolderOpen,
  GraduationCap,
  Home,
  LayoutDashboard,
  Menu,
  MessageSquare,
  School,
  User,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import LanguageSwitcher from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";

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
    return (
      <>
        {children}
        <div
          className="fixed bottom-4 right-4 z-[60] md:bottom-8 md:right-8 lg:bottom-10 lg:right-10"
          style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
        >
          <ThemeToggle />
        </div>
      </>
    );
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

  const mobilePrimaryLinks = [
    {
      href: `/${locale}/${user?.is_tutor ? "tutor/dashboard" : "dashboard"}`,
      label: t("dashboard"),
      icon: LayoutDashboard,
      requiresAuth: true,
    },
    {
      href: `/${locale}/bookings`,
      label: t("bookings"),
      icon: School,
      requiresAuth: true,
    },
    {
      href: `/${locale}/messages`,
      label: t("messages"),
      icon: MessageSquare,
      requiresAuth: true,
    },
    {
      href: `/${locale}/tutors`,
      label: t("tutors"),
      icon: User,
      requiresAuth: false,
    },
    {
      href: `/${locale}/settings`,
      label: t("settings"),
      icon: CreditCard,
      requiresAuth: true,
    },
    {
      href: `/${locale}/courses`,
      label: t("courses"),
      icon: FolderOpen,
      requiresAuth: false,
    },
    {
      href: `/${locale}/contact`,
      label: t("contact"),
      icon: CircleHelp,
      requiresAuth: false,
    },
  ].filter((link) => !link.requiresAuth || user);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── Top navbar ── */}
      <nav
        className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/65 dark:border-border dark:bg-background/90"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-[72px] md:h-[76px]">
            {/* Left */}
            <div className="flex items-center space-x-8">
              <Link href={`/${locale}/`} className="flex items-center">
                <Image
                  src="/images/Isotipo.svg"
                  alt="Free Time Classes Logo"
                  className="h-12 w-auto md:h-16"
                  width={50}
                  height={60}
                  sizes="50px"
                />
              </Link>

              <div className="hidden items-center rounded-full border border-border/60 bg-card/70 p-1 shadow-sm md:flex dark:bg-card/50">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
                      isActive(link.href)
                        ? "bg-primary/10 text-primary"
                        : "text-foreground/80 hover:bg-primary/5 hover:text-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Mobile / small: theme always visible */}
              <div className="md:hidden">
                <ThemeToggle />
              </div>

              {/* Tablet + desktop: language + theme + account */}
              <div className="hidden items-center gap-2 md:flex">
                <LanguageSwitcher />
                <ThemeToggle />
              </div>

              {/* Desktop user menu */}
              <div className="hidden md:block">
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="relative h-10 gap-2 rounded-full border border-border/60 bg-card/80 pl-3 pr-2 shadow-sm hover:bg-primary/5 dark:bg-card/60"
                      >
                        <span className="text-sm">{user.username}</span>
                        <UserAvatar user={user} className="h-6 w-6" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-56 rounded-sm p-0.5 shadow-md"
                      align="end"
                      forceMount
                    >
                      <DropdownMenuLabel className="rounded-sm font-normal">
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
                      <DropdownMenuItem asChild className="rounded-sm">
                        <Link href={profileHref}>{t("profile")}</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-sm">
                        <Link
                          href={`/${locale}/${user.is_tutor ? "tutor/dashboard" : "dashboard"}`}
                        >
                          {t("dashboard")}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-sm">
                        <Link href={`/${locale}/bookings`}>
                          {t("bookings")}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-sm">
                        <Link href={`/${locale}/messages`}>
                          {t("messages")}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-sm">
                        <Link href={`/${locale}/settings`}>
                          {t("settings")}
                        </Link>
                      </DropdownMenuItem>
                      {user.is_tutor && (
                        <DropdownMenuItem asChild className="rounded-sm">
                          <Link href={`/${locale}/tutor/dashboard`}>
                            <GraduationCap className="mr-2 h-4 w-4" />
                            {t("tutorDashboard")}
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="rounded-sm"
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
                      <Button variant="ghost" size="sm" className="rounded-full">
                        {t("login")}
                      </Button>
                    </Link>
                    <Link href={`/${locale}/register`}>
                      <Button
                        size="sm"
                        className="rounded-full bg-gradient-to-r from-primary to-violet-500 shadow-sm"
                      >
                        {t("register")}
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full p-2 text-foreground hover:bg-primary/10 focus:outline-none md:hidden"
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
            className="absolute inset-0 bg-[#180429]/45 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Panel */}
          <div className="absolute left-0 top-0 h-full w-[85%] max-w-[340px] overflow-y-auto bg-[#FAECFF] shadow-2xl animate-in slide-in-from-left duration-200 dark:bg-card">
            {/* Header */}
            <div className="flex flex-col gap-5 border-b border-border/60 px-6 pb-6 pt-10 dark:border-border">
              <div className="flex items-center justify-between">
                {user ? (
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full p-[2px] bg-gradient-to-tr from-primary to-fuchsia-400">
                      <UserAvatar
                        user={user}
                        className="h-full w-full border-2 border-[#FAECFF] dark:border-card"
                      />
                    </div>
                    <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-[#FAECFF] bg-emerald-500 dark:border-card" />
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-foreground">{t("menu")}</p>
                )}
                <button
                  type="button"
                  className="rounded-full p-2 text-muted-foreground hover:bg-background/80"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {user ? (
                <>
                  <div className="space-y-1">
                    <h2 className="text-xl font-extrabold tracking-tight text-foreground">
                      {user.username}
                    </h2>
                    <p className="truncate text-xs font-medium text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/70 p-4 dark:bg-background/60">
                    <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-primary">
                      <span>Tu progreso</span>
                      <span>72%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary/10">
                      <div className="h-full w-[72%] rounded-full bg-primary" />
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">{t("login")} / {t("register")}</p>
              )}
            </div>

            <div className="py-3">
              <div className="px-3 space-y-1">
                {mobilePrimaryLinks.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm transition-colors ${
                        active
                          ? "bg-primary/15 font-semibold text-primary"
                          : "text-foreground/90 hover:bg-primary/5"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{link.label}</span>
                      {active && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </Link>
                  );
                })}
              </div>

              <div className="my-3 border-t border-border/60 dark:border-border" />

              <div className="px-3 space-y-1">
                <Link
                  href={profileHref}
                  className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm ${
                    isActive(profileHref)
                      ? "bg-primary/10 font-semibold text-primary"
                      : "text-foreground/90 hover:bg-primary/5"
                  }`}
                >
                  {t("profile")}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
                {user?.is_tutor && (
                  <Link
                    href={`/${locale}/tutor/dashboard`}
                    className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm ${
                      isActive(`/${locale}/tutor/dashboard`)
                        ? "bg-primary/10 font-semibold text-primary"
                        : "text-foreground/90 hover:bg-primary/5"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      {t("tutorDashboard")}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                )}
              </div>

              <div className="my-3 border-t border-border/60 dark:border-border" />

              <div className="px-3">
                <ThemeToggle variant="menu-row" />
              </div>

              <div className="my-3 border-t border-border/60 dark:border-border" />

              {/* Language switcher */}
              <div className="px-5 py-2">
                <LanguageSwitcher />
              </div>

              <div className="my-3 border-t border-border/60 dark:border-border" />

              {/* Auth actions */}
              <div className="px-4 pb-6">
                {user ? (
                  <Button
                    variant="outline"
                    className="w-full justify-center rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? t("loggingOut") : t("logout")}
                  </Button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link href={`/${locale}/login`}>
                      <Button variant="outline" className="w-full rounded-xl">
                        {t("login")}
                      </Button>
                    </Link>
                    <Link href={`/${locale}/register`}>
                      <Button className="w-full rounded-xl bg-gradient-to-r from-primary to-violet-500">
                        {t("register")}
                      </Button>
                    </Link>
                  </div>
                )}
                <p className="mt-5 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  FreeTime Classes
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <main className="flex flex-col flex-1 pb-16 md:pb-0">{children}</main>

      {/* ── Bottom tab bar (mobile only) ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background md:hidden dark:border-border"
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
                className={`flex h-full flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`}
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
