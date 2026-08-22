"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import {
  LayoutDashboard,
  Users,
  BookOpen,
  Video,
  ClipboardList,
  HelpCircle,
  Trophy,
  Swords,
  LogOut,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";

const links = [
  {
    href: "/admin",
    title: "لوحة التحكم",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/students",
    title: "الطلاب",
    icon: Users,
  },
  {
    href: "/admin/chapters",
    title: "الفصول",
    icon: BookOpen,
  },
  {
    href: "/admin/lectures",
    title: "المحاضرات",
    icon: Video,
  },
  {
    href: "/admin/exams",
    title: "الامتحانات",
    icon: ClipboardList,
  },
  {
    href: "/admin/challenges",
    title: "تحديات BioPulse",
    icon: Swords,
  },
  {
    href: "/admin/questions",
    title: "الأسئلة",
    icon: HelpCircle,
  },
  {
    href: "/admin/results",
    title: "النتائج",
    icon: Trophy,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    setMobileMenu(false);
  }, [pathname]);

  async function checkAdmin() {
    try {
      setChecking(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("admins")
        .select("id")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (error || !data) {
        alert("غير مصرح لك بالدخول");
        router.replace("/dashboard");
        return;
      }

      setAuthorized(true);
    } catch (error) {
      console.error("Admin check error:", error);
      router.replace("/login");
    } finally {
      setChecking(false);
    }
  }

  async function logout() {
    const confirmed = confirm("هل تريد تسجيل الخروج؟");

    if (!confirmed) return;

    await supabase.auth.signOut();

    router.replace("/login");
  }

  function isActive(href: string) {
    if (href === "/admin") {
      return pathname === "/admin";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  /* =========================
      Loading
  ========================= */

  if (checking) {
    return (
      <div
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#070b14]"
      >
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
          </div>

          <h2 className="text-lg font-black text-white">
            جاري التحقق من الصلاحيات
          </h2>

          <p className="mt-2 text-sm text-slate-500">لحظات...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#070b14] text-white">
      {/* =====================================================
          DESKTOP SIDEBAR
      ====================================================== */}

      <aside className="fixed right-0 top-0 z-40 hidden h-screen w-[270px] shrink-0 flex-col border-l border-white/5 bg-[#0a1220] text-white lg:flex">
        {/* Logo */}

        <div className="px-5 pb-6 pt-7">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_0_30px_rgba(37,99,235,0.25)]">
              <ShieldCheck className="h-6 w-6" />
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#0a1220] bg-emerald-400" />
            </div>

            <div>
              <h1 className="text-xl font-black tracking-tight">BioPulse</h1>
              <p className="mt-0.5 text-[11px] font-bold text-slate-500">
                ADMIN PANEL
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}

        <div className="mx-5 h-px bg-white/5" />

        {/* Navigation */}

        <nav className="flex-1 overflow-y-auto px-3 py-6">
          <p className="mb-3 px-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
            الرئيسية
          </p>

          <div className="space-y-1.5">
            {links.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl px-3 py-3 transition-all duration-200 ${
                    active
                      ? "bg-blue-600 text-white shadow-[0_8px_25px_rgba(37,99,235,0.2)]"
                      : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  {active && (
                    <span className="absolute right-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-l-full bg-white/80" />
                  )}

                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all ${
                      active
                        ? "bg-white/10"
                        : "bg-white/[0.035] group-hover:bg-blue-500/10 group-hover:text-blue-300"
                    }`}
                  >
                    <Icon className="h-[19px] w-[19px]" />
                  </span>

                  <span className="flex-1 text-sm font-extrabold">
                    {item.title}
                  </span>

                  {active && (
                    <span className="mr-auto text-lg font-black opacity-50">
                      ‹
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom */}

        <div className="p-3">
          <div className="mb-3 rounded-2xl border border-white/5 bg-white/[0.025] p-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <span className="absolute -bottom-0.5 -left-0.5 h-3 w-3 rounded-full border-2 border-[#0a1220] bg-emerald-400" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-black text-white">
                  Administrator
                </p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[11px] font-bold text-slate-500">
                    متصل الآن
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-right text-sm font-bold text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.035] transition group-hover:bg-red-500/10">
              <LogOut className="h-[18px] w-[18px]" />
            </span>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* =====================================================
          MOBILE HEADER
      ====================================================== */}

      <header className="fixed inset-x-0 top-0 z-30 h-16 border-b border-slate-800 bg-[#070b14]/95 shadow-sm backdrop-blur lg:hidden">
        <div className="flex h-full items-center justify-between px-4">
          <button
            onClick={() => setMobileMenu(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-slate-300 transition hover:bg-slate-800"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black">BioPulse</p>
              <p className="text-[10px] font-bold text-blue-400">Admin</p>
            </div>
          </div>

          <div className="h-10 w-10" />
        </div>
      </header>

      {/* =====================================================
          MOBILE OVERLAY + SIDEBAR
      ====================================================== */}

      {mobileMenu && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenu(false)}
          />

          <aside className="absolute right-0 top-0 flex h-full w-[85%] max-w-sm flex-col bg-[#0a1220] text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-black">BioPulse</h2>
                  <p className="text-xs font-bold text-blue-400">لوحة الإدارة</p>
                </div>
              </div>

              <button
                onClick={() => setMobileMenu(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] text-slate-400 transition hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-6">
              <p className="mb-3 px-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
                الرئيسية
              </p>

              <div className="space-y-1.5">
                {links.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold transition ${
                        active
                          ? "bg-blue-600 text-white"
                          : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          active ? "bg-white/10" : "bg-white/[0.035]"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span>{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>

            <div className="border-t border-white/5 p-4">
              <button
                onClick={logout}
                className="group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.035] group-hover:bg-red-500/10">
                  <LogOut className="h-[18px] w-[18px]" />
                </span>
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <div className="min-h-screen lg:mr-[270px]">
        <main className="min-h-screen bg-[#070b14] pt-16 lg:pt-0">
          <div className="min-h-screen w-full p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}