"use client";

import { useUserApp } from "@/context/AppContext";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const user = useUserApp();

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
              <select className="bg-transparent border-none text-sm text-gray-600 focus:outline-none cursor-pointer">
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
              <select className="bg-transparent border-none text-sm text-gray-600 focus:outline-none cursor-pointer">
                <option value="usd">USD</option>
                <option value="eur">EUR</option>
              </select>
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
