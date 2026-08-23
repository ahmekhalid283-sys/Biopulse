"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import {
  Trophy,
  Plus,
  RefreshCw,
  CalendarDays,
  Users,
  User,
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
  challenge_type: "individual" | "team";
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
  min_team_size: number | null;
  max_team_size: number | null;
  created_at: string;
  real_questions_count?: number; // العدد الحقيقي
};

export default function AdminChallengesPage() {
  const router = useRouter();

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [challengesEnabled, setChallengesEnabled] = useState<boolean>(true);
  const [togglingStatus, setTogglingStatus] = useState<boolean>(false);

  const [filter, setFilter] = useState<"all" | "individual" | "team">("all");

  async function loadChallenges() {
    try {
      setRefreshing(true);

      let query = supabase
        .from("challenges")
        .select(`
          *,
          questions(count)
        `)
        .order("created_at", { ascending: false })
        .limit(20);

      if (filter !== "all") {
        query = query.eq("challenge_type", filter);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Challenges load error:", JSON.stringify(error, null, 2));

        alert(
          [
            `الكود: ${error.code || "غير معروف"}`,
            `الرسالة: ${error.message || "غير معروفة"}`,
            `التفاصيل: ${error.details || "لا توجد"}`,
            `التلميح: ${error.hint || "لا يوجد"}`,
          ].join("\n")
        );

        return;
      }

      // نحول البيانات عشان ناخد العدد الحقيقي
      const formatted = (data || []).map((item: any) => ({
        ...item,
        real_questions_count: item.questions?.[0]?.count ?? 0,
      }));

      setChallenges(formatted);
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
  }, [filter]);

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
      alert(next ? "تم فتح التحديات للطلاب بنجاح" : "تم قفل التحديات بنجاح");
    } finally {
      setTogglingStatus(false);
    }
  }

  async function deleteChallenge(id: string) {
    const confirmed = confirm(
      "هل أنت متأكد من حذف هذا التحدي؟\n\nلن يتم حذف سجل العمليات المرتبط به."
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);

      const { error } = await supabase
        .from("challenges")
        .delete()
        .eq("id", id);

      if (error) {
        console.error(error);
        alert(error.message);
        return;
      }

      setChallenges((prev) => prev.filter((challenge) => challenge.id !== id));
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

    const registrationStart = challenge.registration_start
      ? new Date(challenge.registration_start)
      : null;

    const registrationEnd = challenge.registration_end
      ? new Date(challenge.registration_end)
      : null;

    const start = challenge.start_at ? new Date(challenge.start_at) : null;
    const end = challenge.end_at ? new Date(challenge.end_at) : null;

    if (challenge.status === "cancelled") {
      return { label: "ملغي", className: "bg-red-50 text-red-600" };
    }

    if (end && now > end) {
      return { label: "منتهي", className: "bg-slate-100 text-slate-600" };
    }

    if (start && now >= start && (!end || now <= end)) {
      return { label: "جاري الآن", className: "bg-emerald-50 text-emerald-600" };
    }

    if (
      registrationStart &&
      now >= registrationStart &&
      (!registrationEnd || now <= registrationEnd)
    ) {
      return { label: "التسجيل مفتوح", className: "bg-cyan-50 text-cyan-600" };
    }

    if (registrationStart && now < registrationStart) {
      return { label: "قادم", className: "bg-violet-50 text-violet-600" };
    }

    return { label: "مسودة", className: "bg-amber-50 text-amber-600" };
  }

  function getChallengeType(challenge: Challenge) {
    if (challenge.challenge_type === "team") {
      return {
        label: "جماعي",
        icon: Users,
        className: "bg-violet-50 text-violet-600",
      };
    }

    return {
      label: "فردي",
      icon: User,
      className: "bg-blue-50 text-blue-600",
    };
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f8fa] p-6 sm:p-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        {/* Header */}
        <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
              <span>BioPulse</span>
              <ChevronLeft className="h-4 w-4" />
              <span>لوحة الإدارة</span>
              <ChevronLeft className="h-4 w-4" />
              <span>تحديات BioPulse</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-cyan-400 shadow-sm">
                <Trophy className="h-6 w-6" />
              </div>

              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-950">
                  إدارة تحديات BioPulse
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  إنشاء وإدارة البطولات والجولات والأسئلة والنتائج.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={toggleChallenges}
              disabled={togglingStatus}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm transition disabled:opacity-50 ${
                challengesEnabled
                  ? "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                  : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              {challengesEnabled ? (
                <>
                  <Lock className="h-4 w-4" />
                  قفل التحديات عن الطلاب
                </>
              ) : (
                <>
                  <Unlock className="h-4 w-4" />
                  فتح التحديات للطلاب
                </>
              )}
            </button>

            <button
              onClick={loadChallenges}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              تحديث
            </button>

            <button
              onClick={() => router.push("/admin/challenges/new")}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              إنشاء تحدي
            </button>
          </div>
        </section>

        {/* Filters */}
        <section className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
              filter === "all"
                ? "bg-slate-950 text-white"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            جميع التحديات
          </button>

          <button
            onClick={() => setFilter("individual")}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
              filter === "individual"
                ? "bg-blue-600 text-white"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            التحديات الفردية
          </button>

          <button
            onClick={() => setFilter("team")}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
              filter === "team"
                ? "bg-violet-600 text-white"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            التحديات الجماعية
          </button>
        </section>

        {/* Loading / Empty / Data */}
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm">
            <RefreshCw className="mx-auto h-7 w-7 animate-spin text-cyan-500" />
            <p className="mt-4 text-sm font-bold text-slate-500">
              جاري تحميل التحديات...
            </p>
          </div>
        ) : challenges.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Trophy className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-lg font-black text-slate-900">
              لا توجد تحديات حتى الآن
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              ابدأ بإنشاء أول تحدي في BioPulse.
            </p>
            <button
              onClick={() => router.push("/admin/challenges/new")}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              إنشاء أول تحدي
            </button>
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {challenges.map((challenge) => {
              const status = getStatus(challenge);
              const type = getChallengeType(challenge);
              const TypeIcon = type.icon;

              return (
                <article
                  key={challenge.id}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  {/* Card Header */}
                  <div className="border-b border-slate-100 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                          <Trophy className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h2 className="truncate text-lg font-black text-slate-950">
                            {challenge.title}
                          </h2>
                          <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
                            {challenge.description ||
                              "لا يوجد وصف لهذا التحدي."}
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
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${type.className}`}
                      >
                        <TypeIcon className="h-3.5 w-3.5" />
                        تحدي {type.label}
                      </span>

                      {challenge.difficulty && (
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                          {challenge.difficulty}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-px bg-slate-100">
                    <InfoBox
                      icon={ClipboardList}
                      label="الأسئلة"
                      value={challenge.real_questions_count ?? 0}
                    />
                    <InfoBox
                      icon={Clock}
                      label="المدة"
                      value={
                        challenge.duration_minutes
                          ? `${challenge.duration_minutes} دقيقة`
                          : "غير محددة"
                      }
                    />
                    <InfoBox
                      icon={CalendarDays}
                      label="البداية"
                      value={formatDate(challenge.start_at)}
                    />
                    <InfoBox
                      icon={Users}
                      label="الفريق"
                      value={
                        challenge.challenge_type === "team"
                          ? `${challenge.min_team_size ?? 1} - ${
                              challenge.max_team_size ?? 4
                            }`
                          : "—"
                      }
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 border-t border-slate-100 p-4">
                    <button
                      onClick={() =>
                        router.push(`/admin/challenges/${challenge.id}`)
                      }
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                    >
                      <Eye className="h-4 w-4" />
                      إدارة التحدي
                    </button>

                    <button
                      onClick={() =>
                        router.push(`/admin/challenges/${challenge.id}/edit`)
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      <Pencil className="h-4 w-4" />
                      تعديل
                    </button>

                    <button
                      onClick={() => deleteChallenge(challenge.id)}
                      disabled={deletingId === challenge.id}
                      className="inline-flex items-center justify-center rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
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
    <div className="bg-white p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-400" />
        <span className="text-xs font-semibold text-slate-400">{label}</span>
      </div>
      <p className="mt-2 text-sm font-black text-slate-800">{value}</p>
    </div>
  );
}