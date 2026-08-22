"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Send,
  Trash2,
  Clock3,
  Sparkles,
  Layers3,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type Student = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
};

type Notification = {
  id: string;
  student_id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export default function AdminStudentNotificationsPage() {
  const { studentId } = useParams<{ studentId: string }>();

  const [student, setStudent] = useState<Student | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("announcement");
  const [link, setLink] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadData();
  }, [studentId]);

  async function loadData() {
    setLoading(true);

    const { data: studentData, error: studentError } = await supabase
      .from("students")
      .select("id,full_name,email,phone,avatar_url")
      .eq("id", studentId)
      .single();

    if (studentError) {
      console.error(studentError);
      setLoading(false);
      return;
    }

    setStudent(studentData);

    const { data: notificationsData, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setNotifications(notificationsData || []);
    }

    setLoading(false);
  }

  async function sendNotification() {
    if (!title.trim() || !message.trim()) {
      alert("اكتب عنوان الإشعار والرسالة");
      return;
    }

    setSending(true);

    const { data, error } = await supabase
      .from("notifications")
      .insert({
        student_id: studentId,
        title: title.trim(),
        message: message.trim(),
        type,
        link: link.trim() || null,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      alert(error.message);
      setSending(false);
      return;
    }

    if (data) {
      setNotifications((prev) => [data, ...prev]);
    }

    setTitle("");
    setMessage("");
    setLink("");
    setSending(false);

    alert("تم إرسال الإشعار بنجاح ✅");
  }

  async function deleteNotification(notificationId: string) {
    const ok = confirm("هل تريد حذف هذا الإشعار؟");
    if (!ok) return;

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (error) {
      alert(error.message);
      return;
    }

    setNotifications((prev) => prev.filter((item) => item.id !== notificationId));
  }

  if (loading) {
    return (
      <main dir="rtl" className="min-h-screen bg-[#070b14] p-4 text-slate-100 sm:p-6 lg:p-10">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="h-14 w-64 animate-pulse rounded-3xl bg-[#0e1626]" />
          <div className="h-[500px] animate-pulse rounded-3xl bg-[#0b111e] border border-slate-800" />
        </div>
      </main>
    );
  }

  if (!student) {
    return (
      <main dir="rtl" className="min-h-screen bg-[#070b14] p-4 text-slate-100 sm:p-6 lg:p-10">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl border border-red-500/20 bg-[#0b111e] p-12 text-center shadow-lg">
            <h2 className="text-2xl font-black text-red-400">الطالب غير موجود</h2>
            <Link
              href="/admin/students"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#2563eb] px-6 py-3.5 text-sm font-black text-white transition hover:bg-[#1d4ed8]"
            >
              <ArrowRight className="h-4 w-4" />
              الرجوع للطلاب
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#070b14] p-4 text-slate-100 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-5xl space-y-8">

        {/* Header Section */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0b111e] border border-slate-800 text-[#3b82f6] shadow-lg">
              <Bell className="h-7 w-7" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                  إشعارات الطالب
                </h1>
                <Sparkles className="h-5 w-5 text-cyan-400" />
              </div>
              <p className="mt-1 text-sm text-slate-400">
                إدارة وإرسال التنبيهات المباشرة لـ <span className="font-bold text-slate-200">{student.full_name}</span>
              </p>
            </div>
          </div>

          <Link
            href={`/admin/students/${studentId}`}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-[#0b111e] px-5 text-sm font-bold text-slate-300 shadow-sm transition hover:border-slate-700 hover:bg-[#111827] hover:text-white"
          >
            <ArrowRight className="h-4 w-4" />
            الرجوع للطالب
          </Link>
        </div>

        {/* Student Profile Card */}
        <div className="flex items-center gap-4 rounded-3xl border border-slate-800 bg-[#0b111e] p-5 shadow-sm sm:p-6">
          <img
            src={student.avatar_url || "/images/default-avatar.png"}
            alt=""
            className="h-14 w-14 rounded-2xl object-cover border border-slate-700 shadow-sm"
          />
          <div>
            <span className="inline-block rounded-lg bg-blue-500/10 px-2.5 py-1 text-[11px] font-black text-blue-400 border border-blue-500/20">
              ملف الطالب
            </span>
            <h2 className="mt-1 text-lg font-black text-white sm:text-xl">{student.full_name}</h2>
            <p className="text-xs font-semibold text-slate-400">
              {student.email || student.phone || "لا توجد بيانات اتصال"}
            </p>
          </div>
        </div>

        {/* Create Notification Card */}
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-[#0b111e] shadow-sm">
          <div className="border-b border-slate-800/80 bg-[#0b111e] px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">إرسال إشعار جديد</h2>
                <p className="text-xs text-slate-400">سيظهر هذا الإشعار حصرياً في حساب الطالب المنشود</p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Title */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">
                  عنوان الإشعار
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: لديك امتحان جديد في الفصل الأول"
                  className="w-full h-12 rounded-2xl border border-slate-800 bg-[#070b14] px-4 text-sm font-semibold text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              {/* Type */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">
                  نوع الإشعار
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full h-12 rounded-2xl border border-slate-800 bg-[#070b14] px-4 text-sm font-semibold text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                >
                  <option value="announcement" className="bg-[#0b111e]">إعلان عام</option>
                  <option value="lecture" className="bg-[#0b111e]">محاضرة جديدة</option>
                  <option value="exam" className="bg-[#0b111e]">امتحان جديد</option>
                  <option value="result" className="bg-[#0b111e]">نتيجة الامتحان</option>
                  <option value="support" className="bg-[#0b111e]">دعم علمي</option>
                </select>
              </div>

              {/* Message */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-slate-300">
                  محتوى الرسالة
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="اكتب تفاصيل الإشعار هنا..."
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-slate-800 bg-[#070b14] p-4 text-sm font-semibold text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              {/* Link */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-slate-300">
                  الرابط المرتبط <span className="font-normal text-slate-500">(اختياري)</span>
                </label>
                <input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="/lectures/..."
                  className="w-full h-12 rounded-2xl border border-slate-800 bg-[#070b14] px-4 text-sm font-semibold text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={sendNotification}
                disabled={sending}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#2563eb] px-8 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                <Send className="h-4 w-4" />
                {sending ? "جارٍ الإرسال..." : "إرسال الإشعار للطالب"}
              </button>
            </div>

          </div>
        </div>

        {/* Notifications History List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-white tracking-tight">سجل الإشعارات المرسلة</h2>
            <div className="flex items-center gap-2 rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-xs font-black text-blue-400">
              <Layers3 className="h-3.5 w-3.5" />
              <span>{notifications.length} إشعار مسجل</span>
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-800 bg-[#0b111e] p-12 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#070b14] border border-slate-800 text-slate-500">
                <Bell className="h-7 w-7" />
              </div>
              <h3 className="text-base font-black text-slate-200">لا توجد إشعارات سابقة</h3>
              <p className="mt-1 text-sm text-slate-500">لم يتم إرسال أي إشعارات لهذا الطالب حتى الآن.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="group rounded-3xl border border-slate-800 bg-[#0b111e] p-5 shadow-sm transition-all duration-300 hover:border-slate-700 hover:shadow-md sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold shadow-sm">
                      <Bell className="h-5 w-5" />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-black text-white">{notification.title}</h3>
                        <span className="rounded-xl bg-slate-800 px-3 py-1 text-[11px] font-black text-slate-300 border border-slate-700/50">
                          {notification.type}
                        </span>
                        {!notification.is_read && (
                          <span className="rounded-xl bg-cyan-500/10 px-3 py-1 text-[11px] font-black text-cyan-400 border border-cyan-500/20">
                            غير مقروء
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-medium text-slate-400 whitespace-pre-wrap leading-relaxed">
                        {notification.message}
                      </p>

                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 pt-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        <span>{new Date(notification.created_at).toLocaleString("ar-EG")}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteNotification(notification.id)}
                    className="h-11 w-11 shrink-0 inline-flex items-center justify-center rounded-2xl text-red-400 bg-red-500/10 border border-red-500/20 transition hover:bg-red-500/20"
                    title="حذف الإشعار"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}