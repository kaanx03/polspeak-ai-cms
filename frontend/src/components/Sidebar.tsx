"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { fetchTeacherUnreadTotal, getCurrentUser, logout } from "@/lib/api";

interface SidebarProps {
  hideHamburger?: boolean;
  hideProfileMenu?: boolean;
}

/** How often the unread-message badge is refreshed (until real-time delivery is added). */
const UNREAD_POLL_INTERVAL_MS = 60_000;

function initialsOf(name: string): string {
  const initials = name
    .split(/s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return initials || "T";
}

export default function Sidebar({ hideHamburger = false, hideProfileMenu = false }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState({ name: "Teacher", email: "" });
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await logout();
    router.push("/login");
  };

  useEffect(() => {
    const loadProfile = () =>
      getCurrentUser().then((user) => {
        if (user) setProfile({ name: user.displayName || "Teacher", email: user.email });
      });
    loadProfile();

    const refreshUnread = () => fetchTeacherUnreadTotal().then(setUnreadMessages);
    refreshUnread();
    const timer = window.setInterval(refreshUnread, UNREAD_POLL_INTERVAL_MS);

    // The settings page dispatches this event after the profile was updated
    window.addEventListener("settings-updated", loadProfile);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("settings-updated", loadProfile);
    };
  }, []);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileMenu]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // Only hide in actual presentation mode (/lessons/.../present), not in /presentation list page
  const isPresentationMode = pathname?.includes("/present") && !pathname?.endsWith("/presentation");

  return (
    <>
      {/* Profile Menu Button - Tablet & Mobile (not in presentation mode) */}
      {!isPresentationMode && !hideHamburger && !hideProfileMenu && (
        <div className="xl:hidden fixed top-4 right-4 z-50" ref={profileMenuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="size-10 rounded-full border-2 border-indigo-500 overflow-hidden shadow-lg hover:scale-105 transition-transform bg-white"
            aria-label="Profile menu"
          >
            <span className="w-full h-full flex items-center justify-center text-sm font-bold text-indigo-600">
              {initialsOf(profile.name)}
            </span>
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute top-12 right-0 w-48 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden">
              <div className="p-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900 truncate">{profile.name}</p>
                <p className="text-xs text-slate-500 truncate">{profile.email || "Teacher"}</p>
              </div>
              <Link
                href="/settings"
                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-slate-700"
                onClick={() => setShowProfileMenu(false)}
              >
                <span className="material-symbols-outlined text-[20px]">settings</span>
                <span className="text-sm font-medium">Settings</span>
              </Link>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  handleSignOut();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-red-600"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Desktop Sidebar (xl and above - 1280px+) */}
      <aside
        className={`
          fixed xl:relative
          w-64
          flex-shrink-0 flex-col justify-between
          bg-[#00132c] h-full
          transition-all duration-300
          border-r border-[#0f2545]/50
          z-40
          hidden xl:flex
        `}
      >
        <div className="flex flex-col gap-6 p-4">
          <div className="flex items-center gap-3 px-2">
            <Image src="/logo.svg" alt="PolSpeak" width={40} height={40} className="size-10 rounded-xl shadow-lg" priority />
            <div className="flex flex-col">
              <h1 className="text-white text-lg font-bold leading-tight tracking-tight">
                PolSpeak
              </h1>
              <p className="text-slate-400 text-xs font-normal">Lesson Content Studio</p>
            </div>
          </div>
          <nav className="flex flex-col gap-1 mt-4">
            <Link
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                pathname === "/dashboard"
                  ? "bg-white/10 text-white shadow-sm ring-1 ring-white/5"
                  : "text-slate-400 hover:bg-white/5 hover:text-white group"
              }`}
              href="/dashboard"
            >
              <span
                className={`material-symbols-outlined ${
                  pathname === "/dashboard" ? "text-indigo-400" : "group-hover:text-white"
                }`}
                style={pathname === "/dashboard" ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                dashboard
              </span>
              <span className={`text-sm ${pathname === "/dashboard" ? "font-bold" : "font-medium"}`}>Dashboard</span>
            </Link>
            <Link
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                pathname === "/library"
                  ? "bg-white/10 text-white shadow-sm ring-1 ring-white/5"
                  : "text-slate-400 hover:bg-white/5 hover:text-white group"
              }`}
              href="/library"
            >
              <span
                className={`material-symbols-outlined ${
                  pathname === "/library" ? "text-indigo-400" : "group-hover:text-white"
                }`}
                style={pathname === "/library" ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                library_books
              </span>
              <span className={`text-sm ${pathname === "/library" ? "font-bold" : "font-medium"}`}>Library</span>
            </Link>
            <Link
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                pathname === "/students"
                  ? "bg-white/10 text-white shadow-sm ring-1 ring-white/5"
                  : "text-slate-400 hover:bg-white/5 hover:text-white group"
              }`}
              href="/students"
            >
              <span
                className={`material-symbols-outlined ${
                  pathname === "/students" ? "text-indigo-400" : "group-hover:text-white"
                }`}
                style={pathname === "/students" ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                groups
              </span>
              <span className={`text-sm ${pathname === "/students" ? "font-bold" : "font-medium"}`}>Students</span>
            </Link>
            <Link
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                pathname.startsWith("/lessons")
                  ? "bg-white/10 text-white shadow-sm ring-1 ring-white/5"
                  : "text-slate-400 hover:bg-white/5 hover:text-white group"
              }`}
              href="/lessons"
            >
              <span
                className={`material-symbols-outlined transition-colors ${
                  pathname.startsWith("/lessons") ? "text-indigo-400" : "group-hover:text-white"
                }`}
                style={pathname.startsWith("/lessons") ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                book_2
              </span>
              <span className={`text-sm ${pathname.startsWith("/lessons") ? "font-bold" : "font-medium"}`}>Lessons</span>
            </Link>
            <Link
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                pathname === "/schedule"
                  ? "bg-white/10 text-white shadow-sm ring-1 ring-white/5"
                  : "text-slate-400 hover:bg-white/5 hover:text-white group"
              }`}
              href="/schedule"
            >
              <span
                className={`material-symbols-outlined ${
                  pathname === "/schedule" ? "text-indigo-400" : "group-hover:text-white transition-colors"
                }`}
                style={pathname === "/schedule" ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                calendar_month
              </span>
              <span className={`text-sm ${pathname === "/schedule" ? "font-bold" : "font-medium"}`}>Schedule</span>
            </Link>
            <Link
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                pathname === "/curriculum"
                  ? "bg-white/10 text-white shadow-sm ring-1 ring-white/5"
                  : "text-slate-400 hover:bg-white/5 hover:text-white group"
              }`}
              href="/curriculum"
            >
              <span
                className={`material-symbols-outlined ${
                  pathname === "/curriculum" ? "text-indigo-400" : "group-hover:text-white transition-colors"
                }`}
                style={pathname === "/curriculum" ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                menu_book
              </span>
              <span className={`text-sm ${pathname === "/curriculum" ? "font-bold" : "font-medium"}`}>Curriculum</span>
            </Link>
            <Link
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                pathname === "/teacher/homework"
                  ? "bg-white/10 text-white shadow-sm ring-1 ring-white/5"
                  : "text-slate-400 hover:bg-white/5 hover:text-white group"
              }`}
              href="/teacher/homework"
            >
              <span
                className={`material-symbols-outlined ${
                  pathname === "/teacher/homework" ? "text-indigo-400" : "group-hover:text-white transition-colors"
                }`}
                style={pathname === "/teacher/homework" ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                assignment
              </span>
              <span className={`text-sm ${pathname === "/teacher/homework" ? "font-bold" : "font-medium"}`}>Homework</span>
            </Link>
            <Link
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                pathname === "/messages"
                  ? "bg-white/10 text-white shadow-sm ring-1 ring-white/5"
                  : "text-slate-400 hover:bg-white/5 hover:text-white group"
              }`}
              href="/messages"
            >
              <span className="relative">
                <span
                  className={`material-symbols-outlined ${
                    pathname === "/messages" ? "text-indigo-400" : "group-hover:text-white transition-colors"
                  }`}
                  style={pathname === "/messages" ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  chat_bubble
                </span>
                {unreadMessages > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                    {unreadMessages > 99 ? "99+" : unreadMessages}
                  </span>
                )}
              </span>
              <span className={`text-sm ${pathname === "/messages" ? "font-bold" : "font-medium"}`}>Messages</span>
            </Link>
          </nav>
        </div>
        <div className="p-4 border-t border-white/5 flex flex-col gap-2">
          <Link
            className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors group ${
              pathname === "/settings"
                ? "bg-white/10 text-white shadow-sm ring-1 ring-white/5"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
            href="/settings"
          >
            <span
              className={`material-symbols-outlined ${
                pathname === "/settings" ? "text-indigo-400" : "group-hover:text-white transition-colors"
              }`}
              style={pathname === "/settings" ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              settings
            </span>
            <span className={`text-sm ${pathname === "/settings" ? "font-bold" : "font-medium"}`}>Settings</span>
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-slate-400 hover:bg-red-500/10 hover:text-red-400 group"
          >
            <span className="material-symbols-outlined group-hover:text-red-400 transition-colors">
              logout
            </span>
            <span className="text-sm font-medium">Logout</span>
          </button>
          <div className="flex items-center gap-3 px-3 py-3 mt-2">
            <span className="size-8 rounded-full border border-white/10 bg-indigo-500/30 text-white text-xs font-bold flex items-center justify-center">
              {initialsOf(profile.name)}
            </span>
            <div className="flex flex-col">
              <p className="text-white text-xs font-semibold">{profile.name}</p>
              <p className="text-slate-400 text-[10px]">Teacher</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Bottom Navigation - Mobile & Tablet (hide on desktop, hide in presentation mode) */}
      {!isPresentationMode && (
        <nav className="flex xl:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#00132c] border-t border-[#0f2545]/50">
          <div className="w-full flex items-center justify-around px-1 md:px-2 py-2 max-w-7xl mx-auto">
            {/* Dashboard */}
            <Link
              href="/dashboard"
              className={`flex flex-col items-center justify-center gap-1 px-1 md:px-3 py-2 rounded-lg transition-all min-w-[45px] md:min-w-[60px] ${
                pathname === "/dashboard"
                  ? "bg-indigo-500/20 text-indigo-300"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span
                className="material-symbols-outlined text-[24px]"
                style={pathname === "/dashboard" ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                dashboard
              </span>
              <span className="text-[10px] font-medium hidden md:block">Dashboard</span>
            </Link>

            {/* Library */}
            <Link
              href="/library"
              className={`flex flex-col items-center justify-center gap-1 px-1 md:px-3 py-2 rounded-lg transition-all min-w-[45px] md:min-w-[60px] ${
                pathname === "/library"
                  ? "bg-indigo-500/20 text-indigo-300"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span
                className="material-symbols-outlined text-[24px]"
                style={pathname === "/library" ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                library_books
              </span>
              <span className="text-[10px] font-medium hidden md:block">Library</span>
            </Link>

            {/* Students */}
            <Link
              href="/students"
              className={`flex flex-col items-center justify-center gap-1 px-1 md:px-3 py-2 rounded-lg transition-all min-w-[45px] md:min-w-[60px] ${
                pathname === "/students"
                  ? "bg-indigo-500/20 text-indigo-300"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span
                className="material-symbols-outlined text-[24px]"
                style={pathname === "/students" ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                groups
              </span>
              <span className="text-[10px] font-medium hidden md:block">Students</span>
            </Link>

            {/* Lessons */}
            <Link
              href="/lessons"
              className={`flex flex-col items-center justify-center gap-1 px-1 md:px-3 py-2 rounded-lg transition-all min-w-[45px] md:min-w-[60px] ${
                pathname.startsWith("/lessons")
                  ? "bg-indigo-500/20 text-indigo-300"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span
                className="material-symbols-outlined text-[24px]"
                style={pathname.startsWith("/lessons") ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                book_2
              </span>
              <span className="text-[10px] font-medium hidden md:block">Lessons</span>
            </Link>

            {/* Schedule */}
            <Link
              href="/schedule"
              className={`flex flex-col items-center justify-center gap-1 px-1 md:px-3 py-2 rounded-lg transition-all min-w-[45px] md:min-w-[60px] ${
                pathname === "/schedule"
                  ? "bg-indigo-500/20 text-indigo-300"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span
                className="material-symbols-outlined text-[24px]"
                style={pathname === "/schedule" ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                calendar_month
              </span>
              <span className="text-[10px] font-medium hidden md:block">Schedule</span>
            </Link>

            {/* Curriculum */}
            <Link
              href="/curriculum"
              className={`flex flex-col items-center justify-center gap-1 px-1 md:px-3 py-2 rounded-lg transition-all min-w-[45px] md:min-w-[60px] ${
                pathname === "/curriculum"
                  ? "bg-indigo-500/20 text-indigo-300"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span
                className="material-symbols-outlined text-[24px]"
                style={pathname === "/curriculum" ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                menu_book
              </span>
              <span className="text-[10px] font-medium hidden md:block">Curriculum</span>
            </Link>

            {/* Homework */}
            <Link
              href="/teacher/homework"
              className={`flex flex-col items-center justify-center gap-1 px-1 md:px-3 py-2 rounded-lg transition-all min-w-[45px] md:min-w-[60px] ${
                pathname === "/teacher/homework"
                  ? "bg-indigo-500/20 text-indigo-300"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span
                className="material-symbols-outlined text-[24px]"
                style={pathname === "/teacher/homework" ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                assignment
              </span>
              <span className="text-[10px] font-medium hidden md:block">Homework</span>
            </Link>

            {/* Messages */}
            <Link
              href="/messages"
              className={`flex flex-col items-center justify-center gap-1 px-1 md:px-3 py-2 rounded-lg transition-all min-w-[45px] md:min-w-[60px] ${
                pathname === "/messages"
                  ? "bg-indigo-500/20 text-indigo-300"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span className="relative">
                <span
                  className="material-symbols-outlined text-[24px]"
                  style={pathname === "/messages" ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  chat_bubble
                </span>
                {unreadMessages > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                    {unreadMessages > 99 ? "99+" : unreadMessages}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-medium hidden md:block">Messages</span>
            </Link>

          </div>
        </nav>
      )}
    </>
  );
}
