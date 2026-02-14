"use client";
import type React from "react";
import Link from "next/link";
import { Home, Users, Building2 } from "lucide-react";
import { usePathname } from "next/navigation"; // Ensure you're using the correct hook

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-xl font-bold text-gray-900">
                  Xclusive Admin
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 ${
                    isActive("/") ? "border-b-2 border-primary" : ""
                  }`}
                >
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Link>
                <Link
                  href="/admin/guests"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 ${
                    isActive("/admin/guests") ? "border-b-2 border-primary" : ""
                  }`}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Guests
                </Link>
                <Link
                  href="/admin/clubs"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 ${
                    isActive("/admin/clubs") ? "border-b-2 border-primary" : ""
                  }`}
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Clubs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="py-10">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
