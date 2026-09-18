"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import {
  Swords,
  Lock,
  Trophy,
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

type ChallengeLeaderboard = {
  challengeId: string;
  challengeTitle: string;
  rows: LeaderRow[];
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
  const [leaderboards, setLeaderboards] = useState<
    ChallengeLeaderboard[]
  >([]);
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

      // =========================
      // الطالب
      // =========================

      const { data: student, error: studentError } =
        await supabase
          .from("students")
          .select("id, full_name")
          .eq("auth_id", user.id)
          .maybeSingle();

      if (studentError) {
        console.error("Student error:", studentError);
      }

      if (student) {
        setStudentId(student.id);
        setStudentName(student.full_name || "");
      }

      // =========================
      // تفعيل التحديات
      // =========================

      const { data: setting, error: settingError } =
        await supabase
          .from("platform_settings")
          .select("value")
          .eq("key", "challenges_enabled")
          .maybeSingle();

      if (settingError) {
        console.error(
          "Challenges setting error:",
          settingError
        );
      }

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

      // =========================
      // التحديات
      // =========================

      const {
        data: challengesData,
        error: challengesError,
      } = await supabase
        .from("challenges")
        .select(
          "id, title, description, difficulty, status, start_at, end_at"
        )
        .in("status", [
          "registration",
          "upcoming",
          "active",
        ])
        .order("created_at", { ascending: false });

      if (challengesError) {
        console.error(
          "Challenges error:",
          challengesError
        );

        setErrorMsg("فشل تحميل التحديات");
        setChallenges([]);
      } else {
        setChallenges(challengesData || []);
      }

      // =========================
      // البيانات
      // =========================

      await Promise.all([
        student?.id
          ? loadMyResults(student.id)
          : Promise.resolve(),

        loadLeaderboards(),

        loadWinners(),
      ]);
    } catch (err: any) {
      console.error(
        "Student challenges error:",
        err
      );

      setErrorMsg(
        err?.message ||
          "حدث خطأ غير متوقع"
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // نتائج الطالب
  // ============================================================

  async function loadMyResults(sid: string) {
    const { data: parts, error: partsError } =
      await supabase
        .from("challenge_participants")
        .select("id, challenge_id")
        .eq("student_id", sid);

    if (partsError) {
      console.error(
        "Participants error:",
        partsError
      );

      setMyResults([]);
      return;
    }

    if (!parts || parts.length === 0) {
      setMyResults([]);
      return;
    }

    const participantIds = parts.map(
      (p) => p.id
    );

    const challengeIds = parts.map(
      (p) => p.challenge_id
    );

    const [
      { data: attempts, error: attemptsError },
      { data: challengeList },
    ] = await Promise.all([
      supabase
        .from("challenge_attempts")
        .select(
          "id, challenge_id, participant_id, score, total_score, percentage, finished_at"
        )
        .in("participant_id", participantIds)
        .order("finished_at", {
          ascending: false,
        }),

      supabase
        .from("challenges")
        .select("id, title")
        .in("id", challengeIds),
    ]);

    if (attemptsError) {
      console.error(
        "Attempts error:",
        attemptsError
      );

      setMyResults([]);
      return;
    }

    const titleMap = new Map(
      (challengeList || []).map((c) => [
        c.id,
        c.title,
      ])
    );

    const bestByChallenge =
      new Map<string, MyResult>();

    for (const attempt of attempts || []) {
      const previous =
        bestByChallenge.get(
          attempt.challenge_id
        );

      const percentage = Number(
        attempt.percentage || 0
      );

      if (
        !previous ||
        percentage >
          Number(
            previous.percentage || 0
          )
      ) {
        bestByChallenge.set(
          attempt.challenge_id,
          {
            id: attempt.id,
            challenge_id:
              attempt.challenge_id,
            percentage:
              attempt.percentage,
            score: attempt.score,
            total_score:
              attempt.total_score,
            finished_at:
              attempt.finished_at,
            challengeTitle:
              titleMap.get(
                attempt.challenge_id
              ) || "تحدي",
          }
        );
      }
    }

    setMyResults(
      Array.from(
        bestByChallenge.values()
      )
    );
  }

  // ============================================================
  // لوحة المتصدرين لكل تحدي
  // ============================================================

  async function loadLeaderboards() {
    const {
      data: attempts,
      error: attemptsError,
    } = await supabase
      .from("challenge_attempts")
      .select(
        "participant_id, challenge_id, score, total_score, percentage, finished_at"
      )
      .not("finished_at", "is", null)
      .limit(1000);

    if (attemptsError) {
      console.error(
        "Leaderboard attempts error:",
        attemptsError
      );

      setLeaderboards([]);
      return;
    }

    if (!attempts || attempts.length === 0) {
      setLeaderboards([]);
      return;
    }

    // ----------------------------------------------------------
    // المشاركين
    // ----------------------------------------------------------

    const participantIds = [
      ...new Set(
        attempts
          .map(
            (a) => a.participant_id
          )
          .filter(Boolean)
      ),
    ];

    if (
      participantIds.length === 0
    ) {
      setLeaderboards([]);
      return;
    }

    const {
      data: parts,
      error: partsError,
    } = await supabase
      .from("challenge_participants")
      .select(
        "id, student_id, challenge_id"
      )
      .in("id", participantIds);

    if (partsError) {
      console.error(
        "Leaderboard participants error:",
        partsError
      );

      setLeaderboards([]);
      return;
    }

    const partMap = new Map<
      string,
      {
        studentId: string;
        challengeId: string;
      }
    >();

    for (const p of parts || []) {
      partMap.set(p.id, {
        studentId: p.student_id,
        challengeId:
          p.challenge_id,
      });
    }

    // ----------------------------------------------------------
    // الطلاب
    // ----------------------------------------------------------

    const studentIds = [
      ...new Set(
        [...partMap.values()]
          .map(
            (p) => p.studentId
          )
          .filter(Boolean)
      ),
    ];

    if (studentIds.length === 0) {
      setLeaderboards([]);
      return;
    }

    const {
      data: students,
      error: studentsError,
    } = await supabase
      .from("students")
      .select("id, full_name")
      .in("id", studentIds);

    if (studentsError) {
      console.error(
        "Leaderboard students error:",
        studentsError
      );
    }

    const nameMap = new Map(
      (students || []).map(
        (s) => [
          s.id,
          s.full_name || "طالب",
        ]
      )
    );

    // ----------------------------------------------------------
    // اسماء التحديات
    // ----------------------------------------------------------

    const challengeIds = [
      ...new Set(
        [...partMap.values()]
          .map(
            (p) => p.challengeId
          )
          .filter(Boolean)
      ),
    ];

    const {
      data: challengeList,
      error: challengeError,
    } = await supabase
      .from("challenges")
      .select("id, title")
      .in("id", challengeIds);

    if (challengeError) {
      console.error(
        "Leaderboard challenges error:",
        challengeError
      );
    }

    const challengeNameMap =
      new Map(
        (challengeList || []).map(
          (c) => [
            c.id,
            c.title,
          ]
        )
      );

    // ----------------------------------------------------------
    // تجميع النتائج
    //
    // كل طالب له أفضل نتيجة داخل كل تحدي.
    // ----------------------------------------------------------

    const challengeStats =
      new Map<
        string,
        Map<string, LeaderRow>
      >();

    for (const attempt of attempts) {
      const participant =
        partMap.get(
          attempt.participant_id
        );

      if (!participant) continue;

      const challengeId =
        participant.challengeId;

      const sid =
        participant.studentId;

      if (!challengeId || !sid)
        continue;

      if (
        !challengeStats.has(
          challengeId
        )
      ) {
        challengeStats.set(
          challengeId,
          new Map()
        );
      }

      const studentsMap =
        challengeStats.get(
          challengeId
        )!;

      const percentage =
        Number(
          attempt.percentage || 0
        );

      const score = Number(
        attempt.score || 0
      );

      const previous =
        studentsMap.get(sid);

      // أفضل محاولة للطالب في التحدي
      if (!previous) {
        studentsMap.set(
          sid,
          {
            studentId: sid,
            name:
              nameMap.get(sid) ||
              "طالب",
            attempts: 1,
            bestPercentage:
              percentage,
            totalScore: score,
          }
        );
      } else {
        previous.attempts += 1;

        if (
          percentage >
            previous.bestPercentage ||
          (percentage ===
            previous.bestPercentage &&
            score >
              previous.totalScore)
        ) {
          previous.bestPercentage =
            percentage;

          previous.totalScore =
            score;
        }
      }
    }

    // ----------------------------------------------------------
    // ترتيب كل تحدي
    // ----------------------------------------------------------

    const result: ChallengeLeaderboard[] =
      [];

    for (const [
      challengeId,
      studentsMap,
    ] of challengeStats.entries()) {
      const rows = Array.from(
        studentsMap.values()
      ).sort((a, b) => {
        if (
          b.bestPercentage !==
          a.bestPercentage
        ) {
          return (
            b.bestPercentage -
            a.bestPercentage
          );
        }

        return (
          b.totalScore -
          a.totalScore
        );
      });

      result.push({
        challengeId,
        challengeTitle:
          challengeNameMap.get(
            challengeId
          ) || "تحدي",
        rows: rows.slice(0, 20),
      });
    }

    // ترتيب التحديات حسب ترتيب ظهورها
    result.sort((a, b) =>
      a.challengeTitle.localeCompare(
        b.challengeTitle,
        "ar"
      )
    );

    setLeaderboards(result);
  }

  // ============================================================
  // الفائزين
  // ============================================================

  async function loadWinners() {
    const {
      data: finished,
      error: finishedError,
    } = await supabase
      .from("challenges")
      .select("id, title")
      .eq("status", "finished")
      .order("updated_at", {
        ascending: false,
      })
      .limit(10);

    if (finishedError) {
      console.error(
        "Winners challenges error:",
        finishedError
      );

      setWinners([]);
      return;
    }

    if (!finished?.length) {
      setWinners([]);
      return;
    }

    const challengeIds =
      finished.map(
        (c) => c.id
      );

    const {
      data: parts,
      error: partsError,
    } = await supabase
      .from("challenge_participants")
      .select(
        "challenge_id, student_id, final_rank"
      )
      .in(
        "challenge_id",
        challengeIds
      )
      .eq("final_rank", 1);

    if (partsError) {
      console.error(
        "Winners participants error:",
        partsError
      );

      setWinners([]);
      return;
    }

    if (!parts?.length) {
      setWinners([]);
      return;
    }

    const studentIds = [
      ...new Set(
        parts.map(
          (p) => p.student_id
        )
      ),
    ];

    const {
      data: students,
    } = await supabase
      .from("students")
      .select(
        "id, full_name"
      )
      .in(
        "id",
        studentIds
      );

    const nameMap = new Map(
      (students || []).map(
        (s) => [
          s.id,
          s.full_name || "فائز",
        ]
      )
    );

    const titleMap = new Map(
      finished.map(
        (c) => [
          c.id,
          c.title,
        ]
      )
    );

    setWinners(
      parts.map((p) => ({
        challengeId:
          p.challenge_id,
        challengeTitle:
          titleMap.get(
            p.challenge_id
          ) || "تحدي",
        studentId:
          p.student_id,
        studentName:
          nameMap.get(
            p.student_id
          ) || "فائز",
      }))
    );
  }

  // ============================================================
  // ترتيب الطالب
  // ============================================================

  const myRank = useMemo(() => {
    if (!studentId) return null;

    // نبحث عن ترتيب الطالب في أول تحدي موجود
    for (const board of leaderboards) {
      const index =
        board.rows.findIndex(
          (r) =>
            r.studentId ===
            studentId
        );

      if (index >= 0) {
        return index + 1;
      }
    }

    return null;
  }, [
    leaderboards,
    studentId,
  ]);

  // ============================================================
  // إحصائيات الطالب
  // ============================================================

  const statsCards = useMemo(() => {
    const played =
      myResults.length;

    const avg =
      played === 0
        ? 0
        : myResults.reduce(
            (sum, result) =>
              sum +
              Number(
                result.percentage ||
                  0
              ),
            0
          ) / played;

    const best =
      played === 0
        ? 0
        : Math.max(
            ...myResults.map(
              (r) =>
                Number(
                  r.percentage ||
                    0
                )
            )
          );

    return {
      played,
      avg: Number(
        avg.toFixed(1)
      ),
      best,
    };
  }, [myResults]);

  function statusLabel(
    status: string | null
  ) {
    if (
      status ===
      "registration"
    )
      return "متاح الآن";

    if (
      status === "active"
    )
      return "جاري";

    if (
      status === "upcoming"
    )
      return "قريبًا";

    return status || "";
  }

  function statusClass(
    status: string | null
  ) {
    if (
      status === "active"
    ) {
      return "border-emerald-500/30 bg-emerald-500/15 text-emerald-400";
    }

    if (
      status ===
      "registration"
    ) {
      return "border-cyan-500/30 bg-cyan-500/15 text-cyan-400";
    }

    return "border-violet-500/30 bg-violet-500/15 text-violet-400";
  }

  function difficultyClass(
    diff: string | null
  ) {
    if (diff === "سهل") {
      return "bg-emerald-500/15 text-emerald-400";
    }

    if (
      diff === "صعب" ||
      diff === "تحدي كبير"
    ) {
      return "bg-red-500/15 text-red-400";
    }

    return "bg-amber-500/15 text-amber-400";
  }

  // ============================================================
  // Loading
  // ============================================================

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#070b14] text-white"
      >
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />

          <p className="mt-4 text-sm text-slate-400">
            جاري تحميل التحديات...
          </p>
        </div>
      </main>
    );
  }

  // ============================================================
  // التحديات مقفولة
  // ============================================================

  if (!enabled) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen flex-col items-center justify-center bg-[#070b14] p-6 text-white"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-slate-800 bg-[#0b111e] text-slate-400">
          <Lock className="h-10 w-10" />
        </div>

        <h1 className="mt-6 text-2xl font-black">
          التحديات مقفلة حاليًا
        </h1>

        <p className="mt-2 text-slate-400">
          سيتم فتحها قريبًا من إدارة المنصة
        </p>

        <button
          onClick={() =>
            router.push(
              "/dashboard"
            )
          }
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-black text-slate-950"
        >
          <Home className="h-4 w-4" />
          الصفحة الرئيسية
        </button>
      </main>
    );
  }

  // ============================================================
  // الصفحة
  // ============================================================

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#070b14] p-4 text-white sm:p-6 lg:p-8"
    >
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() =>
              router.push(
                "/dashboard"
              )
            }
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-800 bg-[#0b111e] px-4 py-2.5 text-sm font-bold text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-400"
          >
            <ArrowRight className="h-4 w-4" />
            الصفحة الرئيسية
          </button>

          <div className="hidden items-center gap-2 text-xs font-bold text-slate-500 sm:flex">
            <Home className="h-3.5 w-3.5" />

            <span>
              لوحة الطالب
            </span>

            <ChevronLeft className="h-3.5 w-3.5" />

            <span className="text-cyan-400">
              التحديات
            </span>
          </div>
        </div>

        {/* Hero */}
        <section className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-[#0b111e] p-6 sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(37,99,235,0.10),transparent_35%)]" />

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
                  {studentName
                    ? `مرحبًا ${studentName} — `
                    : ""}
                  نافس، حلّ، وتصدر لوحة الأبطال.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <MiniStat
                icon={Target}
                label="شاركت"
                value={
                  statsCards.played
                }
              />

              <MiniStat
                icon={Flame}
                label="أفضل نتيجة"
                value={`${statsCards.best}%`}
              />

              <MiniStat
                icon={Crown}
                label="ترتيبك"
                value={
                  myRank
                    ? `#${myRank}`
                    : "—"
                }
              />
            </div>
          </div>
        </section>

        {/* Winners */}
        {winners.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-black text-amber-300">
              🏆 أبطال التحديات
            </h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {winners
                .slice(0, 4)
                .map((winner) => (
                  <div
                    key={`${winner.challengeId}-${winner.studentId}`}
                    className="relative overflow-hidden rounded-3xl border border-amber-400/25 bg-gradient-to-l from-amber-500/10 via-[#0b111e] to-[#0b111e] p-5"
                  >
                    <div className="pointer-events-none absolute -left-8 -top-8 h-28 w-28 animate-pulse rounded-full bg-amber-400/20 blur-2xl" />

                    <div className="relative flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-yellow-500 text-2xl shadow-lg shadow-amber-500/30">
                        👑
                      </div>

                      <div>
                        <p className="text-xs font-bold text-amber-300/90">
                          الفائز
                        </p>

                        <h3 className="text-xl font-black text-white">
                          {winner.studentName}
                        </h3>

                        <p className="mt-1 text-sm text-slate-400">
                          {
                            winner.challengeTitle
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-800 bg-[#0b111e] p-2">
          {[
            {
              key: "challenges",
              label: "التحديات",
              icon: Swords,
            },
            {
              key: "my_results",
              label: "نتائجي",
              icon: Medal,
            },
            {
              key: "leaderboard",
              label: "لوحة المتصدرين",
              icon: Trophy,
            },
          ].map(
            (tabItem) => {
              const Icon =
                tabItem.icon;

              const active =
                tab ===
                tabItem.key;

              return (
                <button
                  key={
                    tabItem.key
                  }
                  onClick={() =>
                    setTab(
                      tabItem.key as Tab
                    )
                  }
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                    active
                      ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20"
                      : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {
                    tabItem.label
                  }
                </button>
              );
            }
          )}
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {errorMsg}
          </div>
        )}

        {/* ====================================================== */}
        {/* Challenges */}
        {/* ====================================================== */}

        {tab ===
          "challenges" && (
          <section className="space-y-5">
            {challenges.length ===
            0 ? (
              <EmptyState
                title="لا توجد تحديات متاحة"
                subtitle="تابعنا قريبًا لمزيد من المنافسات"
              />
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {challenges.map(
                  (
                    challenge,
                    index
                  ) => {
                    const myBest =
                      myResults.find(
                        (
                          result
                        ) =>
                          result.challenge_id ===
                          challenge.id
                      );

                    return (
                      <article
                        key={
                          challenge.id
                        }
                        className="group relative flex flex-col overflow-hidden rounded-[24px] border border-slate-800 bg-[#0b111e] p-5 transition hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/5"
                      >
                        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-l from-cyan-400 via-blue-500 to-transparent opacity-80" />

                        <div className="mb-4 flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-400">
                              <Swords className="h-5 w-5" />
                            </div>

                            <div>
                              <p className="text-[11px] font-bold text-slate-500">
                                تحدي #
                                {index +
                                  1}
                              </p>

                              <h3 className="text-lg font-black leading-7">
                                {
                                  challenge.title
                                }
                              </h3>
                            </div>
                          </div>

                          {challenge.difficulty && (
                            <span
                              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${difficultyClass(
                                challenge.difficulty
                              )}`}
                            >
                              {
                                challenge.difficulty
                              }
                            </span>
                          )}
                        </div>

                        <p className="mb-4 line-clamp-2 min-h-[40px] flex-1 text-sm leading-6 text-slate-400">
                          {
                            challenge.description ||
                            "ادخل التحدي الآن واختبر مستواك."
                          }
                        </p>

                        <div className="mb-5 flex flex-wrap gap-2">
                          <span
                            className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold ${statusClass(
                              challenge.status
                            )}`}
                          >
                            {statusLabel(
                              challenge.status
                            )}
                          </span>

                          {myBest && (
                            <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
                              نتيجتك:{" "}
                              {Number(
                                myBest.percentage ||
                                  0
                              )}
                              %
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() =>
                            router.push(
                              `/challenges/${challenge.id}`
                            )
                          }
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 py-3 text-sm font-black text-slate-950 transition group-hover:bg-cyan-400"
                        >
                          الدخول للتحدي

                          <ChevronLeft className="h-4 w-4" />
                        </button>
                      </article>
                    );
                  }
                )}
              </div>
            )}
          </section>
        )}

        {/* ====================================================== */}
        {/* My Results */}
        {/* ====================================================== */}

        {tab ===
          "my_results" && (
          <section className="space-y-4">
            {myResults.length ===
            0 ? (
              <EmptyState
                title="لا توجد نتائج بعد"
                subtitle="شارك في تحدي لتظهر نتائجك هنا"
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {myResults.map(
                  (result) => (
                    <div
                      key={
                        result.id
                      }
                      className="rounded-3xl border border-slate-800 bg-[#0b111e] p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-black">
                            {
                              result.challengeTitle
                            }
                          </h3>

                          <p className="mt-1 text-xs text-slate-500">
                            {result.finished_at
                              ? new Date(
                                  result.finished_at
                                ).toLocaleString(
                                  "ar-EG"
                                )
                              : "—"}
                          </p>
                        </div>

                        <div className="rounded-xl bg-cyan-500/15 px-3 py-2 text-center">
                          <p className="text-xl font-black text-cyan-400">
                            {Number(
                              result.percentage ||
                                0
                            )}
                            %
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-[#070b14] p-3">
                          <p className="text-[11px] text-slate-500">
                            الدرجة
                          </p>

                          <p className="mt-1 font-bold">
                            {
                              result.score ??
                              0
                            }
                            /
                            {
                              result.total_score ??
                              0
                            }
                          </p>
                        </div>

                        <button
                          onClick={() =>
                            router.push(
                              `/challenges/${result.challenge_id}`
                            )
                          }
                          className="rounded-xl bg-slate-800 p-3 text-sm font-bold text-cyan-400 hover:bg-slate-700"
                        >
                          فتح التحدي
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </section>
        )}

        {/* ====================================================== */}
        {/* Leaderboard */}
        {/* ====================================================== */}

        {tab ===
          "leaderboard" && (
          <section className="space-y-6">
            {leaderboards.length ===
            0 ? (
              <EmptyState
                title="لوحة المتصدرين فارغة"
                subtitle="لما الطلاب يبدأوا التحديات هتظهر الترتيبات هنا"
              />
            ) : (
              leaderboards.map(
                (board) => {
                  const top3 =
                    board.rows.slice(
                      0,
                      3
                    );

                  const first =
                    top3[0];

                  const second =
                    top3[1];

                  const third =
                    top3[2];

                  return (
                    <div
                      key={
                        board.challengeId
                      }
                      className="overflow-hidden rounded-[30px] border border-slate-800 bg-[#0b111e]"
                    >
                      {/* اسم التحدي */}
                      <div className="relative overflow-hidden border-b border-slate-800 px-5 py-6 sm:px-8">
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.12),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.08),transparent_35%)]" />

                        <div className="relative flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400">
                            <Trophy className="h-6 w-6" />
                          </div>

                          <div>
                            <p className="text-xs font-bold text-slate-500">
                              لوحة متصدري التحدي
                            </p>

                            <h2 className="mt-1 text-2xl font-black text-white">
                              {
                                board.challengeTitle
                              }
                            </h2>
                          </div>
                        </div>
                      </div>

                      {/* Podium */}
                      {top3.length >
                        0 && (
                        <div className="relative px-4 pt-10 sm:px-8 sm:pt-12">
                          {/* الأرضية */}
                          <div className="pointer-events-none absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent sm:left-8 sm:right-8" />

                          <div className="mx-auto flex max-w-3xl items-end justify-center gap-2 sm:gap-5">

                            {/* الثاني */}
                            {second ? (
                              <PodiumPlace
                                row={
                                  second
                                }
                                place={2}
                                studentId={
                                  studentId
                                }
                                height="h-28 sm:h-36"
                              />
                            ) : (
                              <div className="w-[30%]" />
                            )}

                            {/* الأول */}
                            {first ? (
                              <PodiumPlace
                                row={
                                  first
                                }
                                place={1}
                                studentId={
                                  studentId
                                }
                                height="h-40 sm:h-52"
                                winner
                              />
                            ) : (
                              <div className="w-[34%]" />
                            )}

                            {/* الثالث */}
                            {third ? (
                              <PodiumPlace
                                row={
                                  third
                                }
                                place={3}
                                studentId={
                                  studentId
                                }
                                height="h-24 sm:h-32"
                              />
                            ) : (
                              <div className="w-[30%]" />
                            )}
                          </div>
                        </div>
                      )}

                      {/* باقي الترتيب */}
                      {board.rows.length >
                        3 && (
                        <div className="mt-8 border-t border-slate-800">
                          <div className="px-5 py-4">
                            <p className="text-sm font-black text-slate-300">
                              باقي الترتيب
                            </p>
                          </div>

                          <div className="divide-y divide-slate-800">
                            {board.rows
                              .slice(
                                3,
                                20
                              )
                              .map(
                                (
                                  row,
                                  index
                                ) => {
                                  const realRank =
                                    index +
                                    4;

                                  const isMe =
                                    row.studentId ===
                                    studentId;

                                  return (
                                    <div
                                      key={
                                        row.studentId
                                      }
                                      className={`flex items-center justify-between gap-3 px-5 py-4 ${
                                        isMe
                                          ? "bg-cyan-500/10"
                                          : ""
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-xs font-black text-slate-400">
                                          #
                                          {
                                            realRank
                                          }
                                        </div>

                                        <div>
                                          <p className="font-bold">
                                            {
                                              row.name
                                            }

                                            {isMe && (
                                              <span className="mr-2 text-xs text-cyan-400">
                                                (أنت)
                                              </span>
                                            )}
                                          </p>

                                          <p className="text-xs text-slate-500">
                                            {
                                              row.attempts
                                            }{" "}
                                            محاولة
                                          </p>
                                        </div>
                                      </div>

                                      <div className="text-left">
                                        <p className="font-black text-cyan-400">
                                          {row.bestPercentage.toFixed(
                                            1
                                          )}
                                          %
                                        </p>

                                        <p className="text-xs text-slate-500">
                                          {
                                            row.totalScore
                                          }{" "}
                                          نقطة
                                        </p>
                                      </div>
                                    </div>
                                  );
                                }
                              )}
                          </div>
                        </div>
                      )}

                      {top3.length ===
                        0 && (
                        <div className="px-6 py-12 text-center text-sm text-slate-500">
                          لا توجد نتائج مكتملة لهذا التحدي حتى الآن.
                        </div>
                      )}
                    </div>
                  );
                }
              )
            )}
          </section>
        )}
      </div>
    </main>
  );
}

// ============================================================
// Podium
// ============================================================

function PodiumPlace({
  row,
  place,
  studentId,
  height,
  winner = false,
}: {
  row: LeaderRow;
  place: 1 | 2 | 3;
  studentId: string | null;
  height: string;
  winner?: boolean;
}) {
  const isMe =
    row.studentId ===
    studentId;

  const medal =
    place === 1
      ? "🥇"
      : place === 2
        ? "🥈"
        : "🥉";

  const color =
    place === 1
      ? "from-amber-300 via-yellow-400 to-amber-600"
      : place === 2
        ? "from-slate-200 via-slate-400 to-slate-600"
        : "from-orange-300 via-orange-500 to-orange-700";

  const border =
    place === 1
      ? "border-amber-400/40"
      : place === 2
        ? "border-slate-400/30"
        : "border-orange-400/30";

  return (
    <div className="flex w-[31%] flex-col items-center">
      {/* التاج للأول */}
      {winner && (
        <Crown className="mb-1 h-7 w-7 animate-pulse text-amber-300" />
      )}

      {/* الاسم */}
      <div className="mb-3 text-center">
        <div
          className={`mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full border-2 bg-gradient-to-br ${color} text-2xl shadow-xl`}
        >
          {medal}
        </div>

        <p
          className={`line-clamp-1 text-sm font-black ${
            isMe
              ? "text-cyan-400"
              : "text-white"
          }`}
        >
          {row.name}
        </p>

        {isMe && (
          <span className="mt-1 block text-[10px] font-bold text-cyan-400">
            أنت
          </span>
        )}

        <p className="mt-1 text-xs font-bold text-slate-500">
          {row.bestPercentage.toFixed(
            1
          )}
          %
        </p>
      </div>

      {/* منصة */}
      <div
        className={`relative flex w-full ${height} items-end justify-center overflow-hidden rounded-t-2xl border ${border} bg-gradient-to-t ${color} shadow-2xl`}
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-white/50" />

        <div className="relative pb-4 text-center">
          <p className="text-3xl font-black text-slate-950/80">
            {place}
          </p>

          <p className="mt-1 text-[10px] font-black text-slate-950/60">
            المركز
          </p>
        </div>

        {/* لمعان */}
        <div className="pointer-events-none absolute -right-10 top-0 h-24 w-24 rounded-full bg-white/20 blur-2xl" />
      </div>
    </div>
  );
}

// ============================================================
// Mini Stat
// ============================================================

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

      <p className="mt-1 text-lg font-black text-white">
        {value}
      </p>
    </div>
  );
}

// ============================================================
// Empty State
// ============================================================

function EmptyState({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-700 bg-[#0b111e] p-16 text-center">
      <Trophy className="mx-auto h-12 w-12 text-slate-600" />

      <h2 className="mt-4 text-xl font-black">
        {title}
      </h2>

      <p className="mt-2 text-slate-500">
        {subtitle}
      </p>
    </div>
  );
}