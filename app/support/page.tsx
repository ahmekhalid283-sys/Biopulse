"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  MessageCircle,
  Send,
  User,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Message = {
  id: string;
  student_id: string;
  sender_type: "student" | "admin";
  message: string;
  image_url?: string | null;
  created_at: string;
};

export default function SupportPage() {
  const router = useRouter();

  const [studentId, setStudentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [selectedImage, setSelectedImage] =
    useState<File | null>(null);

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function initialize() {
      try {
        setLoading(true);
        setError("");

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.replace("/login");
          return;
        }

        const { data: student, error: studentError } = await supabase
          .from("students")
          .select("id")
          .eq("auth_id", user.id)
          .maybeSingle();

        if (studentError) {
          console.error("Student lookup error:", studentError);
          setError("تعذر العثور على بيانات الطالب.");
          return;
        }

        if (!student) {
          router.replace("/login");
          return;
        }

        if (cancelled) return;

        setStudentId(student.id);

        await loadMessages(student.id);

        if (cancelled) return;

        const channelName = `support-${student.id}`;

        const existingChannel = supabase
          .getChannels()
          .find(
            (item) =>
              item.topic === `realtime:${channelName}`
          );

        if (existingChannel) {
          await supabase.removeChannel(existingChannel);
        }

        if (cancelled) return;

        channel = supabase
          .channel(channelName)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "support_messages",
              filter: `student_id=eq.${student.id}`,
            },
            (payload) => {
              if (cancelled) return;

              const newMessage =
                payload.new as Message;

              setMessages((prev) => {
                const exists = prev.some(
                  (item) => item.id === newMessage.id
                );

                if (exists) {
                  return prev;
                }

                return [...prev, newMessage];
              });
            }
          )
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              console.log(
                "Support realtime connected"
              );
            }

            if (status === "CHANNEL_ERROR") {
              console.error(
                "Support realtime channel error"
              );
            }

            if (status === "TIMED_OUT") {
              console.error(
                "Support realtime channel timed out"
              );
            }
          });
      } catch (error) {
        console.error(
          "Support initialize error:",
          error
        );

        if (!cancelled) {
          setError(
            "حدث خطأ أثناء فتح الدعم العلمي."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    initialize();

    return () => {
      cancelled = true;

      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
    };
  }, [router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function loadMessages(id: string) {
    const { data, error } = await supabase
      .from("support_messages")
      .select(
        "id, student_id, sender_type, message, image_url, created_at"
      )
      .eq("student_id", id)
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      console.error(
        "Load support messages error:",
        error
      );

      setError("تعذر تحميل المحادثة.");
      return;
    }

    setMessages(data ?? []);
  }

  async function refreshMessages() {
    if (!studentId || refreshing) return;

    try {
      setRefreshing(true);
      await loadMessages(studentId);
    } finally {
      setRefreshing(false);
    }
  }

  async function sendMessage() {
    const text = message.trim();

    if (!studentId || sending) return;

    if (!text && !selectedImage) {
      setError("اكتب رسالة أو اختر صورة.");
      return;
    }

    try {
      setSending(true);
      setError("");

      let imageUrl: string | null = null;

      // رفع الصورة
      if (selectedImage) {
        const fileExt =
          selectedImage.name.split(".").pop()?.toLowerCase() || "jpg";

        const fileName = `${studentId}/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("support-images")
          .upload(fileName, selectedImage, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("Image upload error:", uploadError);
          setError("تعذر رفع الصورة.");
          return;
        }

        const { data } = supabase.storage
          .from("support-images")
          .getPublicUrl(fileName);

        imageUrl = data.publicUrl;
      }

      // حفظ الرسالة
      const { data, error } = await supabase
        .from("support_messages")
        .insert({
          student_id: studentId,
          sender_type: "student",
          message: text,
          image_url: imageUrl,
        })
        .select(
          "id, student_id, sender_type, message, image_url, created_at"
        )
        .single();

      if (error) {
        console.error("Send support message error:", error);
        setError(error.message || "تعذر إرسال الرسالة.");
        return;
      }

      if (data) {
        setMessages((prev) => {
          if (prev.some((item) => item.id === data.id)) {
            return prev;
          }

          return [...prev, data];
        });
      }

      setMessage("");
      setSelectedImage(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Send message error:", error);
      setError("حدث خطأ أثناء إرسال الرسالة.");
    } finally {
      setSending(false);
    }
  }

  function scrollToBottom() {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 50);
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      sendMessage();
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString(
      "ar-EG",
      {
        dateStyle: "short",
        timeStyle: "short",
      }
    );
  }

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#020617] px-4 text-white"
      >
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10">
            <RefreshCw className="h-6 w-6 animate-spin text-cyan-400" />
          </div>

          <p className="text-sm text-slate-400">
            جاري فتح الدعم العلمي...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen overflow-x-hidden bg-[#020617] px-2 py-2 text-white sm:px-4 sm:py-4 md:px-6 md:py-6"
    >
      <div className="mx-auto flex h-[calc(100dvh-1rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-cyan-500/20 bg-[#081321]/95 shadow-2xl shadow-black/40 sm:h-[calc(100dvh-2rem)] sm:rounded-3xl">
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between border-b border-cyan-500/10 bg-slate-950/40 px-3 py-3 sm:px-5 sm:py-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 sm:h-11 sm:w-11 sm:rounded-2xl">
              <MessageCircle className="h-5 w-5 text-cyan-400 sm:h-6 sm:w-6" />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-base font-black text-white sm:text-xl">
                الدعم العلمي
              </h1>

              <p className="truncate text-[10px] text-slate-500 sm:text-xs">
                تواصل مع إدارة المنصة
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              onClick={refreshMessages}
              disabled={refreshing}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300 transition hover:border-cyan-500/30 hover:text-cyan-400 disabled:opacity-50 sm:h-10 sm:w-10"
              aria-label="تحديث المحادثة"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshing
                    ? "animate-spin"
                    : ""
                }`}
              />
            </button>

            <button
              onClick={() =>
                router.push("/dashboard")
              }
              className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-2.5 text-xs font-bold text-slate-300 transition hover:border-cyan-500/30 hover:text-cyan-400 sm:h-10 sm:gap-2 sm:px-4 sm:text-sm"
            >
              <ArrowRight className="h-4 w-4" />

              <span className="hidden xs:inline sm:inline">
                الرئيسية
              </span>
            </button>
          </div>
        </header>

        {/* Error */}
        {error && (
          <div className="shrink-0 border-b border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300 sm:px-5 sm:py-3 sm:text-sm">
            {error}
          </div>
        )}

        {/* Chat */}
        <section className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#050d18] px-2 py-3 sm:px-4 sm:py-5">
          {messages.length === 0 ? (
            <div className="flex min-h-full items-center justify-center px-4">
              <div className="max-w-md text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 sm:mb-5 sm:h-20 sm:w-20 sm:rounded-3xl">
                  <MessageCircle className="h-8 w-8 text-cyan-400 sm:h-10 sm:w-10" />
                </div>

                <h2 className="text-lg font-black text-white sm:text-xl">
                  أهلاً بك في الدعم العلمي 👋
                </h2>

                <p className="mt-2 text-xs leading-6 text-slate-400 sm:mt-3 sm:text-sm">
                  اكتب سؤالك أو المشكلة التي
                  تواجهك، وسيقوم فريق إدارة
                  المنصة بالرد عليك هنا.
                </p>
              </div>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-3xl space-y-3 sm:space-y-4">
              {messages.map((item) => {
                const isStudent =
                  item.sender_type ===
                  "student";

                return (
                  <div
                    key={item.id}
                    className={`flex w-full ${
                      isStudent
                        ? "justify-start"
                        : "justify-end"
                    }`}
                  >
                    <div
                      className={`flex max-w-[92%] items-end gap-1.5 sm:max-w-[75%] sm:gap-2 ${
                        isStudent
                          ? "flex-row"
                          : "flex-row-reverse"
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9 sm:rounded-xl ${
                          isStudent
                            ? "bg-cyan-500/10 text-cyan-400"
                            : "bg-purple-500/10 text-purple-400"
                        }`}
                      >
                        {isStudent ? (
                          <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        ) : (
                          <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        )}
                      </div>

                      {/* Message */}
                      <div
                        className={`min-w-0 rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 ${
                          isStudent
                            ? "rounded-br-md border border-cyan-500/20 bg-cyan-500/10"
                            : "rounded-bl-md border border-purple-500/20 bg-purple-500/10"
                        }`}
                      >
                        {item.image_url && (
                          <a
                            href={item.image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mb-2 block overflow-hidden rounded-xl"
                          >
                            <img
                              src={item.image_url}
                              alt="صورة مرفقة"
                              className="max-h-72 max-w-full rounded-xl object-contain transition hover:opacity-90"
                            />
                          </a>
                        )}

                        <p className="whitespace-pre-wrap break-words text-xs leading-5 text-slate-200 sm:text-sm sm:leading-6">
                          {item.message}
                        </p>

                        <p className="mt-1.5 text-[9px] text-slate-500 sm:mt-2 sm:text-[10px]">
                          {isStudent
                            ? "أنت"
                            : "إدارة المنصة"}{" "}
                          •{" "}
                          {formatDate(
                            item.created_at
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>
          )}
        </section>

        {/* Input */}
        <div className="shrink-0 border-t border-slate-800 bg-slate-950/60 p-2.5 sm:p-4">
          <div className="mx-auto w-full max-w-3xl">
            {selectedImage && (
              <div className="mb-2 flex items-center gap-3 rounded-xl border border-cyan-500/20 bg-slate-800/70 p-2">
                <img
                  src={URL.createObjectURL(selectedImage)}
                  alt="معاينة الصورة"
                  className="h-16 w-16 rounded-lg object-cover"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-300">
                    {selectedImage.name}
                  </p>

                  <p className="text-[10px] text-slate-500">
                    {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedImage(null);

                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                >
                  ×
                </button>
              </div>
            )}

            <div className="flex items-end gap-1.5 rounded-2xl border border-slate-700 bg-slate-900/90 p-1.5 focus-within:border-cyan-500/40 sm:gap-2 sm:p-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];

                  if (!file) return;

                  if (file.size > 5 * 1024 * 1024) {
                    setError("حجم الصورة يجب ألا يتجاوز 5MB.");
                    event.target.value = "";
                    return;
                  }

                  setError("");
                  setSelectedImage(file);
                }}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-400 disabled:opacity-40"
                aria-label="إضافة صورة"
              >
                📷
              </button>

              <textarea
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder="اكتب رسالتك للدعم العلمي..."
                rows={1}
                disabled={sending}
                className="max-h-32 min-h-[42px] flex-1 resize-none bg-transparent px-2.5 py-2.5 text-xs leading-5 text-white outline-none placeholder:text-slate-600 sm:min-h-[46px] sm:px-3 sm:py-3 sm:text-sm"
              />

              <button
                onClick={sendMessage}
                disabled={
                  (!message.trim() && !selectedImage) ||
                  sending
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500 text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40 sm:h-11 sm:w-11"
                aria-label="إرسال الرسالة"
              >
                {sending ? (
                  <RefreshCw className="h-4 w-4 animate-spin sm:h-5 sm:w-5" />
                ) : (
                  <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </button>
            </div>

            <p className="mt-1.5 px-1 text-[9px] text-slate-600 sm:mt-2 sm:px-2 sm:text-[10px]">
              Enter للإرسال • Shift + Enter لسطر جديد
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}