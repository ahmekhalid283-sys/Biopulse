"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, BellOff, CheckCheck } from "lucide-react";
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

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const wrapperRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let isMounted = true;

    async function initialize() {
      try {
        setLoading(true);

        // =========================
        // المستخدم الحالي
        // =========================
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user || !isMounted) {
          setLoading(false);
          return;
        }

        // =========================
        // بيانات الطالب
        // =========================
        const { data: student, error: studentError } = await supabase
          .from("students")
          .select("id, notifications_enabled")
          .eq("auth_id", user.id)
          .maybeSingle();

        if (studentError || !student || !isMounted) {
          if (studentError) {
            console.error("Student notification setting error:", studentError);
          }
          setLoading(false);
          return;
        }

        const enabled = student.notifications_enabled ?? true;
        setNotificationsEnabled(enabled);

        // =========================
        // لو الإشعارات مقفولة
        // =========================
        if (!enabled) {
          setNotifications([]);
          setLoading(false);
          return;
        }

        // =========================
        // تحميل الإشعارات
        // =========================
        const { data, error } = await supabase
          .from("notifications")
          .select("id, title, message, type, link, is_read, created_at")
          .eq("student_id", student.id)
          .order("created_at", {
            ascending: false,
          })
          .limit(20);

        if (error) {
          console.error("Notifications loading error:", error);
          setLoading(false);
          return;
        }

        if (isMounted) {
          setNotifications(data ?? []);
        }

        // =========================
        // Realtime
        // =========================
        channel = supabase
          .channel(`notifications-${student.id}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "notifications",
              filter: `student_id=eq.${student.id}`,
            },
            (payload) => {
              const newNotification = payload.new as Notification;

              setNotifications((prev) => [
                newNotification,
                ...prev,
              ]);
            }
          )
          .subscribe();

      } catch (error) {
        console.error("Notification initialization error:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initialize();

    // =========================
    // إغلاق القائمة عند الضغط خارجها
    // =========================
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      isMounted = false;
      document.removeEventListener("mousedown", handleClickOutside);

      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // =========================
  // تعليم إشعار كمقروء
  // =========================
  async function markAsRead(id: string) {
    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
      })
      .eq("id", id);

    if (error) {
      console.error("Mark notification read error:", error);
      return;
    }

    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              is_read: true,
            }
          : notification
      )
    );
  }

  // =========================
  // تعليم الكل كمقروء
  // =========================
  async function markAllAsRead() {
    const unread = notifications.filter(
      (notification) => !notification.is_read
    );

    if (unread.length === 0) return;

    const ids = unread.map((notification) => notification.id);

    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
      })
      .in("id", ids);

    if (error) {
      console.error("Mark all notifications read error:", error);
      return;
    }

    setNotifications((prev) =>
      prev.map((notification) => ({
        ...notification,
        is_read: true,
      }))
    );
  }

  // =========================
  // أيقونة نوع الإشعار
  // =========================
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

  // =========================
  // التاريخ
  // =========================
  function formatDate(date: string) {
    return new Date(date).toLocaleString("ar-EG", {
      dateStyle: "short",
      timeStyle: "short",
    });
  }

  return (
    <div ref={wrapperRef} className="relative" dir="rtl">
      {/* =========================
          Bell Button
      ========================= */}
      <button
        onClick={() => {
          if (!notificationsEnabled) {
            setOpen(true);
            return;
          }
          setOpen((prev) => !prev);
        }}
        className="
          relative
          flex
          h-12
          w-12
          items-center
          justify-center
          rounded-2xl
          border
          border-cyan-500/20
          bg-slate-900/80
          text-cyan-400
          transition
          hover:bg-cyan-500/10
          hover:text-cyan-300
        "
        aria-label="الإشعارات"
      >
        {notificationsEnabled ? (
          <Bell className="h-6 w-6" />
        ) : (
          <BellOff className="h-6 w-6 text-slate-500" />
        )}

        {notificationsEnabled && unreadCount > 0 && (
          <span
            className="
              absolute
              -right-1
              -top-1
              flex
              min-h-5
              min-w-5
              items-center
              justify-center
              rounded-full
              bg-red-500
              px-1
              text-[10px]
              font-black
              text-white
              ring-2
              ring-slate-950
            "
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* =========================
          Dropdown
      ========================= */}
      {open && (
        <div
          className="
            absolute
            left-0
            top-14
            z-50
            w-[360px]
            max-w-[calc(100vw-2rem)]
            overflow-hidden
            rounded-3xl
            border
            border-cyan-500/20
            bg-[#081321]
            shadow-2xl
            shadow-black/50
          "
        >
          {!notificationsEnabled ? (
            <div className="p-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900">
                <BellOff className="h-7 w-7 text-slate-500" />
              </div>

              <h3 className="font-black text-white">الإشعارات متوقفة</h3>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                لقد قمت بإيقاف استقبال الإشعارات. يمكنك تفعيلها مرة أخرى من إعدادات المنصة.
              </p>

              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="
                  mt-5
                  block
                  rounded-xl
                  bg-cyan-500
                  py-3
                  text-sm
                  font-bold
                  text-slate-950
                  transition
                  hover:bg-cyan-400
                "
              >
                الذهاب إلى الإعدادات
              </Link>
            </div>
          ) : (
            <>
              <div
                className="
                  flex
                  items-center
                  justify-between
                  border-b
                  border-slate-800
                  p-4
                "
              >
                <div>
                  <h3 className="font-black text-white">الإشعارات</h3>

                  <p className="mt-1 text-xs text-slate-500">
                    {unreadCount > 0
                      ? `لديك ${unreadCount} إشعار غير مقروء`
                      : "لا توجد إشعارات جديدة"}
                  </p>
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="
                      flex
                      items-center
                      gap-1
                      text-xs
                      font-bold
                      text-cyan-400
                      hover:text-cyan-300
                    "
                  >
                    <CheckCheck className="h-4 w-4" />
                    قراءة الكل
                  </button>
                )}
              </div>

              <div className="max-h-[420px] overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center text-slate-500">
                    جاري تحميل الإشعارات...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="mb-3 text-4xl">🔔</div>

                    <p className="font-bold text-slate-300">لا توجد إشعارات</p>

                    <p className="mt-1 text-xs text-slate-600">
                      ستظهر هنا الإشعارات الجديدة.
                    </p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`
                        border-b
                        border-slate-800/70
                        p-4
                        transition
                        hover:bg-slate-900
                        ${
                          !notification.is_read
                            ? "bg-cyan-500/[0.04]"
                            : ""
                        }
                      `}
                    >
                      <div className="flex gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xl">
                          {getIcon(notification.type)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4
                              className={`
                                text-sm
                                font-black
                                ${
                                  notification.is_read
                                    ? "text-slate-300"
                                    : "text-white"
                                }
                              `}
                            >
                              {notification.title}
                            </h4>

                            {!notification.is_read && (
                              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-400" />
                            )}
                          </div>

                          <p className="mt-1 text-xs leading-5 text-slate-400">
                            {notification.message}
                          </p>

                          <p className="mt-2 text-[10px] text-slate-600">
                            {formatDate(notification.created_at)}
                          </p>

                          <div className="mt-3 flex gap-2">
                            {!notification.is_read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="
                                  rounded-lg
                                  border
                                  border-cyan-500/20
                                  bg-cyan-500/10
                                  px-3
                                  py-1.5
                                  text-[11px]
                                  font-bold
                                  text-cyan-400
                                  hover:bg-cyan-500/20
                                "
                              >
                                تعليم كمقروء
                              </button>
                            )}

                            {notification.link && (
                              <Link
                                href={notification.link}
                                onClick={() => markAsRead(notification.id)}
                                className="
                                  rounded-lg
                                  bg-cyan-500
                                  px-3
                                  py-1.5
                                  text-[11px]
                                  font-bold
                                  text-slate-950
                                  hover:bg-cyan-400
                                "
                              >
                                فتح
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-slate-800 p-3">
                <Link
                  href="/notifications"
                  onClick={() => setOpen(false)}
                  className="
                    block
                    rounded-xl
                    bg-slate-900
                    py-3
                    text-center
                    text-sm
                    font-bold
                    text-cyan-400
                    transition
                    hover:bg-slate-800
                  "
                >
                  عرض كل الإشعارات
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}