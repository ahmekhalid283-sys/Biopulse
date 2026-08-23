"use client";

import { useEffect, useState } from "react";
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
  Menu,
  X,
  MessageCircle,
  Swords,
  Lock,
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

  const [mobileOpen, setMobileOpen] = useState(false);
  const [challengesEnabled, setChallengesEnabled] = useState(true);

  useEffect(() => {
    async function loadChallengesStatus() {
      const { data } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "challenges_enabled")
        .maybeSingle();
      if (data) {
        setChallengesEnabled(data.value === true || data.value === "true");
      }
    }
    loadChallengesStatus();
  }, []);

  const links = [
    { href: "/dashboard", label: "الصفحة الرئيسية", icon: LayoutDashboard },
    { href: "/chapters", label: "الفصول", icon: BookOpen },
    { href: "/challenges", label: "تحديات BioPulse", icon: Swords, locked: !challengesEnabled },
    { href: "/results", label: "النتائج", icon: Trophy },
    { href: "/profile", label: "الملف الشخصي", icon: User },
    { href: "/support", label: "الدعم العلمي", icon: MessageCircle },
    { href: "/settings", label: "الإعدادات", icon: Settings },
  ];

  // قفل القائمة عند تغيير الصفحة
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // منع Scroll في الصفحة عندما تكون القائمة مفتوحة على الموبايل
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/auth");
  };

  return (
    <>
      {/* =====================================================
          Mobile Menu Button
      ===================================================== */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="فتح القائمة"
        className="
          fixed
          right-4
          top-4
          z-[60]
          flex
          h-12
          w-12
          items-center
          justify-center
          rounded-2xl
          border
          border-cyan-500/20
          bg-[#081321]/95
          text-cyan-400
          shadow-xl
          shadow-black/30
          backdrop-blur-xl
          transition
          hover:bg-cyan-500/10
          lg:hidden
        "
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* =====================================================
          Mobile Overlay
      ===================================================== */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="إغلاق القائمة"
          onClick={() => setMobileOpen(false)}
          className="
            fixed
            inset-0
            z-[65]
            bg-black/60
            backdrop-blur-sm
            lg:hidden
          "
        />
      )}

      {/* =====================================================
          Sidebar
      ===================================================== */}
      <aside
        className={`
          fixed
          top-0
          right-0
          z-[70]
          flex
          h-screen
          w-[min(18rem,85vw)]
          flex-col
          overflow-y-auto
          border-l
          border-cyan-500/20
          bg-[#081321]/98
          p-5
          shadow-2xl
          shadow-black/40
          backdrop-blur-xl
          transition-transform
          duration-300
          lg:w-72
          lg:translate-x-0
          lg:p-6
          ${
            mobileOpen
              ? "translate-x-0"
              : "translate-x-full"
          }
        `}
      >
        {/* =====================================================
            Mobile Close Button
        ===================================================== */}
        <div className="mb-2 flex items-center justify-end lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="إغلاق القائمة"
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              border
              border-slate-700
              bg-slate-900
              text-slate-300
              transition
              hover:border-cyan-500/30
              hover:text-cyan-400
            "
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* =====================================================
            Logo
        ===================================================== */}
        <div className="flex items-center gap-3">
          <div
            className="
              flex
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-cyan-500/10
              p-3
            "
          >
            <Dna
              className="text-cyan-400"
              size={28}
            />
          </div>

          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-cyan-400">
              BioPulse
            </h1>

            <p className="text-xs text-slate-400">
              Biology Platform
            </p>
          </div>
        </div>

        {/* =====================================================
            Student
        ===================================================== */}
        <div
          className="
            mt-6
            rounded-2xl
            border
            border-cyan-500/20
            bg-slate-900/60
            p-4
            text-center
          "
        >
          <img
            src={
              avatarUrl ||
              "/images/default-avatar.png"
            }
            className="
              mx-auto
              mb-3
              h-20
              w-20
              rounded-full
              border-4
              border-cyan-400
              object-cover
            "
            alt="صورة الطالب"
          />

          <h2
            className="
              truncate
              text-base
              font-bold
              text-white
            "
            title={studentName}
          >
            {studentName}
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Biology Student
          </p>
        </div>

        {/* =====================================================
            Navigation
        ===================================================== */}
        <nav className="mt-6 flex-1 space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            const isLocked = (link as any).locked;

            if (isLocked) {
              return (
                <div
                  key={link.href}
                  className="flex w-full cursor-not-allowed items-center gap-3 rounded-xl px-4 py-3.5 text-slate-500 opacity-70"
                  title="التحديات مقفلة حاليًا"
                >
                  <Icon size={20} className="shrink-0" />
                  <span className="truncate font-medium">{link.label}</span>
                  <Lock size={16} className="mr-auto" />
                </div>
              );
            }

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3.5 transition-all duration-300 ${
                  active
                    ? "border border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-lg shadow-cyan-950/20"
                    : "text-slate-300 hover:bg-slate-800 hover:text-cyan-300"
                }`}
              >
                <Icon size={20} className="shrink-0" />
                <span className="truncate font-medium">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* =====================================================
            Logout
        ===================================================== */}
        <button
          type="button"
          onClick={logout}
          className="
            mt-5
            flex
            w-full
            items-center
            justify-center
            gap-3
            rounded-xl
            bg-red-500
            px-4
            py-3.5
            font-bold
            text-white
            transition
            hover:bg-red-600
          "
        >
          <LogOut
            size={20}
            className="shrink-0"
          />

          <span>تسجيل الخروج</span>
        </button>
      </aside>
    </>
  );
}