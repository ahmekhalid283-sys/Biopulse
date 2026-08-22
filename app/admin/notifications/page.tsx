"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  Bell,
  Send,
  Users,
  User,
  Megaphone,
  BookOpen,
  FileText,
  Trophy,
  ArrowRight,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from "lucide-react";

type Student = {
  id: string;
  full_name: string;
};

type NotificationType =
  | "announcement"
  | "lecture"
  | "exam"
  | "result";

type SentNotification = {
  id: string;
  student_id: string;
  title: string;
  message: string;
  type: NotificationType;
  link: string | null;
  is_read: boolean;
  created_at: string;
  students:
    | {
        full_name: string;
      }
    | {
        full_name: string;
      }[]
    | null;
};

type GroupedNotification = {
  key: string;
  title: string;
  message: string;
  type: NotificationType;
  link: string | null;
  created_at: string;
  recipients: {
    id: string;
    name: string;
  }[];
  notificationIds: string[];
};

export default function AdminNotificationsPage() {
  const router = useRouter();

  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  const [sentNotifications, setSentNotifications] = useState<
    SentNotification[]
  >([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  const [recipientType, setRecipientType] = useState<"all" | "student">(
    "all"
  );

  const [selectedStudent, setSelectedStudent] = useState("");

  const [notificationType, setNotificationType] =
    useState<NotificationType>("announcement");

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");

  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadStudents();
    loadSentNotifications();
  }, []);

  async function loadStudents() {
    try {
      setLoadingStudents(true);

      const { data, error } = await supabase
        .from("students")
        .select("id, full_name")
        .order("full_name", { ascending: true });

      if (error) {
        console.error("Load students error:", error);
        setError("تعذر تحميل قائمة الطلاب.");
        return;
      }

      setStudents(data || []);
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء تحميل الطلاب.");
    } finally {
      setLoadingStudents(false);
    }
  }

  async function loadSentNotifications() {
    try {
      setLoadingNotifications(true);

      const { data, error } = await supabase
        .from("notifications")
        .select(`
          id,
          student_id,
          title,
          message,
          type,
          link,
          is_read,
          created_at,
          students (
            full_name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Load notifications error:", error);
        setError("تعذر تحميل الإشعارات المرسلة.");
        return;
      }

      setSentNotifications((data || []) as unknown as SentNotification[]);
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء تحميل الإشعارات.");
    } finally {
      setLoadingNotifications(false);
    }
  }

  function groupNotifications(
    notifications: SentNotification[]
  ): GroupedNotification[] {
    const groups = new Map<string, GroupedNotification>();

    for (const notification of notifications) {
      const key = [
        notification.title,
        notification.message,
        notification.type,
        notification.link || "",
        notification.created_at,
      ].join("|");

      const studentName = Array.isArray(notification.students)
        ? notification.students[0]?.full_name || "طالب غير معروف"
        : notification.students?.full_name || "طالب غير معروف";

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          link: notification.link,
          created_at: notification.created_at,
          recipients: [],
          notificationIds: [],
        });
      }

      const group = groups.get(key)!;
      group.notificationIds.push(notification.id);
      group.recipients.push({
        id: notification.student_id,
        name: studentName,
      });
    }

    return Array.from(groups.values());
  }

  async function deleteNotificationGroup(ids: string[]) {
    const confirmed = window.confirm(
      ids.length > 1
        ? `هل أنت متأكد من حذف الإشعار من ${ids.length} طالب؟`
        : "هل أنت متأكد من حذف هذا الإشعار؟"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    const { error } = await supabase
      .from("notifications")
      .delete()
      .in("id", ids);

    if (error) {
      console.error("Delete notification error:", error);
      setError("حدث خطأ أثناء حذف الإشعار.");
      return;
    }

    setSentNotifications((prev) =>
      prev.filter((notification) => !ids.includes(notification.id))
    );

    setSuccess("تم حذف الإشعار بنجاح.");
  }

  function getTypeLabel(type: NotificationType) {
    switch (type) {
      case "lecture":
        return "محاضرة جديدة";
      case "exam":
        return "امتحان";
      case "result":
        return "نتيجة";
      case "announcement":
      default:
        return "إعلان";
    }
  }

  function getTypeIcon(type: NotificationType) {
    switch (type) {
      case "lecture":
        return <BookOpen className="h-5 w-5" />;
      case "exam":
        return <FileText className="h-5 w-5" />;
      case "result":
        return <Trophy className="h-5 w-5" />;
      case "announcement":
      default:
        return <Megaphone className="h-5 w-5" />;
    }
  }

  async function sendNotification() {
    setSuccess("");
    setError("");

    if (!title.trim()) {
      setError("اكتب عنوان الإشعار.");
      return;
    }

    if (!message.trim()) {
      setError("اكتب محتوى الإشعار.");
      return;
    }

    if (recipientType === "student" && !selectedStudent) {
      setError("اختر الطالب الذي تريد إرسال الإشعار إليه.");
      return;
    }

    try {
      setSending(true);

      let targetStudents: Student[] = [];

      if (recipientType === "all") {
        targetStudents = students;
      } else {
        const student = students.find(
          (item) => item.id === selectedStudent
        );

        if (student) {
          targetStudents = [student];
        }
      }

      if (targetStudents.length === 0) {
        setError("لا يوجد طلاب لإرسال الإشعار إليهم.");
        return;
      }

      const notifications = targetStudents.map((student) => ({
        student_id: student.id,
        title: title.trim(),
        message: message.trim(),
        type: notificationType,
        link: link.trim() || null,
        is_read: false,
      }));

      const { error: insertError } = await supabase
        .from("notifications")
        .insert(notifications);

      if (insertError) {
        console.error("Send notification error:", insertError);
        setError(insertError.message);
        return;
      }

      setSuccess(
        recipientType === "all"
          ? `تم إرسال الإشعار إلى ${targetStudents.length} طالب بنجاح.`
          : "تم إرسال الإشعار إلى الطالب بنجاح."
      );

      setTitle("");
      setMessage("");
      setLink("");
      setSelectedStudent("");

      await loadSentNotifications();
    } catch (err) {
      console.error("Notification sending error:", err);
      setError("حدث خطأ أثناء إرسال الإشعار.");
    } finally {
      setSending(false);
    }
  }

  const groupedNotifications = groupNotifications(sentNotifications);

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#030712] text-slate-100 font-sans"
    >
      {/* Top Header */}
      <div className="border-b border-slate-800/60 bg-[#050d1a]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <Bell className="h-6 w-6" />
            </div>

            <div>
              <p className="text-xs font-bold tracking-wide text-blue-400">
                BIOPULSE ADMIN
              </p>

              <h1 className="mt-0.5 text-2xl font-black text-white sm:text-3xl">
                الإشعارات
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                إدارة وإرسال إشعارات الطلاب من مكان واحد.
              </p>
            </div>
          </div>

          <button
            onClick={() => router.back()}
            className="hidden items-center gap-2 rounded-xl border border-slate-800 bg-[#030712] px-4 py-2.5 text-sm font-bold text-slate-300 transition hover:border-blue-500 hover:bg-blue-600/10 hover:text-white sm:flex"
          >
            <ArrowRight className="h-4 w-4" />
            رجوع
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:py-10">
        {/* Status */}
        {(success || error) && (
          <div className="mb-6">
            {success && (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm font-bold text-emerald-400">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                {success}
              </div>
            )}

            {error && (
              <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm font-bold text-red-400">
                <AlertCircle className="h-5 w-5 shrink-0" />
                {error}
              </div>
            )}
          </div>
        )}

        <div className="grid gap-7 lg:grid-cols-[1fr_360px]">
          {/* Main Form */}
          <section className="space-y-7">
            <div className="rounded-3xl border border-slate-800/80 bg-[#050d1a]/50 backdrop-blur-md shadow-2xl">
              {/* Form Header */}
              <div className="border-b border-slate-800/80 px-6 py-6 sm:px-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400">
                    <Send className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-lg font-black text-white">
                      إنشاء إشعار جديد
                    </h2>

                    <p className="mt-1 text-xs text-slate-400">
                      اختر المستلمين ونوع الإشعار ثم اكتب الرسالة.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-8 p-6 sm:p-8">
                {/* Recipients */}
                <div>
                  <SectionTitle
                    icon={<Users className="h-4 w-4" />}
                    title="المستلمون"
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <RecipientCard
                      active={recipientType === "all"}
                      icon={<Users className="h-5 w-5" />}
                      title="جميع الطلاب"
                      description="إرسال الإشعار لكل الطلاب"
                      onClick={() => {
                        setRecipientType("all");
                        setSelectedStudent("");
                      }}
                    />

                    <RecipientCard
                      active={recipientType === "student"}
                      purple
                      icon={<User className="h-5 w-5" />}
                      title="طالب محدد"
                      description="إرسال الإشعار لطالب واحد"
                      onClick={() => setRecipientType("student")}
                    />
                  </div>

                  {recipientType === "student" && (
                    <div className="mt-4">
                      <label className="mb-2 block text-sm font-bold text-slate-300">
                        اختر الطالب
                      </label>

                      <select
                        value={selectedStudent}
                        onChange={(e) =>
                          setSelectedStudent(e.target.value)
                        }
                        disabled={loadingStudents}
                        className="w-full rounded-xl border border-slate-800 bg-[#030712] px-4 py-3 text-sm font-medium text-slate-200 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60"
                      >
                        <option value="" className="bg-[#030712]">
                          {loadingStudents
                            ? "جاري تحميل الطلاب..."
                            : "اختر طالباً"}
                        </option>

                        {students.map((student) => (
                          <option key={student.id} value={student.id} className="bg-[#030712]">
                            {student.full_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Notification Type */}
                <div>
                  <SectionTitle
                    icon={<Megaphone className="h-4 w-4" />}
                    title="نوع الإشعار"
                  />

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {(
                      [
                        {
                          type: "announcement" as NotificationType,
                          label: "إعلان",
                          description: "إعلان عام للطلاب",
                          icon: <Megaphone className="h-6 w-6" />,
                          active:
                            "border-blue-500/50 bg-blue-600/10 ring-2 ring-blue-500/20",
                          iconActive: "bg-blue-600 text-white",
                          textActive: "text-blue-400",
                          iconInactive: "bg-slate-900 text-slate-400",
                        },
                        {
                          type: "lecture" as NotificationType,
                          label: "محاضرة جديدة",
                          description: "إضافة محاضرة جديدة للمنصة",
                          icon: <BookOpen className="h-6 w-6" />,
                          active:
                            "border-cyan-500/50 bg-cyan-600/10 ring-2 ring-cyan-500/20",
                          iconActive: "bg-cyan-600 text-white",
                          textActive: "text-cyan-400",
                          iconInactive: "bg-slate-900 text-slate-400",
                        },
                        {
                          type: "exam" as NotificationType,
                          label: "امتحان",
                          description: "إعلان عن اختبار أو امتحان جديد",
                          icon: <FileText className="h-6 w-6" />,
                          active:
                            "border-violet-500/50 bg-violet-600/10 ring-2 ring-violet-500/20",
                          iconActive: "bg-violet-600 text-white",
                          textActive: "text-violet-400",
                          iconInactive: "bg-slate-900 text-slate-400",
                        },
                        {
                          type: "result" as NotificationType,
                          label: "نتيجة",
                          description: "إعلان نتيجة أو إنجاز",
                          icon: <Trophy className="h-6 w-6" />,
                          active:
                            "border-amber-500/50 bg-amber-600/10 ring-2 ring-amber-500/20",
                          iconActive: "bg-amber-500 text-white",
                          textActive: "text-amber-400",
                          iconInactive: "bg-slate-900 text-slate-400",
                        },
                      ] as const
                    ).map((item) => {
                      const selected = notificationType === item.type;

                      return (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() =>
                            setNotificationType(
                              item.type as NotificationType
                            )
                          }
                          className={`group relative overflow-hidden rounded-2xl border p-5 text-right transition-all duration-200 ${
                            selected
                              ? `${item.active} shadow-lg`
                              : "border-slate-800 bg-[#030712]/60 hover:-translate-y-0.5 hover:border-slate-700 hover:shadow-md"
                          }`}
                        >
                          {selected && (
                            <div className="absolute left-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-black shadow-sm">
                              ✓
                            </div>
                          )}

                          <div className="flex items-start gap-4">
                            <div
                              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition ${
                                selected
                                  ? item.iconActive
                                  : item.iconInactive
                              }`}
                            >
                              {item.icon}
                            </div>

                            <div className="min-w-0">
                              <h3
                                className={`font-black ${
                                  selected
                                    ? item.textActive
                                    : "text-slate-200"
                                }`}
                              >
                                {item.label}
                              </h3>

                              <p className="mt-1 text-xs leading-5 text-slate-400">
                                {item.description}
                              </p>
                            </div>
                          </div>

                          <div
                            className={`mt-4 rounded-xl px-3 py-2 text-xs font-bold ${
                              selected
                                ? "bg-blue-500/20 text-blue-300"
                                : "bg-slate-900/50 text-slate-400"
                            }`}
                          >
                            {selected
                              ? `✓ ${item.label} محدد`
                              : "اضغط للاختيار"}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Title */}
                <Field label="عنوان الإشعار">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: تم نشر محاضرة جديدة"
                    maxLength={150}
                    className="AdminInput"
                  />
                </Field>

                {/* Message */}
                <Field label="محتوى الإشعار">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="اكتب الرسالة التي ستظهر للطالب..."
                    rows={6}
                    maxLength={1000}
                    className="AdminInput resize-none leading-7"
                  />

                  <div className="mt-2 text-left text-xs text-slate-500">
                    {message.length}/1000
                  </div>
                </Field>

                {/* Link */}
                <Field label="رابط اختياري">
                  <div className="relative">
                    <LinkIcon className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                    <input
                      type="text"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      placeholder="/chapters/dna"
                      maxLength={500}
                      className="AdminInput pr-11"
                    />
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    رابط للمحاضرة أو الامتحان أو أي صفحة داخل المنصة.
                  </p>
                </Field>

                {/* Send */}
                <button
                  type="button"
                  onClick={sendNotification}
                  disabled={
                    sending ||
                    loadingStudents ||
                    !title.trim() ||
                    !message.trim() ||
                    (recipientType === "student" && !selectedStudent)
                  }
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 px-6 py-4 text-base font-black text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sending ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      جاري إرسال الإشعار...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      إرسال الإشعار
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Sent Notifications History Section */}
            <div className="rounded-3xl border border-slate-800/80 bg-[#050d1a]/50 backdrop-blur-md shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-6 sm:px-8">
                <div>
                  <h2 className="text-lg font-black text-white">
                    الإشعارات المرسلة سابقة
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    سجل جميع الإشعارات التي تم إرسالها للطلاب.
                  </p>
                </div>

                <div className="rounded-full bg-blue-600/20 px-4 py-1.5 text-xs font-black text-blue-400 border border-blue-500/20">
                  {groupedNotifications.length} إشعار
                </div>
              </div>

              {loadingNotifications ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  جاري تحميل الإشعارات...
                </div>
              ) : groupedNotifications.length === 0 ? (
                <div className="p-12 text-center text-sm text-slate-500">
                  لا توجد إشعارات مرسلة حتى الآن.
                </div>
              ) : (
                <div className="divide-y divide-slate-800/80">
                  {groupedNotifications.map((notification) => {
                    const recipientCount = notification.recipients.length;
                    const isMultiple = recipientCount > 1;

                    return (
                      <article
                        key={notification.key}
                        className="p-6 transition hover:bg-slate-900/30 sm:px-8"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex items-start gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400 shadow-sm border border-blue-500/20">
                              {getTypeIcon(notification.type)}
                            </div>

                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-black text-white">
                                  {notification.title}
                                </h3>

                                <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-bold text-slate-300 border border-slate-800">
                                  {getTypeLabel(notification.type)}
                                </span>
                              </div>

                              <p className="text-sm leading-relaxed text-slate-300">
                                {notification.message}
                              </p>

                              {/* المستلمين */}
                              <div className="mt-3 rounded-xl bg-[#030712]/60 border border-slate-800/80 p-3">
                                {isMultiple ? (
                                  <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
                                    <Users className="h-4 w-4 text-blue-400" />
                                    مبعوت لـ {recipientCount} طالب
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
                                    <User className="h-4 w-4 text-blue-400" />
                                    مبعوت إلى:
                                    <span className="text-blue-400">
                                      {notification.recipients[0]?.name}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-4 pt-2 text-xs text-slate-500">
                                <span>
                                  {new Date(
                                    notification.created_at
                                  ).toLocaleString("ar-EG")}
                                </span>

                                {notification.link && (
                                  <span className="text-blue-400 font-semibold truncate max-w-[250px]">
                                    الرابط: {notification.link}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex shrink-0 lg:pt-1">
                            <button
                              type="button"
                              onClick={() =>
                                deleteNotificationGroup(
                                  notification.notificationIds
                                )
                              }
                              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-black text-red-400 transition hover:border-red-500 hover:bg-red-500/20 hover:text-red-300 lg:w-auto"
                            >
                              <Trash2 className="h-4 w-4" />
                              حذف
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Preview Sidebar */}
          <aside className="space-y-5">
            {/* Preview */}
            <div className="rounded-2xl border border-slate-800/80 bg-[#050d1a]/50 backdrop-blur-md p-5 shadow-2xl">
              <h2 className="mb-4 text-sm font-black text-slate-300">
                معاينة الإشعار
              </h2>

              {(() => {
                const previewStyles = {
                  announcement: {
                    wrapper: "border-blue-500/30 bg-blue-600/10",
                    icon: "bg-blue-600 text-white",
                    title: "text-blue-400",
                    badge: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
                  },
                  lecture: {
                    wrapper: "border-cyan-500/30 bg-cyan-600/10",
                    icon: "bg-cyan-600 text-white",
                    title: "text-cyan-400",
                    badge: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30",
                  },
                  exam: {
                    wrapper: "border-violet-500/30 bg-violet-600/10",
                    icon: "bg-violet-600 text-white",
                    title: "text-violet-400",
                    badge: "bg-violet-500/20 text-violet-300 border border-violet-500/30",
                  },
                  result: {
                    wrapper: "border-amber-500/30 bg-amber-600/10",
                    icon: "bg-amber-500 text-white",
                    title: "text-amber-400",
                    badge: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
                  },
                };

                const style = previewStyles[notificationType];

                return (
                  <div
                    className={`overflow-hidden rounded-2xl border bg-[#030712] shadow-lg ${style.wrapper}`}
                  >
                    <div
                      className={`h-1.5 ${
                        notificationType === "announcement"
                          ? "bg-blue-600"
                          : notificationType === "lecture"
                            ? "bg-cyan-600"
                            : notificationType === "exam"
                              ? "bg-violet-600"
                              : "bg-amber-500"
                      }`}
                    />

                    <div className="p-5">
                      <div className="flex gap-4">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm ${style.icon}`}
                        >
                          {getTypeIcon(notificationType)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <h3 className="font-black text-white">
                              {title || "عنوان الإشعار"}
                            </h3>

                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-black ${style.badge}`}
                            >
                              {getTypeLabel(notificationType)}
                            </span>
                          </div>

                          <p className="text-sm leading-6 text-slate-300">
                            {message || "محتوى الإشعار سيظهر هنا..."}
                          </p>

                          {link && (
                            <div
                              className={`mt-3 inline-flex rounded-lg px-3 py-1.5 text-xs font-bold ${style.badge}`}
                            >
                              🔗 فتح المحتوى
                            </div>
                          )}

                          <p className="mt-4 text-[11px] text-slate-500">
                            يظهر هذا الإشعار داخل جرس إشعارات الطالب
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Info Card */}
            <div className="rounded-3xl border border-blue-500/30 bg-blue-600/10 backdrop-blur-md p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <Bell className="h-5 w-5" />
              </div>

              <h3 className="font-black text-white">ملاحظة مهمة</h3>

              <p className="mt-2 text-sm leading-6 text-blue-200/80">
                عند إرسال الإشعار سيظهر مباشرة داخل جرس إشعارات
                الطالب. ومع تفعيل Realtime في Supabase يمكن أن
                يظهر الإشعار بدون إعادة تحميل الصفحة.
              </p>
            </div>
          </aside>
        </div>
      </div>

      <style jsx global>{`
        .AdminInput {
          width: 100%;
          border-radius: 0.875rem;
          border: 1px solid rgb(30 41 59);
          background: rgb(3 7 18);
          padding: 0.8rem 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: rgb(241 245 249);
          outline: none;
          transition: all 0.2s;
        }

        .AdminInput::placeholder {
          color: rgb(100 116 139);
        }

        .AdminInput:focus {
          border-color: rgb(37 99 235);
          background: rgb(5 13 26);
          box-shadow: 0 0 0 4px rgb(37 99 235 / 0.15);
        }
      `}</style>
    </main>
  );
}

function SectionTitle({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <h2 className="mb-4 flex items-center gap-2 text-sm font-black text-white">
      <span className="text-blue-400">{icon}</span>
      {title}
    </h2>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-300">
        {label}
      </label>
      {children}
    </div>
  );
}

function RecipientCard({
  active,
  purple = false,
  icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  purple?: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-start gap-4 rounded-2xl border p-4 text-right transition-all duration-200 ${
        active
          ? purple
            ? "border-purple-500/50 bg-purple-600/10 ring-2 ring-purple-500/20 shadow-lg"
            : "border-blue-500/50 bg-blue-600/10 ring-2 ring-blue-500/20 shadow-lg"
          : "border-slate-800 bg-[#030712]/60 hover:border-slate-700 hover:shadow-md"
      }`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${
          active
            ? purple
              ? "bg-purple-600 text-white"
              : "bg-blue-600 text-white"
            : "bg-slate-900 text-slate-400"
        }`}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <h3
          className={`font-black ${
            active
              ? purple
                ? "text-purple-400"
                : "text-blue-400"
              : "text-slate-200"
          }`}
        >
          {title}
        </h3>
        <p className="mt-0.5 text-xs text-slate-400">{description}</p>
      </div>
    </button>
  );
}