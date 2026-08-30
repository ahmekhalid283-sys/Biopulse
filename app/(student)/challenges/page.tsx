"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Swords,
  Lock,
  Trophy,
  Users,
  Medal,
  Flame,
  ChevronLeft,
  Sparkles,
  Target,
  Crown,
  Home,
  ArrowRight,
} from "lucide-react";

type Challenge = {
  id: string;
  title: string;
  description: string | null;
  challenge_type: string | null;
  difficulty: string | null;
  status: string | null;
  start_at: string | null;
  end_at: string | null;
};

type MyResult = {
  id: string;
  challenge_id: string;
  percentage: number | null;
  score: number | null;
  total_score: number | null;
  finished_at: string | null;
  challengeTitle: string;
};

type LeaderRow = {
  studentId: string;
  name: string;
  attempts: number;
  bestPercentage: number;
  totalScore: number;
};

type Winner = {
  challengeId: string;
  challengeTitle: string;
  studentName: string;
  studentId: string;
};

type Tab = "challenges" | "my_results" | "leaderboard";

export default function StudentChallengesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [tab, setTab] = useState<Tab>("challenges");
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [myResults, setMyResults] = useState<MyResult[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderRow[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setErrorMsg("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: student } = await supabase
        .from("students")
        .select("id, full_name")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (student) {
        setStudentId(student.id);
        setStudentName(student.full_name || "");
      }

      const { data: setting } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "challenges_enabled")
        .maybeSingle();

      const raw = setting?.value;
      const isEnabled =
        raw === true ||
        raw === "true" ||
        raw === 1 ||
        (typeof raw === "object" && raw !== null);

      const finalEnabled = setting ? !!isEnabled : true;
      setEnabled(finalEnabled);

      if (!finalEnabled) {
        setLoading(false);
        return;
      }

      const { data: challengesData, error: challengesError } = await supabase
        .from("challenges")
        .select(
          "id, title, description, challenge_type, difficulty, status, start_at, end_at"
        )
        .in("status", ["registration", "upcoming", "active"])
        .order("created_at", { ascending: false });

      if (challengesError) {
        setErrorMsg(challengesError.message);
        setChallenges([]);
      } else {
        setChallenges(challengesData || []);
      }

      await Promise.all([
        student?.id ? loadMyResults(student.id) : Promise.resolve(),
        loadLeaderboard(),
        loadWinners(),
      ]);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }

  async function loadMyResults(sid: string) {
    const { data: parts } = await supabase
      .from("challenge_participants")
      .select("id, challenge_id")
      .eq("student_id", sid);

    if (!parts || parts.length === 0) {
      setMyResults([]);
      return;
    }

    const participantIds = parts.map((p) => p.id);
    const challengeIds = parts.map((p) => p.challenge_id);

    const [{ data: attempts }, { data: challengeList }] = await Promise.all([
      supabase
        .from("challenge_attempts")
        .select(
          "id, challenge_id, participant_id, score, total_score, percentage, finished_at"
        )
        .in("participant_id", participantIds)
        .order("finished_at", { ascending: false }),
      supabase.from("challenges").select("id, title").in("id", challengeIds),
    ]);

    const titleMap = new Map((challengeList || []).map((c) => [c.id, c.title]));
    const bestByChallenge = new Map<string, MyResult>();

    for (const a of attempts || []) {
      const prev = bestByChallenge.get(a.challenge_id);
      const pct = Number(a.percentage || 0);
      if (!prev || pct > Number(prev.percentage || 0)) {
        bestByChallenge.set(a.challenge_id, {
          id: a.id,
          challenge_id: a.challenge_id,
          percentage: a.percentage,
          score: a.score,
          total_score: a.total_score,
          finished_at: a.finished_at,
          challengeTitle: titleMap.get(a.challenge_id) || "تحدي",
        });
      }
    }

    setMyResults(Array.from(bestByChallenge.values()));
  }

  async function loadLeaderboard() {
    const { data: attempts } = await supabase
      .from("challenge_attempts")
      .select("participant_id, score, total_score, percentage")
      .not("finished_at", "is", null)
      .limit(500);

    if (!attempts || attempts.length === 0) {
      setLeaderboard([]);
      return;
    }

    const participantIds = [
      ...new Set(attempts.map((a) => a.participant_id).filter(Boolean)),
    ];

    const { data: parts } = await supabase
      .from("challenge_participants")
      .select("id, student_id")
      .in("id", participantIds);

    const partToStudent = new Map(
      (parts || []).map((p) => [p.id, p.student_id])
    );

    const studentIds = [
      ...new Set([...partToStudent.values()].filter(Boolean)),
    ];

    const { data: students } = await supabase
      .from("students")
      .select("id, full_name")
      .in("id", studentIds);

    const nameMap = new Map(
      (students || []).map((s) => [s.id, s.full_name || "طالب"])
    );

    const stats = new Map<string, LeaderRow>();

    for (const a of attempts) {
      const sid = partToStudent.get(a.participant_id);
      if (!sid) continue;

      const prev = stats.get(sid) || {
        studentId: sid,
        name: nameMap.get(sid) || "طالب",
        attempts: 0,
        bestPercentage: 0,
        totalScore: 0,
      };

      prev.attempts += 1;
      prev.bestPercentage = Math.max(
        prev.bestPercentage,
        Number(a.percentage || 0)
      );
      prev.totalScore += Number(a.score || 0);
      stats.set(sid, prev);
    }

    const sorted = Array.from(stats.values()).sort((a, b) => {
      if (b.bestPercentage !== a.bestPercentage) {
        return b.bestPercentage - a.bestPercentage;
      }
      return b.totalScore - a.totalScore;
    });

    setLeaderboard(sorted.slice(0, 20));
  }

  async function loadWinners() {
    const { data: finished } = await supabase
      .from("challenges")
      .select("id, title")
      .eq("status", "finished")
      .order("updated_at", { ascending: false })
      .limit(10);

    if (!finished?.length) {
      setWinners([]);
      return;
    }

    const ids = finished.map((c) => c.id);

    const { data: parts } = await supabase
      .from("challenge_participants")
      .select("challenge_id, student_id, final_rank")
      .in("challenge_id", ids)
      .eq("final_rank", 1);

    if (!parts?.length) {
      setWinners([]);
      return;
    }

    const studentIds = [...new Set(parts.map((p) => p.student_id))];
    const { data: students } = await supabase
      .from("students")
      .select("id, full_name")
      .in("id", studentIds);

    const nameMap = new Map(
      (students || []).map((s) => [s.id, s.full_name || "فائز"])
    );
    const titleMap = new Map(finished.map((c) => [c.id, c.title]));

    setWinners(
      parts.map((p) => ({
        challengeId: p.challenge_id,
        challengeTitle: titleMap.get(p.challenge_id) || "تحدي",
        studentId: p.student_id,
        studentName: nameMap.get(p.student_id) || "فائز",
      }))
    );
  }

  const myRank = useMemo(() => {
    if (!studentId) return null;
    const index = leaderboard.findIndex((r) => r.studentId === studentId);
    return index >= 0 ? index + 1 : null;
  }, [leaderboard, studentId]);

  const statsCards = useMemo(() => {
    const played = myResults.length;
    const avg =
      played === 0
        ? 0
        : myResults.reduce((s, r) => s + Number(r.percentage || 0), 0) /
          played;
    const best =
      played === 0
        ? 0
        : Math.max(...myResults.map((r) => Number(r.percentage || 0)));
    return { played, avg: Number(avg.toFixed(1)), best };
  }, [myResults]);

  function statusLabel(status: string | null) {
    if (status === "registration") return "متاح الآن";
    if (status === "active") return "جاري";
    if (status === "upcoming") return "قريبًا";
    return status || "";
  }

  function statusClass(status: string | null) {
    if (status === "active") return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
    if (status === "registration") return "bg-cyan-500/15 text-cyan-400 border-cyan-500/20";
    return "bg-violet-500/15 text-violet-400 border-violet-500/20";
  }

  function difficultyClass(diff: string | null) {
    if (diff === "سهل") return "bg-emerald-500/15 text-emerald-400";
    if (diff === "صعب" || diff === "تحدي كبير") return "bg-red-500/15 text-red-400";
    return "bg-amber-500/15 text-amber-400";
  }

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#050b14] text-white"
      >
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          <p className="mt-4 text-sm text-slate-400">جاري تحميل التحديات...</p>
        </div>
      </main>
    );
  }

  if (!enabled) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen flex-col items-center justify-center bg-[#050b14] p-6 text-white"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-800 text-slate-400">
          <Lock className="h-10 w-10" />
        </div>
        <h1 className="mt-6 text-2xl font-bold">التحديات مقفلة حاليًا</h1>
        <p className="mt-2 text-slate-400">سيتم فتحها قريبًا من إدارة المنصة</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-bold text-slate-950"
        >
          <Home className="h-4 w-4" />
          الصفحة الرئيسية
        </button>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#050b14] p-4 text-white sm:p-6 lg:p-8"
    >
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2.5 text-sm font-bold text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-400"
          >
            <ArrowRight className="h-4 w-4" />
            الصفحة الرئيسية
          </button>

          <div className="hidden items-center gap-2 text-xs font-bold text-slate-500 sm:flex">
            <Home className="h-3.5 w-3.5" />
            <span>لوحة الطالب</span>
            <ChevronLeft className="h-3.5 w-3.5" />
            <span className="text-cyan-400">التحديات</span>
          </div>
        </div>

        {/* Hero */}
        <section className="relative overflow-hidden rounded-[28px] border border-white/5 bg-[#0a1220] p-6 sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.10),transparent_35%)]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/20">
                <Swords className="h-8 w-8" />
              </div>
              <div>
                <div className="mb-1 flex items-center gap-2 text-xs font-bold text-cyan-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  ساحة التنافس
                </div>
                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                  تحديات BioPulse
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-7 text-slate-400">
                  {studentName ? `مرحبًا ${studentName} — ` : ""}
                  نافس، حلّ، وتصدر لوحة الأبطال.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <MiniStat icon={Target} label="شاركت" value={statsCards.played} />
              <MiniStat icon={Flame} label="أفضل نتيجة" value={`${statsCards.best}%`} />
              <MiniStat icon={Crown} label="ترتيبك" value={myRank ? `#${myRank}` : "—"} />
            </div>
          </div>
        </section>

        {/* Winners */}
        {winners.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-amber-300">🏆 أبطال التحديات</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {winners.slice(0, 4).map((w) => (
                <div
                  key={`${w.challengeId}-${w.studentId}`}
                  className="relative overflow-hidden rounded-3xl border border-amber-400/25 bg-gradient-to-l from-amber-500/10 via-[#0b1220] to-[#0b1220] p-5"
                >
                  <div className="pointer-events-none absolute -left-8 -top-8 h-28 w-28 animate-pulse rounded-full bg-amber-400/20 blur-2xl" />
                  <div className="relative flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-yellow-500 text-2xl shadow-lg shadow-amber-500/30">
                      👑
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-300/90">الفائز</p>
                      <h3 className="text-xl font-black text-white">{w.studentName}</h3>
                      <p className="mt-1 text-sm text-slate-400">{w.challengeTitle}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-800 bg-[#0a1220] p-2">
          {[
            { key: "challenges", label: "التحديات", icon: Swords },
            { key: "my_results", label: "نتائجي", icon: Medal },
            { key: "leaderboard", label: "لوحة المتصدرين", icon: Trophy },
          ].map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key as Tab)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                  active
                    ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20"
                    : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {errorMsg}
          </div>
        )}

        {/* Challenges */}
        {tab === "challenges" && (
          <section className="space-y-5">
            {challenges.length === 0 ? (
              <EmptyState
                title="لا توجد تحديات متاحة"
                subtitle="تابعنا قريبًا لمزيد من المنافسات"
              />
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {challenges.map((challenge, index) => {
                  const myBest = myResults.find(
                    (r) => r.challenge_id === challenge.id
                  );

                  return (
                    <article
                      key={challenge.id}
                      className="group relative flex flex-col overflow-hidden rounded-[24px] border border-slate-800 bg-[#0a1220] p-5 transition hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/5"
                    >
                      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-l from-cyan-400 via-blue-500 to-transparent opacity-80" />

                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-400">
                            <Swords className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-slate-500">
                              تحدي #{index + 1}
                            </p>
                            <h3 className="text-lg font-bold leading-7">
                              {challenge.title}
                            </h3>
                          </div>
                        </div>

                        {challenge.difficulty && (
                          <span
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${difficultyClass(
                              challenge.difficulty
                            )}`}
                          >
                            {challenge.difficulty}
                          </span>
                        )}
                      </div>

                      <p className="mb-4 line-clamp-2 min-h-[40px] flex-1 text-sm leading-6 text-slate-400">
                        {challenge.description ||
                          "ادخل التحدي الآن واختبر مستواك."}
                      </p>

                      <div className="mb-5 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-slate-300">
                          <Users className="h-3.5 w-3.5" />
                          {challenge.challenge_type === "team" ? "جماعي" : "فردي"}
                        </span>
                        <span
                          className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold ${statusClass(
                            challenge.status
                          )}`}
                        >
                          {statusLabel(challenge.status)}
                        </span>
                        {myBest && (
                          <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
                            نتيجتك: {Number(myBest.percentage || 0)}%
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() =>
                          router.push(`/challenges/${challenge.id}`)
                        }
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 py-3 text-sm font-bold text-slate-950 transition group-hover:bg-cyan-400"
                      >
                        الدخول للتحدي
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* My Results */}
        {tab === "my_results" && (
          <section className="space-y-4">
            {myResults.length === 0 ? (
              <EmptyState
                title="لا توجد نتائج بعد"
                subtitle="شارك في تحدي لتظهر نتائجك هنا"
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {myResults.map((result) => (
                  <div
                    key={result.id}
                    className="rounded-2xl border border-slate-800 bg-[#0a1220] p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold">
                          {result.challengeTitle}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {result.finished_at
                            ? new Date(result.finished_at).toLocaleString("ar-EG")
                            : "—"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-cyan-500/15 px-3 py-2 text-center">
                        <p className="text-xl font-black text-cyan-400">
                          {Number(result.percentage || 0)}%
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-slate-950/60 p-3">
                        <p className="text-[11px] text-slate-500">الدرجة</p>
                        <p className="mt-1 font-bold">
                          {result.score ?? 0}/{result.total_score ?? 0}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          router.push(`/challenges/${result.challenge_id}`)
                        }
                        className="rounded-xl bg-slate-800 p-3 text-sm font-bold text-cyan-400 hover:bg-slate-700"
                      >
                        فتح التحدي
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Leaderboard */}
        {tab === "leaderboard" && (
          <section className="space-y-4">
            {leaderboard.length === 0 ? (
              <EmptyState
                title="لوحة المتصدرين فارغة"
                subtitle="لما الطلاب يبدأوا التحديات هتظهر الترتيبات هنا"
              />
            ) : (
              <div className="overflow-hidden rounded-3xl border border-slate-800 bg-[#0a1220]">
                <div className="border-b border-slate-800 p-5">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-5 w-5 text-amber-400" />
                    <h2 className="text-lg font-bold">أفضل 20 منافس</h2>
                  </div>
                </div>

                <div className="divide-y divide-slate-800">
                  {leaderboard.map((row, index) => {
                    const isMe = row.studentId === studentId;
                    const medal =
                      index === 0
                        ? "🥇"
                        : index === 1
                          ? "🥈"
                          : index === 2
                            ? "🥉"
                            : `#${index + 1}`;

                    return (
                      <div
                        key={row.studentId}
                        className={`flex items-center justify-between gap-3 px-5 py-4 ${
                          isMe ? "bg-cyan-500/10" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-sm font-black">
                            {medal}
                          </div>
                          <div>
                            <p className="font-bold">
                              {row.name}
                              {isMe && (
                                <span className="mr-2 text-xs text-cyan-400">
                                  (أنت)
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-500">
                              {row.attempts} محاولة
                            </p>
                          </div>
                        </div>

                        <div className="text-left">
                          <p className="text-lg font-black text-cyan-400">
                            {row.bestPercentage.toFixed(1)}%
                          </p>
                          <p className="text-xs text-slate-500">
                            مجموع النقاط: {row.totalScore}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string | number;
}) {
  return (
    <div className="min-w-[90px] rounded-2xl border border-white/5 bg-black/25 px-3 py-3 backdrop-blur">
      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-700 bg-[#0a1220] p-16 text-center">
      <Trophy className="mx-auto h-12 w-12 text-slate-600" />
      <h2 className="mt-4 text-xl font-bold">{title}</h2>
      <p className="mt-2 text-slate-500">{subtitle}</p>
    </div>
  );
}