"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bell, CheckCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: student } = await supabase
        .from("students")
        .select("id")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (!student) return;

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("student_id", student.id)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(error);
        return;
      }

      setNotifications(data || []);
    } finally {
      setLoading(false);
    }
  }

  async function markAllAsRead() {
    const unread = notifications.filter(
      (item) => !item.is_read
    );

    if (!unread.length) return;

    const ids = unread.map((item) => item.id);

    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
      })
      .in("id", ids);

    if (error) {
      console.error(error);
      return;
    }

    setNotifications((prev) =>
      prev.map((item) => ({
        ...item,
        is_read: true,
      }))
    );
  }

  async function markAsRead(id: string) {
    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
      })
      .eq("id", id);

    if (error) {
      console.error(error);
      return;
    }

    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, is_read: true }
          : item
      )
    );
  }

  function getIcon(type: string) {
    switch (type) {
      case "lecture":
        return "📚";

      case "exam":
        return "📝";

      case "result":
        return "🏆";

      case "announcement":
        return "📢";

      default:
        return "🔔";
    }
  }

  return (
    <main
      dir="rtl"
      className="
        min-h-screen
        bg-[#020617]
        px-4
        py-8
        text-white
        sm:px-6
        lg:px-10
      "
    >
      <div className="mx-auto max-w-4xl">
        {/* Header */}

        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="
              flex
              items-center
              gap-2
              rounded-xl
              border
              border-cyan-500/20
              bg-cyan-500/10
              px-4
              py-2
              font-bold
              text-cyan-400
              hover:bg-cyan-500/20
            "
          >
            <ArrowRight className="h-5 w-5" />
            الرئيسية
          </Link>

          <div className="flex items-center gap-3">
            <Bell className="h-7 w-7 text-cyan-400" />

            <h1 className="text-3xl font-black text-cyan-400">
              الإشعارات
            </h1>
          </div>
        </div>

        {/* Main card */}

        <div
          className="
            overflow-hidden
            rounded-3xl
            border
            border-cyan-500/20
            bg-[#081321]/95
          "
        >
          {/* Top */}

          <div
            className="
              flex
              items-center
              justify-between
              border-b
              border-slate-800
              p-6
            "
          >
            <div>
              <h2 className="text-xl font-black">
                جميع الإشعارات
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                آخر الأخبار والتنبيهات الخاصة بك
              </p>
            </div>

            <button
              onClick={markAllAsRead}
              className="
                flex
                items-center
                gap-2
                rounded-xl
                border
                border-cyan-500/20
                bg-cyan-500/10
                px-4
                py-2
                text-sm
                font-bold
                text-cyan-400
                hover:bg-cyan-500/20
              "
            >
              <CheckCheck className="h-4 w-4" />
              قراءة الكل
            </button>
          </div>

          {/* List */}

          {loading ? (
            <div className="p-12 text-center text-slate-500">
              جاري تحميل الإشعارات...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mb-4 text-5xl">
                🔔
              </div>

              <p className="text-lg font-bold text-slate-300">
                لا توجد إشعارات
              </p>

              <p className="mt-2 text-sm text-slate-600">
                عندما يرسل الأدمن إشعارًا ستجده هنا.
              </p>
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`
                    border-b
                    border-slate-800
                    p-6
                    ${
                      !notification.is_read
                        ? "bg-cyan-500/[0.04]"
                        : ""
                    }
                  `}
                >
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-2xl">
                      {getIcon(notification.type)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="text-lg font-black">
                          {notification.title}
                        </h3>

                        {!notification.is_read && (
                          <span className="rounded-full bg-cyan-400 px-2 py-1 text-[9px] font-black text-slate-950">
                            جديد
                          </span>
                        )}
                      </div>

                      <p className="mt-2 leading-7 text-slate-400">
                        {notification.message}
                      </p>

                      <p className="mt-3 text-xs text-slate-600">
                        {new Date(
                          notification.created_at
                        ).toLocaleString("ar-EG")}
                      </p>

                      <div className="mt-4 flex gap-3">
                        {!notification.is_read && (
                          <button
                            onClick={() =>
                              markAsRead(
                                notification.id
                              )
                            }
                            className="
                              rounded-xl
                              border
                              border-cyan-500/20
                              bg-cyan-500/10
                              px-4
                              py-2
                              text-sm
                              font-bold
                              text-cyan-400
                            "
                          >
                            تعليم كمقروء
                          </button>
                        )}

                        {notification.link && (
                          <Link
                            href={notification.link}
                            onClick={() =>
                              markAsRead(
                                notification.id
                              )
                            }
                            className="
                              rounded-xl
                              bg-cyan-500
                              px-4
                              py-2
                              text-sm
                              font-bold
                              text-slate-950
                            "
                          >
                            فتح
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}