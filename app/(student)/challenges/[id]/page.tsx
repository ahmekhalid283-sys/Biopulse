"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Swords,
  ArrowRight,
  Trophy,
  Clock,
  Layers,
  Play,
  Lock,
  CheckCircle2,
  XCircle,
  Hourglass,
  Sparkles,
} from "lucide-react";

type Challenge = {
  id: string;
  title: string;
  description: string | null;
  difficulty: string | null;
  status: string | null;
  duration_minutes: number | null;
  passing_score: number | null;
};

type Round = {
  id: string;
  round_number: number;
  title: string;
  participant_limit: number | null;
  qualified_count: number | null;
  duration_minutes: number | null;
  passing_score: number | null;
  status: string | null;
};

type RoundView = Round & {
  state: "playable" | "waiting" | "eliminated" | "done" | "locked";
  label: string;
};

export default function StudentChallengeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const challengeId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [roundsView, setRoundsView] = useState<RoundView[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (challengeId) loadData();
  }, [challengeId]);

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
        .select("id")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (!student) {
        setErrorMsg("لم يتم العثور على بيانات الطالب");
        return;
      }

      const { data: challengeData, error: challengeError } = await supabase
        .from("challenges")
        .select(
          "id, title, description, difficulty, status, duration_minutes, passing_score"
        )
        .eq("id", challengeId)
        .in("status", ["registration", "upcoming", "active", "finished"])
        .single();

      if (challengeError || !challengeData) {
        setErrorMsg("التحدي غير موجود أو غير متاح");
        return;
      }
      setChallenge(challengeData);

      const { data: roundsData } = await supabase
        .from("challenge_rounds")
        .select(
          "id, round_number, title, participant_limit, qualified_count, duration_minutes, passing_score, status"
        )
        .eq("challenge_id", challengeId)
        .order("round_number", { ascending: true });

      const rounds = roundsData || [];

      const { data: entries } = await supabase
        .from("challenge_round_entries")
        .select("round_id, status")
        .eq("challenge_id", challengeId)
        .eq("student_id", student.id);

      const entryMap = new Map(
        (entries || []).map((e) => [e.round_id, e.status])
      );

      // محاولات عبر participant (مفيش student_id مباشرة على attempts أحيانًا)
      const { data: participant } = await supabase
        .from("challenge_participants")
        .select("id")
        .eq("challenge_id", challengeId)
        .eq("student_id", student.id)
        .maybeSingle();

      let attemptedRounds = new Set<string>();

      if (participant?.id) {
        const { data: attempts } = await supabase
          .from("challenge_attempts")
          .select("round_id")
          .eq("challenge_id", challengeId)
          .eq("participant_id", participant.id);

        attemptedRounds = new Set(
          (attempts || []).map((a) => a.round_id).filter(Boolean) as string[]
        );
      } else {
        // fallback لو عندك student_id على attempts
        const { data: attempts } = await supabase
          .from("challenge_attempts")
          .select("round_id")
          .eq("challenge_id", challengeId)
          .eq("student_id", student.id);

        attemptedRounds = new Set(
          (attempts || []).map((a) => a.round_id).filter(Boolean) as string[]
        );
      }

      const view: RoundView[] = rounds.map((round, index) => {
        const entryStatus = entryMap.get(round.id);
        const hasAttempted = attemptedRounds.has(round.id);
        const isFirst = round.round_number === 1 || index === 0;

        if (hasAttempted) {
          return { ...round, state: "done" as const, label: "تم تسليم إجاباتك" };
        }

        if (isFirst) {
          return {
            ...round,
            state: "playable" as const,
            label: "يمكنك الدخول الآن",
          };
        }

        if (entryStatus === "qualified") {
          return {
            ...round,
            state: "playable" as const,
            label: "أنت متأهل — ادخل الدور",
          };
        }

        if (entryStatus === "eliminated") {
          return {
            ...round,
            state: "eliminated" as const,
            label: "أنت خارج التحدي",
          };
        }

        const prev = rounds[index - 1];
        if (prev && attemptedRounds.has(prev.id)) {
          return {
            ...round,
            state: "waiting" as const,
            label: "في انتظار قرار الإدارة",
          };
        }

        return {
          ...round,
          state: "locked" as const,
          label: "مقفل حتى انتهاء الدور السابق",
        };
      });

      setRoundsView(view);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }

  function stateStyles(state: RoundView["state"]) {
    switch (state) {
      case "playable":
        return {
          badge: "border-emerald-500/30 bg-emerald-500/15 text-emerald-400",
          ring: "border-emerald-500/40",
          icon: Play,
        };
      case "waiting":
        return {
          badge: "border-amber-500/30 bg-amber-500/15 text-amber-400",
          ring: "border-amber-500/30",
          icon: Hourglass,
        };
      case "eliminated":
        return {
          badge: "border-red-500/30 bg-red-500/15 text-red-400",
          ring: "border-red-500/30",
          icon: XCircle,
        };
      case "done":
        return {
          badge: "border-blue-500/30 bg-blue-500/15 text-blue-400",
          ring: "border-blue-500/30",
          icon: CheckCircle2,
        };
      default:
        return {
          badge: "border-slate-700 bg-slate-800/60 text-slate-400",
          ring: "border-slate-800",
          icon: Lock,
        };
    }
  }

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#070b14] text-white"
      >
        جاري التحميل...
      </main>
    );
  }

  if (errorMsg || !challenge) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen flex-col items-center justify-center bg-[#070b14] p-6 text-white"
      >
        <Lock className="h-12 w-12 text-slate-600" />
        <h1 className="mt-4 text-xl font-black">{errorMsg || "غير متاح"}</h1>
        <button
          onClick={() => router.push("/challenges")}
          className="mt-6 rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-black text-slate-950"
        >
          العودة للتحديات
        </button>
      </main>
    );
  }

  const playableRound = roundsView.find((r) => r.state === "playable");
  const isEliminated = roundsView.some((r) => r.state === "eliminated");

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#070b14] p-4 text-white sm:p-6 lg:p-10"
    >
      <div className="mx-auto max-w-4xl space-y-6">
        <button
          onClick={() => router.push("/challenges")}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 transition hover:text-cyan-400"
        >
          <ArrowRight className="h-4 w-4" />
          العودة للتحديات
        </button>

        {/* Header card */}
        <section className="overflow-hidden rounded-3xl border border-slate-800 bg-[#0b111e] shadow-xl">
          <div className="border-b border-slate-800/80 bg-gradient-to-l from-cyan-500/10 via-transparent to-transparent p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/15 text-cyan-400">
                <Swords className="h-8 w-8" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                    {challenge.title}
                  </h1>
                  <Sparkles className="h-5 w-5 text-cyan-400" />
                </div>
                <p className="mt-2 text-sm leading-7 text-slate-400">
                  {challenge.description || "لا يوجد وصف لهذا التحدي."}
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <InfoBox
                icon={Trophy}
                label="الصعوبة"
                value={challenge.difficulty || "—"}
              />
              <InfoBox
                icon={Clock}
                label="المدة"
                value={
                  challenge.duration_minutes
                    ? `${challenge.duration_minutes} دقيقة`
                    : "—"
                }
              />
              <InfoBox
                icon={Trophy}
                label="درجة النجاح"
                value={
                  challenge.passing_score
                    ? `${challenge.passing_score}%`
                    : "—"
                }
              />
            </div>

            {isEliminated && (
              <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">
                أنت خارج هذا التحدي — نشوفك في التحديات القادمة 💪
              </div>
            )}

            {playableRound && (
              <button
                onClick={() =>
                  router.push(
                    `/challenges/${challengeId}/play?roundId=${playableRound.id}`
                  )
                }
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-6 py-3.5 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400 sm:w-auto"
              >
                <Play className="h-4 w-4" />
                دخول {playableRound.title}
              </button>
            )}
          </div>
        </section>

        {/* Rounds */}
        {roundsView.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-black">مسار التصفيات</h2>
                <p className="text-xs text-slate-500">
                  تابع تقدمك عبر أدوار التحدي
                </p>
              </div>
            </div>

            <div className="relative space-y-4">
              {roundsView.map((round, index) => {
                const styles = stateStyles(round.state);
                const Icon = styles.icon;

                return (
                  <div key={round.id} className="relative flex gap-4">
                    {index < roundsView.length - 1 && (
                      <div className="absolute right-[21px] top-14 h-[calc(100%-12px)] w-0.5 bg-slate-800" />
                    )}

                    <div
                      className={`relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${styles.badge}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div
                      className={`flex-1 rounded-3xl border bg-[#0b111e] p-5 transition ${styles.ring}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-black text-white">
                            {round.title}
                            <span className="mr-2 text-xs font-normal text-slate-500">
                              دور {round.round_number}
                            </span>
                          </h3>
                          <p className="mt-1.5 text-xs text-slate-500">
                            {round.duration_minutes
                              ? `${round.duration_minutes} دقيقة`
                              : ""}
                            {round.passing_score
                              ? ` • نجاح ${round.passing_score}%`
                              : ""}
                            {round.qualified_count
                              ? ` • يتأهل ${round.qualified_count}`
                              : ""}
                          </p>
                        </div>

                        <span
                          className={`rounded-xl border px-3 py-1.5 text-xs font-black ${styles.badge}`}
                        >
                          {round.label}
                        </span>
                      </div>

                      {round.state === "playable" && (
                        <button
                          onClick={() =>
                            router.push(
                              `/challenges/${challengeId}/play?roundId=${round.id}`
                            )
                          }
                          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-black text-slate-950 hover:bg-cyan-400"
                        >
                          <Play className="h-3.5 w-3.5" />
                          ابدأ الآن
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
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
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#070b14]/80 p-4">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[11px] font-bold">{label}</span>
      </div>
      <p className="mt-2 text-sm font-black text-white">{value}</p>
    </div>
  );
}