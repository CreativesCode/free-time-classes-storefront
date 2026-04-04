"use client";

import { SelectMenu } from "@/components/ui/select-menu";
import { useUserApp } from "@/context/AppContext";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const user = useUserApp();
  const [lang, setLang] = useState("en");
  const [currency, setCurrency] = useState("usd");

  const langOptions = useMemo(
    () => [
      { value: "en", label: "English" },
      { value: "es", label: "Español" },
    ],
    []
  );
  const currencyOptions = useMemo(
    () => [
      { value: "usd", label: "USD" },
      { value: "eur", label: "EUR" },
    ],
    []
  );

  // Don't show navbar on login or register pages
  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    user.setData(null);
    router.push("/login");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl font-bold">
              Free Time Classes
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/tutors" className="text-gray-600 hover:text-gray-900">
              Find tutors
            </Link>
            <Link
              href="/corporate"
              className="text-gray-600 hover:text-gray-900"
            >
              Corporate training
            </Link>
            <Link
              href="/become-tutor"
              className="text-gray-600 hover:text-gray-900"
            >
              Become a tutor
            </Link>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2">
              <SelectMenu
                fullWidth={false}
                value={lang}
                onValueChange={setLang}
                options={langOptions}
                aria-label="Language"
                triggerClassName="h-9 min-w-[5.5rem] border-0 bg-transparent px-2 text-sm font-normal text-gray-600 shadow-none hover:bg-gray-100/80"
                contentClassName="min-w-[8rem]"
              />
              <SelectMenu
                fullWidth={false}
                value={currency}
                onValueChange={setCurrency}
                options={currencyOptions}
                aria-label="Currency"
                triggerClassName="h-9 min-w-[4rem] border-0 bg-transparent px-2 text-sm font-normal text-gray-600 shadow-none hover:bg-gray-100/80"
                contentClassName="min-w-[6rem]"
              />
            </div>
            {user.data ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">{user.data.username}</span>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Log In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
