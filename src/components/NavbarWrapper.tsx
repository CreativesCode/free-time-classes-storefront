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
import { Menu, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavbarWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  console.log("user", user);
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
              <Link href="/" className="flex items-center">
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
                  href="/tutors"
                  className="px-3 py-2 text-[15px] text-gray-700 hover:text-gray-900"
                >
                  Find tutors
                </Link>
                <Link
                  href="/courses"
                  className="px-3 py-2 text-[15px] text-gray-700 hover:text-gray-900"
                >
                  Courses
                </Link>
                <Link
                  href="/about"
                  className="px-3 py-2 text-[15px] text-gray-700 hover:text-gray-900"
                >
                  About us
                </Link>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative rounded-full bg-primary-200 hover:bg-primary-300"
                    >
                      {user.username}
                      <User className="h-12 w-12" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
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
                        href={
                          user.isStaff
                            ? "/admin-profile"
                            : user.isTutor
                            ? "/teacher-profile"
                            : "/student-profile"
                        }
                        className="w-full"
                      >
                        Mi Perfil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/my-courses" className="w-full">
                        Mis Cursos
                      </Link>
                    </DropdownMenuItem>
                    {user.isTutor && (
                      <DropdownMenuItem asChild>
                        <Link href="/tutor/dashboard" className="w-full">
                          Panel de Profesor
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {user.isStaff && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin/dashboard" className="w-full">
                          Panel de Admin
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Link href="/login">
                    <Button
                      variant="ghost"
                      className="text-[15px] text-primary-800 font-semibold"
                    >
                      Log in
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="text-[15px] bg-primary-700 hover:bg-primary-800 text-white">
                      Sign up
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/tutors" className="w-full">
                      Find tutors
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/courses" className="w-full">
                      Courses
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/about" className="w-full">
                      About us
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
