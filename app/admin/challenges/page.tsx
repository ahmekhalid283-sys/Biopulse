"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import {
  Trophy,
  Plus,
  RefreshCw,
  CalendarDays,
  Clock,
  ChevronLeft,
  Eye,
  Pencil,
  Trash2,
  ClipboardList,
  Lock,
  Unlock,
} from "lucide-react";

type Challenge = {
  id: string;
  title: string;
  description: string | null;
  challenge_type: string | null;
  difficulty: string | null;
  status: string | null;
  registration_start: string | null;
  registration_end: string | null;
  start_at: string | null;
  end_at: string | null;
  duration_minutes: number | null;
  questions_count: number | null;
  passing_score: number | null;
  allow_retake: boolean;
  public_results: boolean;
  show_leaderboard: boolean;
  created_at: string;
  total_rounds?: number | null;
};

export default function AdminChallengesPage() {
  const router = useRouter();

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [challengesEnabled, setChallengesEnabled] = useState<boolean>(true);
  const [togglingStatus, setTogglingStatus] = useState<boolean>(false);

  async function loadChallenges() {
    try {
      setRefreshing(true);

      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error(error);
        alert(error.message);
        return;
      }

      setChallenges(data || []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadPlatformStatus() {
    const { data } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "challenges_enabled")
      .maybeSingle();

    if (data) {
      setChallengesEnabled(data.value === true || data.value === "true");
    }
  }

  useEffect(() => {
    loadChallenges();
    loadPlatformStatus();
  }, []);

  async function toggleChallenges() {
    try {
      setTogglingStatus(true);
      const next = !challengesEnabled;

      const { error } = await supabase
        .from("platform_settings")
        .upsert({ key: "challenges_enabled", value: next });

      if (error) {
        alert("حدث خطأ أثناء تحديث حالة التحديات: " + error.message);
        return;
      }

      setChallengesEnabled(next);
      alert(next ? "تم فتح التحديات للطلاب" : "تم قفل التحديات");
    } finally {
      setTogglingStatus(false);
    }
  }

  async function deleteChallenge(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا التحدي؟")) return;

    try {
      setDeletingId(id);

      await supabase.from("challenge_rounds").delete().eq("challenge_id", id);

      const { error } = await supabase.from("challenges").delete().eq("id", id);

      if (error) {
        alert(error.message);
        return;
      }

      setChallenges((prev) => prev.filter((c) => c.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  function formatDate(value: string | null) {
    if (!value) return "غير محدد";
    return new Intl.DateTimeFormat("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  }

  function getStatus(challenge: Challenge) {
    const now = new Date();
    const start = challenge.start_at ? new Date(challenge.start_at) : null;
    const end = challenge.end_at ? new Date(challenge.end_at) : null;

    if (challenge.status === "cancelled") {
      return { label: "ملغي", className: "bg-red-500/15 text-red-400" };
    }
    if (end && now > end) {
      return { label: "منتهي", className: "bg-slate-500/20 text-slate-400" };
    }
    if (start && now >= start && (!end || now <= end)) {
      return {
        label: "جاري الآن",
        className: "bg-emerald-500/15 text-emerald-400",
      };
    }
    if (challenge.status === "draft") {
      return { label: "مسودة", className: "bg-amber-500/15 text-amber-400" };
    }
    return { label: "قادم", className: "bg-violet-500/15 text-violet-400" };
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#070b14] p-6 text-white sm:p-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
              <span className="text-blue-400">BioPulse</span>
              <ChevronLeft className="h-4 w-4" />
              <span>لوحة الإدارة</span>
              <ChevronLeft className="h-4 w-4" />
              <span>التحديات</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  إدارة تحديات BioPulse
                </h1>
                <p className="mt-1 text-sm text-slate-400">
                  تحديات فردية — إنشاء وإدارة البطولات والتصفيات
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={toggleChallenges}
              disabled={togglingStatus}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:opacity-50 ${
                challengesEnabled
                  ? "border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                  : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
              }`}
            >
              {challengesEnabled ? (
                <>
                  <Lock className="h-4 w-4" />
                  قفل عن الطلاب
                </>
              ) : (
                <>
                  <Unlock className="h-4 w-4" />
                  فتح للطلاب
                </>
              )}
            </button>

            <button
              onClick={loadChallenges}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-slate-800 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              تحديث
            </button>

            <button
              onClick={() => router.push("/admin/challenges/new")}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-500"
            >
              <Plus className="h-4 w-4" />
              إنشاء تحدي
            </button>
          </div>
        </section>

        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-16 text-center">
            <RefreshCw className="mx-auto h-7 w-7 animate-spin text-blue-500" />
            <p className="mt-4 text-sm font-bold text-slate-400">
              جاري تحميل التحديات...
            </p>
          </div>
        ) : challenges.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-16 text-center">
            <Trophy className="mx-auto h-10 w-10 text-slate-600" />
            <h2 className="mt-5 text-lg font-bold">لا توجد تحديات حتى الآن</h2>
            <p className="mt-2 text-sm text-slate-500">
              ابدأ بإنشاء أول تحدي في BioPulse
            </p>
            <button
              onClick={() => router.push("/admin/challenges/new")}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-500"
            >
              <Plus className="h-4 w-4" />
              إنشاء أول تحدي
            </button>
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {challenges.map((challenge) => {
              const status = getStatus(challenge);

              return (
                <article
                  key={challenge.id}
                  className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 transition hover:border-slate-700"
                >
                  <div className="border-b border-slate-800 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
                          <Trophy className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h2 className="truncate text-lg font-bold text-white">
                            {challenge.title}
                          </h2>
                          <p className="mt-1 line-clamp-2 text-sm text-slate-400">
                            {challenge.description || "لا يوجد وصف"}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-bold ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {challenge.difficulty && (
                        <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-400">
                          {challenge.difficulty}
                        </span>
                      )}

                      {(challenge.total_rounds || 0) > 1 && (
                        <span className="rounded-lg bg-cyan-500/15 px-2.5 py-1 text-xs font-bold text-cyan-400">
                          تصفيات ({challenge.total_rounds} أدوار)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-px bg-slate-800">
                    <InfoBox
                      icon={Clock}
                      label="المدة"
                      value={
                        challenge.duration_minutes
                          ? `${challenge.duration_minutes} د`
                          : "—"
                      }
                    />
                    <InfoBox
                      icon={Trophy}
                      label="النجاح"
                      value={
                        challenge.passing_score
                          ? `${challenge.passing_score}%`
                          : "—"
                      }
                    />
                    <InfoBox
                      icon={CalendarDays}
                      label="البداية"
                      value={formatDate(challenge.start_at)}
                    />
                    <InfoBox
                      icon={ClipboardList}
                      label="الأسئلة"
                      value={challenge.questions_count ?? "—"}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 border-t border-slate-800 p-4">
                    <button
                      onClick={() =>
                        router.push(`/admin/challenges/${challenge.id}`)
                      }
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-500"
                    >
                      <Eye className="h-4 w-4" />
                      إدارة
                    </button>

                    <button
                      onClick={() =>
                        router.push(`/admin/challenges/${challenge.id}/edit`)
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-slate-800"
                    >
                      <Pencil className="h-4 w-4" />
                      تعديل
                    </button>

                    <button
                      onClick={() => deleteChallenge(challenge.id)}
                      disabled={deletingId === challenge.id}
                      className="inline-flex items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}

function InfoBox({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-[#070b14] p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-500" />
        <span className="text-xs font-semibold text-slate-500">{label}</span>
      </div>
      <p className="mt-2 text-sm font-bold text-white">{value}</p>
    </div>
  );
}