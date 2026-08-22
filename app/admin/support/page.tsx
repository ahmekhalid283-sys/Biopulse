"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  MessageCircle,
  Send,
  User,
  RefreshCw,
  Bell,
  X,
  Paperclip,
} from "lucide-react";

type Student = {
  id: string;
  full_name: string;
  avatar_url?: string | null;
};

type SupportMessage = {
  id: string;
  student_id: string;
  sender_type: "student" | "admin";
  message: string | null;
  image_url: string | null;
  created_at: string;
  admin_read: boolean;
};

type UnreadMap = Record<string, number>;

export default function AdminSupportPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [unread, setUnread] = useState<UnreadMap>({});
  const [message, setMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("Admin auth error:", authError);
      }

      if (!user) return;
      if (!mounted) return;

      await Promise.all([loadStudents(), loadUnreadMessages()]);
    }

    initialize();

    const channelName = "admin-support-global";

    const oldChannel = supabase
      .getChannels()
      .find((channel) => channel.topic === `realtime:${channelName}`);

    if (oldChannel) {
      supabase.removeChannel(oldChannel);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
        },
        (payload) => {
          if (!mounted) return;

          const newMessage = payload.new as SupportMessage;

          if (newMessage.sender_type === "student") {
            handleNewStudentMessage(newMessage);
          }
        }
      )
      .subscribe((status) => {
        console.log("ADMIN SUPPORT REALTIME:", status);
      });

    const interval = setInterval(() => {
      if (!mounted) return;
      checkForNewStudentMessages();
    }, 3000);

    return () => {
      mounted = false;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  function handleNewStudentMessage(newMessage: SupportMessage) {
    if (selectedStudent?.id === newMessage.student_id) {
      setMessages((prev) => {
        const exists = prev.some((item) => item.id === newMessage.id);
        if (exists) return prev;
        return [...prev, newMessage];
      });

      markStudentMessagesAsRead(newMessage.student_id);
    } else {
      setUnread((prev) => ({
        ...prev,
        [newMessage.student_id]: (prev[newMessage.student_id] || 0) + 1,
      }));
    }

    setStudents((prev) => {
      const index = prev.findIndex(
        (student) => student.id === newMessage.student_id
      );

      if (index === -1) {
        loadStudents();
        return prev;
      }

      const student = prev[index];
      const remaining = prev.filter((_, i) => i !== index);
      return [student, ...remaining];
    });
  }

  async function checkForNewStudentMessages() {
    const { data, error } = await supabase
      .from("support_messages")
      .select("student_id")
      .eq("sender_type", "student")
      .eq("admin_read", false);

    if (error) {
      console.error("Unread checker error:", error);
      return;
    }

    const map: UnreadMap = {};
    (data || []).forEach((row) => {
      map[row.student_id] = (map[row.student_id] || 0) + 1;
    });

    setUnread(map);

    if (data && data.length > 0) {
      const ids = new Set(data.map((row) => row.student_id));

      setStudents((prev) => {
        const unreadStudents = prev.filter((student) => ids.has(student.id));
        const normalStudents = prev.filter((student) => !ids.has(student.id));
        return [...unreadStudents, ...normalStudents];
      });
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadStudents() {
    try {
      setLoadingStudents(true);

      const { data, error } = await supabase
        .from("students")
        .select("id, full_name, avatar_url")
        .order("full_name", { ascending: true });

      if (error) {
        console.error("Load students error:", error);
        setError(error.message);
        return;
      }

      setStudents(data || []);
    } catch (error) {
      console.error(error);
      setError("تعذر تحميل الطلاب.");
    } finally {
      setLoadingStudents(false);
    }
  }

  async function loadUnreadMessages() {
    const { data, error } = await supabase
      .from("support_messages")
      .select("student_id")
      .eq("sender_type", "student")
      .eq("admin_read", false);

    if (error) {
      console.error("Load unread error:", error);
      return;
    }

    const map: UnreadMap = {};
    (data || []).forEach((item) => {
      map[item.student_id] = (map[item.student_id] || 0) + 1;
    });

    setUnread(map);
  }

  async function openStudent(student: Student) {
    setSelectedStudent(student);
    setMessages([]);
    setLoadingMessages(true);
    setError("");

    const { data, error } = await supabase
      .from("support_messages")
      .select(
        `
          id,
          student_id,
          sender_type,
          message,
          image_url,
          created_at,
          admin_read
        `
      )
      .eq("student_id", student.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Load messages error:", error);
      setError(error.message);
      setLoadingMessages(false);
      return;
    }

    setMessages(data || []);
    setLoadingMessages(false);
    await markStudentMessagesAsRead(student.id);
  }

  async function markStudentMessagesAsRead(studentId: string) {
    setUnread((prev) => {
      const next = { ...prev };
      delete next[studentId];
      return next;
    });

    const { error } = await supabase
      .from("support_messages")
      .update({ admin_read: true })
      .eq("student_id", studentId)
      .eq("sender_type", "student")
      .eq("admin_read", false);

    if (error) {
      console.error("Mark read error:", error);
    }
  }

  function handleImageSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("من فضلك اختر صورة فقط.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("حجم الصورة يجب ألا يتجاوز 5MB.");
      return;
    }

    setError("");
    setSelectedImage(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  }

  function removeSelectedImage() {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function uploadImage(file: File, studentId: string) {
    const extension = file.name.split(".").pop() || "jpg";
    const fileName = `${studentId}/${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage
      .from("support-images")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (error) throw error;

    const { data } = supabase.storage
      .from("support-images")
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  async function sendMessage() {
    const text = message.trim();

    if (!selectedStudent || sending) return;
    if (!text && !selectedImage) return;

    try {
      setSending(true);
      setError("");

      let imageUrl: string | null = null;

      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage, selectedStudent.id);
      }

      const { data, error } = await supabase
        .from("support_messages")
        .insert({
          student_id: selectedStudent.id,
          sender_type: "admin",
          message: text || null,
          image_url: imageUrl,
          admin_read: true,
        })
        .select(
          `
            id,
            student_id,
            sender_type,
            message,
            image_url,
            created_at,
            admin_read
          `
        )
        .single();

      if (error) {
        console.error("Send admin message error:", error);
        setError(error.message || "تعذر إرسال الرسالة.");
        return;
      }

      if (data) {
        setMessages((prev) => {
          const exists = prev.some((item) => item.id === data.id);
          if (exists) return prev;
          return [...prev, data];
        });
      }

      setMessage("");
      removeSelectedImage();
    } catch (error: any) {
      console.error("Send admin message error:", error);
      setError(error?.message || "حدث خطأ أثناء إرسال الرسالة.");
    } finally {
      setSending(false);
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString("ar-EG", {
      dateStyle: "short",
      timeStyle: "short",
    });
  }

  const totalUnread = Object.values(unread).reduce(
    (sum, count) => sum + count,
    0
  );

  return (
    <main dir="rtl" className="min-h-screen bg-[#070b14] text-white">
      <div className="w-full space-y-6">
        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <MessageCircle className="h-6 w-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold sm:text-3xl">الدعم العلمي</h1>
                {totalUnread > 0 && (
                  <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-red-500 px-2 text-xs font-bold text-white">
                    {totalUnread}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-400">
                محادثات الطلاب مع إدارة المنصة
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              loadStudents();
              loadUnreadMessages();
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-800"
          >
            <RefreshCw className="h-4 w-4" />
            تحديث
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-medium text-red-400">
            {error}
          </div>
        )}

        {/* MAIN */}
        <div className="grid min-h-[650px] overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 shadow-xl lg:grid-cols-[300px_1fr]">
          {/* STUDENTS LIST */}
          <aside className="border-b border-slate-800 bg-slate-900/80 lg:border-b-0 lg:border-l">
            <div className="border-b border-slate-800 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-white">الطلاب</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    اختر طالبًا لفتح المحادثة
                  </p>
                </div>

                {totalUnread > 0 && (
                  <div className="flex items-center gap-1 text-red-400">
                    <Bell className="h-4 w-4" />
                    <span className="text-xs font-bold">{totalUnread}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="max-h-[300px] overflow-y-auto lg:max-h-[590px]">
              {loadingStudents ? (
                <div className="p-6 text-center text-sm text-slate-500">
                  جاري تحميل الطلاب...
                </div>
              ) : students.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500">
                  لا يوجد طلاب.
                </div>
              ) : (
                students.map((student) => {
                  const active = selectedStudent?.id === student.id;
                  const unreadCount = unread[student.id] || 0;
                  const hasUnread = unreadCount > 0;

                  return (
                    <button
                      key={student.id}
                      onClick={() => openStudent(student)}
                      className={`relative flex w-full items-center gap-3 border-b p-4 text-right transition ${
                        hasUnread
                          ? "border-red-500/30 bg-red-500/10 hover:bg-red-500/15"
                          : active
                            ? "border-blue-500/30 bg-blue-500/10 text-blue-300"
                            : "border-slate-800 hover:bg-slate-800/50"
                      }`}
                    >
                      {hasUnread && (
                        <span className="absolute right-0 top-0 h-full w-1 bg-red-500" />
                      )}

                      {student.avatar_url ? (
                        <img
                          src={student.avatar_url}
                          alt=""
                          className="h-11 w-11 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-400">
                          <User className="h-5 w-5" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={`truncate font-bold ${
                              hasUnread ? "text-red-300" : "text-white"
                            }`}
                          >
                            {student.full_name}
                          </p>

                          {hasUnread && (
                            <span className="flex shrink-0 items-center justify-center rounded-full bg-red-500 px-2 py-1 text-[10px] font-bold text-white">
                              {unreadCount}
                            </span>
                          )}
                        </div>

                        <p
                          className={`mt-1 text-[11px] ${
                            hasUnread
                              ? "font-bold text-red-400"
                              : "text-slate-500"
                          }`}
                        >
                          {hasUnread ? "رسالة جديدة" : "محادثة الدعم"}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* CHAT */}
          <section className="flex min-w-0 flex-col">
            {/* CHAT HEADER */}
            <div className="flex shrink-0 items-center gap-3 border-b border-slate-800 bg-slate-900/80 p-4 sm:p-5">
              {selectedStudent ? (
                <>
                  {selectedStudent.avatar_url ? (
                    <img
                      src={selectedStudent.avatar_url}
                      alt=""
                      className="h-11 w-11 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500/15 text-blue-400">
                      <User className="h-5 w-5" />
                    </div>
                  )}

                  <div>
                    <h2 className="font-bold text-white">
                      {selectedStudent.full_name}
                    </h2>
                    <p className="text-xs text-emerald-400">الدعم العلمي</p>
                  </div>
                </>
              ) : (
                <h2 className="font-bold text-slate-400">اختر طالبًا</h2>
              )}
            </div>

            {/* MESSAGES */}
            <div className="min-h-0 flex-1 overflow-y-auto bg-[#070b14] p-4 sm:p-6">
              {!selectedStudent ? (
                <div className="flex h-full min-h-[400px] items-center justify-center text-center">
                  <div>
                    <MessageCircle className="mx-auto mb-4 h-12 w-12 text-slate-600" />
                    <p className="font-bold text-slate-500">
                      اختر طالبًا من القائمة
                    </p>
                  </div>
                </div>
              ) : loadingMessages ? (
                <div className="flex h-full min-h-[400px] items-center justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full min-h-[400px] items-center justify-center text-center">
                  <div>
                    <div className="mb-4 text-5xl">💬</div>
                    <p className="font-bold text-slate-500">
                      لا توجد رسائل حتى الآن
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((item) => {
                    const isAdmin = item.sender_type === "admin";

                    return (
                      <div
                        key={item.id}
                        className={`flex ${isAdmin ? "justify-start" : "justify-end"}`}
                      >
                        <div className="max-w-[88%] sm:max-w-[70%]">
                          <div
                            className={`rounded-2xl px-4 py-3 shadow-sm ${
                              isAdmin
                                ? "rounded-tl-md bg-blue-600 text-white"
                                : "rounded-tr-md border border-slate-700 bg-slate-800 text-slate-100"
                            }`}
                          >
                            {item.message && (
                              <p className="whitespace-pre-wrap break-words text-sm leading-6">
                                {item.message}
                              </p>
                            )}

                            {item.image_url && (
                              <button
                                type="button"
                                onClick={() => setPreviewImage(item.image_url!)}
                                className={`mt-2 block overflow-hidden rounded-xl ${
                                  item.message ? "" : "mt-0"
                                }`}
                              >
                                <img
                                  src={item.image_url}
                                  alt="صورة مرفقة"
                                  className="max-h-[350px] max-w-full rounded-xl object-contain transition hover:scale-[1.02]"
                                />
                              </button>
                            )}
                          </div>

                          <p className="mt-1 px-1 text-[10px] text-slate-500">
                            {isAdmin ? "الإدارة" : selectedStudent.full_name}
                            {" • "}
                            {formatDate(item.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* IMAGE PREVIEW BEFORE SEND */}
            {imagePreview && (
              <div className="border-t border-slate-800 bg-slate-900/80 px-3 pt-3">
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="معاينة"
                    className="h-24 w-24 rounded-xl border border-slate-700 object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeSelectedImage}
                    className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* INPUT */}
            <div className="shrink-0 border-t border-slate-800 bg-slate-900/80 p-3 sm:p-4">
              {selectedStudent ? (
                <div>
                  <div className="flex items-end gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={sending}
                      className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 text-slate-400 transition hover:border-blue-500 hover:bg-blue-500/10 hover:text-blue-400 disabled:opacity-50"
                      aria-label="إضافة صورة"
                    >
                      <Paperclip className="h-5 w-5" />
                    </button>

                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="اكتب ردك للطالب..."
                      rows={2}
                      disabled={sending}
                      className="min-h-[52px] flex-1 resize-none rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                    />

                    <button
                      onClick={sendMessage}
                      disabled={sending || (!message.trim() && !selectedImage)}
                      className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="إرسال"
                    >
                      {sending ? (
                        <RefreshCw className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  <p className="mt-2 text-[10px] text-slate-500">
                    يمكنك إرسال نص أو صورة أو الاثنين معًا — Enter للإرسال
                  </p>
                </div>
              ) : (
                <p className="py-3 text-center text-sm text-slate-500">
                  اختر طالبًا أولًا لإرسال رسالة.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* FULL IMAGE PREVIEW */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-5 backdrop-blur-sm"
        >
          <div className="relative">
            <img
              src={previewImage}
              alt="صورة"
              className="max-h-[90vh] max-w-[90vw] rounded-3xl border-4 border-slate-700 object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -right-3 -top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl font-black text-slate-800 shadow-lg"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </main>
  );
}