"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Trophy,
  LogOut,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Sidebar() {
  const pathname = usePathname();

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
  ];

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <aside className="w-72 bg-slate-950 border-r border-slate-800 min-h-screen p-6 hidden lg:flex flex-col">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-cyan-400">
          BioPulse
        </h1>

        <p className="text-slate-400 text-sm mt-1">
          Biology Learning Platform
        </p>
      </div>

      <nav className="flex-1 space-y-3">
        {links.map((link) => {
          const Icon = link.icon;

          const active = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                active
                  ? "bg-cyan-500 text-white"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <Icon size={20} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="mt-8 flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 transition text-white py-3"
      >
        <LogOut size={18} />
        تسجيل الخروج
      </button>
    </aside>
  );
}