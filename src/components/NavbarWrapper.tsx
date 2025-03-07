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
import { useLocale } from "next-intl";
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

  if (["/login/", "/register/"].includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-[72px]">
            {/* Left side */}
            <div className="flex items-center space-x-8">
              {/* Logo */}
              <Link href={`/${locale}/`} className="flex items-center">
                <Image
                  src="/images/logo.png"
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
                  Courses
                </Link>
                <Link
                  href={`/${locale}/about`}
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  About
                </Link>
                <Link
                  href={`/${locale}/contact`}
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Contact
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
                          user.isStudent ? "student" : "teacher"
                        }-profile`}
                      >
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/${locale}/settings`}>Settings</Link>
                    </DropdownMenuItem>
                    {user.isTutor && (
                      <DropdownMenuItem asChild>
                        <Link href={`/${locale}/tutor/dashboard`}>
                          Tutor Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {user.isStaff && (
                      <DropdownMenuItem asChild>
                        <Link href={`/${locale}/admin/dashboard`}>
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link href={`/${locale}/login`}>
                    <Button variant="ghost">Log in</Button>
                  </Link>
                  <Link href={`/${locale}/register`}>
                    <Button>Sign up</Button>
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
