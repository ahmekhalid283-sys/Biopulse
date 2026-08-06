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
  Dna,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type SidebarProps = {
  studentName: string;
  avatarUrl?: string;
};

export default function Sidebar({
  studentName,
  avatarUrl,
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
    <aside className="fixed top-0 right-0 h-screen w-72 bg-[#081321]/95 backdrop-blur-xl border-l border-cyan-500/20 p-6 flex flex-col z-50 overflow-y-auto">

      {/* Logo */}
      <div className="flex items-center gap-4">
        <div className="rounded-xl bg-cyan-500/10 p-3">
          <Dna className="text-cyan-400" size={30} />
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
      <div className="mt-8 rounded-2xl border border-cyan-500/20 bg-slate-900/60 p-5 text-center">

        <img
          src={avatarUrl || "/images/default-avatar.png"}
          className="mx-auto mb-4 h-24 w-24 rounded-full border-4 border-cyan-400 object-cover"
          alt=""
        />

        <h2
          className="truncate text-lg font-bold text-white"
          title={studentName}
        >
          {studentName}
        </h2>

        <p className="mt-1 text-xs text-slate-400">
          Biology Student
        </p>

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
                  : "text-slate-300 hover:bg-slate-800 hover:-translate-x-1"
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