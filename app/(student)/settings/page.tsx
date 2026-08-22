"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  User,
  Lock,
  Bell,
  BarChart3,
  LogOut,
  Settings,
  House,
} from "lucide-react";

type SettingCard = {
  title: string;
  description: string;
  icon: string | React.ReactNode;
  iconBg: string;
  borderColor: string;
  buttonText: string;
  buttonColor: string;
  href?: string;
  action?: () => void;
};

export default function SettingsPage() {
  const router = useRouter();

  const [notifications, setNotifications] = useState(true);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    loadNotificationSetting();
  }, []);

  async function loadNotificationSetting() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("students")
        .select("notifications_enabled")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (error) {
        console.error(
          "Notification setting error:",
          error
        );
        return;
      }

      if (data) {
        setNotifications(
          data.notifications_enabled ?? true
        );
      }
    } finally {
      setLoadingNotifications(false);
    }
  }

  async function toggleNotifications() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("يجب تسجيل الدخول أولاً");
        return;
      }

      const newValue = !notifications;

      const { error } = await supabase
        .from("students")
        .update({
          notifications_enabled: newValue,
        })
        .eq("auth_id", user.id);

      if (error) {
        console.error(error);
        alert(error.message);
        return;
      }

      setNotifications(newValue);
    } catch (error) {
      console.error(
        "Toggle notifications error:",
        error
      );
    }
  }

  const logout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(error.message);
      setLoggingOut(false);
      return;
    }

    router.replace("/login");
  };

  const cards: SettingCard[] = [
    {
      title: "الملف الشخصي",
      description: "عرض معلوماتك الشخصية ونتائج الامتحانات ومستواك الدراسي",
      icon: "👤",
      iconBg: "bg-cyan-500/10",
      borderColor: "border-cyan-500/20",
      buttonText: "عرض الملف الشخصي",
      buttonColor:
        "border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20",
      href: "/profile",
    },
    {
      title: "إعدادات الحساب",
      description: "تغيير الاسم والصورة الشخصية وكلمة السر وبيانات الحساب",
      icon: "⚙️",
      iconBg: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
      buttonText: "إدارة الحساب",
      buttonColor:
        "border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20",
      href: "/settings/account",
    },
    {
      title: "تغيير كلمة المرور",
      description: "قم بتغيير كلمة مرور حسابك بشكل دوري للحفاظ على أمان حسابك.",
      icon: <Lock className="h-6 w-6 text-yellow-400" />,
      iconBg: "bg-yellow-500/10",
      borderColor: "border-yellow-500/20",
      buttonText: "إدارة كلمة المرور",
      buttonColor:
        "border-yellow-500/30 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20",
      href: "/reset-password",
    },
    {
      title: "الإشعارات",
      description:
        "التحكم في استقبال إشعارات المحاضرات والامتحانات والرسائل المرسلة من الإدارة.",
      icon: (
        <Bell className="h-6 w-6 text-cyan-400" />
      ),
      iconBg: "bg-cyan-500/10",
      borderColor: "border-cyan-500/20",
      buttonText: loadingNotifications
        ? "جاري تحميل الحالة..."
        : notifications
        ? "🔔 الإشعارات مفعّلة"
        : "🔕 الإشعارات متوقفة",
      buttonColor: notifications
        ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
        : "border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700",
      action: toggleNotifications,
    },
    {
      title: "تقرير الأداء",
      description: "عرض إحصائياتك، متوسط درجاتك، تقدمك ومقارنة مستواك بمرور الوقت.",
      icon: <BarChart3 className="h-6 w-6 text-violet-400" />,
      iconBg: "bg-violet-500/10",
      borderColor: "border-violet-500/20",
      buttonText: "عرض التقرير",
      buttonColor:
        "border-violet-500/30 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20",
      href: "/results",
    },
  ];

  const handleCardClick = (item: SettingCard) => {
    if (item.action) {
      item.action();
      return;
    }

    if (item.href) {
      router.push(item.href);
    }
  };

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#020617] px-4 py-8 text-white sm:px-6 lg:px-10"
    >
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute right-1/4 top-0 h-[400px] w-[400px] rounded-full bg-cyan-500/[0.06] blur-[120px]" />
        <div className="absolute bottom-0 left-10 h-[400px] w-[400px] rounded-full bg-indigo-500/[0.06] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-4xl">

        {/* Main Card Container */}
        <div className="overflow-hidden rounded-[2rem] border border-cyan-500/20 bg-[#081321]/95 shadow-2xl shadow-cyan-950/20 backdrop-blur-2xl">

          {/* Header */}
          <div className="border-b border-cyan-500/10 px-6 py-8 text-center sm:px-10">

            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
              <Settings className="h-8 w-8" />
            </div>

            <h1 className="text-4xl font-black tracking-tight text-cyan-400 sm:text-5xl">
              الإعدادات
            </h1>

            <p className="mt-3 text-sm text-slate-400 sm:text-base">
              إدارة حسابك وتخصيص تجربتك داخل منصة BioPulse
            </p>

            {/* Home Button */}
            <button
              onClick={() => router.push("/dashboard")}
              className="group mx-auto mt-6 flex items-center justify-center gap-2 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-6 py-3 text-sm font-bold text-cyan-400 transition-all duration-300 hover:bg-cyan-500 hover:text-slate-950"
            >
              <House className="h-5 w-5" />
              <span>العودة للصفحة الرئيسية</span>
            </button>

          </div>

          {/* Settings Cards List */}
          <div className="space-y-4 p-5 sm:p-8">

            {cards.map((item) => (
              <div
                key={item.title}
                className={`rounded-3xl border ${item.borderColor} bg-slate-900/70 p-6 transition-all duration-300 hover:bg-slate-900`}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${item.iconBg} text-2xl`}>
                    {item.icon}
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {item.title}
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                      {item.description}
                    </p>
                  </div>
                </div>

                {item.href ? (
                  <Link
                    href={item.href}
                    className={`mt-5 block rounded-xl border px-5 py-3 text-center font-bold transition ${item.buttonColor}`}
                  >
                    {item.buttonText}
                  </Link>
                ) : (
                  <button
                    onClick={item.action}
                    className={`mt-5 w-full rounded-xl border px-5 py-3 text-center font-bold transition ${item.buttonColor}`}
                  >
                    {item.buttonText}
                  </button>
                )}
              </div>
            ))}

          </div>

          {/* Divider */}
          <div className="mx-5 h-px bg-slate-800 sm:mx-8" />

          {/* Logout Section */}
          <div className="px-5 pb-5 pt-6 sm:px-8 sm:pb-8">

            <button
              onClick={logout}
              disabled={loggingOut}
              className="group flex w-full items-center justify-center gap-3 rounded-2xl border border-red-500/30 bg-red-600 py-5 font-black text-white shadow-lg shadow-red-950/30 transition-all duration-300 hover:bg-red-700 hover:shadow-red-900/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LogOut className="h-5 w-5 transition group-hover:-translate-x-1" />
              {loggingOut ? "جاري تسجيل الخروج..." : "تسجيل الخروج"}
            </button>

            <p className="mt-3 text-center text-[11px] text-slate-600">
              سيتم إنهاء جلسة تسجيل الدخول الحالية على هذا الجهاز.
            </p>

          </div>

        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-600">
          BioPulse Learning Platform © 2027
        </p>

      </div>
    </main>
  );
}