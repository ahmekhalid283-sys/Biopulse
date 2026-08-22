"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Send,
  User,
  MessageCircle,
  Clock3,
  RefreshCw,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type Student = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
};

type Message = {
  id: string;
  student_id: string;
  sender_type: "student" | "admin";
  message: string;
  created_at: string;
  admin_read: boolean;
  image_url: string | null;
};

export default function AdminSupportPage() {
  const { studentId } = useParams<{ studentId: string }>();

  const [student, setStudent] = useState<Student | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
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

    const { data: messagesData, error: messagesError } = await supabase
      .from("support_messages")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error(messagesError);
    } else {
      setMessages(messagesData || []);
    }

    // تعليم رسائل الطالب كمقروءة
    await supabase
      .from("support_messages")
      .update({ admin_read: true })
      .eq("student_id", studentId)
      .eq("sender_type", "student")
      .eq("admin_read", false);

    setLoading(false);
  }

  async function sendMessage() {
    const text = message.trim();

    if (!text) return;

    setSending(true);

    const { data, error } = await supabase
      .from("support_messages")
      .insert({
        student_id: studentId,
        sender_type: "admin",
        message: text,
        admin_read: true,
        image_url: null,
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
      setMessages((prev) => [...prev, data]);
    }

    setMessage("");
    setSending(false);
  }

  if (loading) {
    return (
      <main dir="rtl" className="min-h-screen bg-[#070b14] p-6 lg:p-10">
        <div className="w-full">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-800" />
          <div className="mt-6 h-[600px] animate-pulse rounded-2xl bg-slate-900/50" />
        </div>
      </main>
    );
  }

  if (!student) {
    return (
      <main dir="rtl" className="min-h-screen bg-[#070b14] p-6 lg:p-10">
        <div className="w-full">
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-10 text-center">
            <h2 className="text-2xl font-bold text-red-400">
              الطالب غير موجود
            </h2>

            <Link
              href="/admin/students"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
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
    <main dir="rtl" className="min-h-screen bg-[#070b14] text-white">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <MessageCircle className="h-7 w-7" />
            </div>

            <div>
              <p className="text-sm font-bold text-blue-400">الدعم العلمي</p>
              <h1 className="text-2xl font-bold sm:text-3xl">مراسلة الطالب</h1>
              <p className="mt-1 text-sm text-slate-400">{student.full_name}</p>
            </div>
          </div>

          <Link
            href={`/admin/students/${studentId}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-5 py-3 text-sm font-bold text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
          >
            <ArrowRight className="h-4 w-4" />
            الرجوع للطالب
          </Link>
        </div>

        {/* Student Info */}
        <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <img
            src={student.avatar_url || "/images/default-avatar.png"}
            alt=""
            className="h-14 w-14 rounded-2xl object-cover"
          />

          <div>
            <h2 className="font-bold text-white">{student.full_name}</h2>
            <p className="mt-1 text-sm text-slate-400">
              {student.email || student.phone || "لا توجد بيانات"}
            </p>
          </div>
        </div>

        {/* Chat */}
        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 shadow-xl">
          {/* Chat Header */}
          <div className="flex items-center gap-3 border-b border-slate-800 bg-slate-900/80 px-5 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
              <MessageCircle className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-bold text-white">الدعم العلمي</h2>
              <p className="text-xs text-slate-400">
                المحادثة مع {student.full_name}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="h-[500px] space-y-4 overflow-y-auto bg-[#070b14] p-5">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
                  <MessageCircle className="h-8 w-8" />
                </div>

                <h3 className="font-bold text-white">لا توجد رسائل</h3>
                <p className="mt-1 text-sm text-slate-500">
                  ابدأ المحادثة مع الطالب.
                </p>
              </div>
            ) : (
              messages.map((item) => {
                const isAdmin = item.sender_type === "admin";

                return (
                  <div
                    key={item.id}
                    className={`flex ${isAdmin ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                        isAdmin
                          ? "rounded-tl-md bg-blue-600 text-white"
                          : "rounded-tr-md border border-slate-700 bg-slate-800 text-slate-100"
                      }`}
                    >
                      <div className="mb-1 flex items-center gap-2 text-xs font-bold opacity-70">
                        <User className="h-3.5 w-3.5" />
                        {isAdmin ? "الإدارة" : student.full_name}
                      </div>

                      <p className="whitespace-pre-wrap text-sm leading-7">
                        {item.message}
                      </p>

                      <div className="mt-2 flex items-center gap-1 text-[10px] opacity-60">
                        <Clock3 className="h-3 w-3" />
                        {new Date(item.created_at).toLocaleString("ar-EG")}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Send */}
          <div className="border-t border-slate-800 bg-slate-900/80 p-4">
            <div className="flex gap-3">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="اكتب رسالتك للطالب..."
                rows={2}
                className="min-h-[55px] flex-1 resize-none rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />

              <button
                type="button"
                onClick={sendMessage}
                disabled={sending || !message.trim()}
                className="flex h-[55px] w-[55px] shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Enter للإرسال — Shift + Enter لسطر جديد
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}