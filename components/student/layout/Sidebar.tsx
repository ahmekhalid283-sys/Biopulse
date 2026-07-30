"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Trophy,
  User,
  Settings,
  LogOut,
  Flame,
  Star,
  Dna,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type SidebarProps = {
  studentName: string;
  points: number;
  streak: number;
};

export default function Sidebar({
  studentName,
  points,
  streak,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    {
      href: "/dashboard",
      label: "لوحة التحكم",
      icon: LayoutDashboard,
    },
    {
      href: "/chapters",
      label: "الفصول",
      icon: BookOpen,
    },
    {
      href: "/results",
      label: "النتائج",
      icon: Trophy,
    },
    {
      href: "/profile",
      label: "الملف الشخصي",
      icon: User,
    },
    {
      href: "/settings",
      label: "الإعدادات",
      icon: Settings,
    },
  ];

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/auth");
  };

  return (
    <aside
      className="
      hidden lg:flex
      fixed right-0 top-0
      h-screen w-[280px]
      flex-col
      border-l border-cyan-500/20
      bg-[#07131f]/90
      backdrop-blur-xl
      shadow-[0_0_40px_rgba(0,255,255,.06)]
      p-6
    "
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10">
          <Dna className="h-8 w-8 text-cyan-400" />
        </div>

        <div>
          <h1 className="text-3xl font-bold text-cyan-400">
            BioPulse
          </h1>

          <p className="text-xs text-slate-400">
            Biology Platform
          </p>
        </div>
      </div>

      {/* Student */}
      <div className="mt-8 rounded-2xl border border-cyan-500/20 bg-slate-900/60 p-5">

        <h2
          className="font-bold text-lg text-white truncate"
          title={studentName}
        >
          {studentName}
        </h2>

        <p className="text-xs text-slate-400 mt-1">
          Biology Student
        </p>

        <div className="mt-5 flex items-center justify-between">

          <div className="flex items-center gap-2 text-yellow-400">
            <Star size={18} />
            <span className="font-bold">Points</span>
          </div>

          <span className="font-bold text-white">
            {points}
          </span>

        </div>

        <div className="mt-4 flex items-center justify-between">

          <div className="flex items-center gap-2 text-orange-400">
            <Flame size={18} />
            <span className="font-bold">Streak</span>
          </div>

          <span className="font-bold text-white">
            {streak}
          </span>

        </div>

      </div>

      {/* Navigation */}
      <nav className="mt-8 flex-1 space-y-3">
        {links.map((link) => {
          const Icon = link.icon;

          const active = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`group flex items-center gap-4 rounded-xl px-5 py-4 transition-all duration-300 ${
                active
                  ? "border border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-lg"
                  : "text-slate-300 hover:bg-slate-800 hover:translate-x-1"
              }`}
            >
              <Icon size={21} />
              <span className="font-medium">
                {link.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <button
        onClick={logout}
        className="mt-6 flex items-center justify-center gap-3 rounded-xl bg-red-500 py-4 font-bold text-white transition hover:bg-red-600"
      >
        <LogOut size={20} />
        تسجيل الخروج
      </button>
    </aside>
  );
}