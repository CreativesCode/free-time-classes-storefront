"use client";

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
import { User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LanguageSwitcher from "./LanguageSwitcher";

export default function NavbarWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = useLocale();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const t = useTranslations("navbar");

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Finalize logout on the server as well to guarantee cookie cleanup
      // used by middleware-based auth checks.
      window.location.assign(`/${locale}/auth/logout`);
    }
  };

  // Check if the current path is for authentication pages
  if (pathname.includes("/login") || pathname.includes("/register")) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-[72px]">
            {/* Left side */}
            <div className="flex items-center space-x-8">
              {/* Logo */}
              <Link href={`/${locale}/`} className="flex items-center">
                <Image
                  src="/images/isotipo.svg"
                  alt="Free Time Classes Logo"
                  className="h-16 w-auto"
                  width={50}
                  height={60}
                />
              </Link>

              {/* Primary Navigation */}
              <div className="hidden md:flex items-center space-x-1">
                <Link
                  href={`/${locale}/courses`}
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  {t("courses")}
                </Link>
                <Link
                  href={`/${locale}/about`}
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  {t("about")}
                </Link>
                <Link
                  href={`/${locale}/contact`}
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  {t("contact")}
                </Link>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Language Switcher */}
              <LanguageSwitcher />

              {/* User Menu */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 rounded-full border border-gray-300 bg-primary-100"
                    >
                      {user.username}
                      <User className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
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
                      <Link
                        href={`/${locale}/${
                          user.is_student ? "student" : "teacher"
                        }-profile`}
                      >
                        {t("profile")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/${locale}/settings`}>{t("settings")}</Link>
                    </DropdownMenuItem>
                    {user.is_tutor && (
                      <DropdownMenuItem asChild>
                        <Link href={`/${locale}/tutor/dashboard`}>
                          {t("tutorDashboard")}
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      {t("logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link href={`/${locale}/login`}>
                    <Button variant="ghost">{t("login")}</Button>
                  </Link>
                  <Link href={`/${locale}/register`}>
                    <Button>{t("register")}</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
