"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Swords,
  ArrowRight,
  Trophy,
  Users,
  Clock,
  Layers,
  Play,
  Lock,
  CheckCircle2,
  XCircle,
  Hourglass,
} from "lucide-react";

type Challenge = {
  id: string;
  title: string;
  description: string | null;
  challenge_type: string | null;
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
  const [studentId, setStudentId] = useState<string | null>(null);
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
      setStudentId(student.id);

      const { data: challengeData, error: challengeError } = await supabase
        .from("challenges")
        .select(
          "id, title, description, challenge_type, difficulty, status, duration_minutes, passing_score"
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

      // تأهلات الطالب
      const { data: entries } = await supabase
        .from("challenge_round_entries")
        .select("round_id, status")
        .eq("challenge_id", challengeId)
        .eq("student_id", student.id);

      const entryMap = new Map(
        (entries || []).map((e) => [e.round_id, e.status])
      );

      // محاولات الطالب
      const { data: attempts } = await supabase
        .from("challenge_attempts")
        .select("round_id, status")
        .eq("challenge_id", challengeId)
        .eq("student_id", student.id);

      const attemptedRounds = new Set(
        (attempts || []).map((a) => a.round_id).filter(Boolean)
      );

      const view: RoundView[] = rounds.map((round, index) => {
        const entryStatus = entryMap.get(round.id);
        const hasAttempted = attemptedRounds.has(round.id);
        const isFirst = round.round_number === 1 || index === 0;

        // خلص الدور ده
        if (hasAttempted) {
          return {
            ...round,
            state: "done" as const,
            label: "تم تسليم إجاباتك",
          };
        }

        // الدور الأول: مفتوح للكل
        if (isFirst) {
          return {
            ...round,
            state: "playable" as const,
            label: "يمكنك الدخول الآن",
          };
        }

        // متأهل من الأدمن
        if (entryStatus === "qualified") {
          return {
            ...round,
            state: "playable" as const,
            label: "أنت متأهل — ادخل الدور",
          };
        }

        // مستبعد
        if (entryStatus === "eliminated") {
          return {
            ...round,
            state: "eliminated" as const,
            label: "أنت خارج التحدي",
          };
        }

        // السابق اتعمل محاولة ولسه مفيش قرار
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
          badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
          icon: Play,
        };
      case "waiting":
        return {
          badge: "bg-amber-500/15 text-amber-400 border-amber-500/20",
          icon: Hourglass,
        };
      case "eliminated":
        return {
          badge: "bg-red-500/15 text-red-400 border-red-500/20",
          icon: XCircle,
        };
      case "done":
        return {
          badge: "bg-blue-500/15 text-blue-400 border-blue-500/20",
          icon: CheckCircle2,
        };
      default:
        return {
          badge: "bg-slate-700/40 text-slate-400 border-slate-600/40",
          icon: Lock,
        };
    }
  }

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-950 text-white"
      >
        جاري التحميل...
      </main>
    );
  }

  if (errorMsg || !challenge) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-white"
      >
        <Lock className="h-12 w-12 text-slate-600" />
        <h1 className="mt-4 text-xl font-bold">{errorMsg || "غير متاح"}</h1>
        <button
          onClick={() => router.push("/challenges")}
          className="mt-6 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-bold text-slate-950"
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
      className="min-h-screen bg-slate-950 p-4 text-white sm:p-6 lg:p-8"
    >
      <div className="mx-auto max-w-4xl space-y-6">
        <button
          onClick={() => router.push("/challenges")}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-cyan-400"
        >
          <ArrowRight className="h-4 w-4" />
          العودة للتحديات
        </button>

        {/* Header */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-400">
              <Swords className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                {challenge.title}
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {challenge.description || "لا يوجد وصف."}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <InfoBox
              icon={Users}
              label="النوع"
              value={challenge.challenge_type === "team" ? "جماعي" : "فردي"}
            />
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
                  ? `${challenge.duration_minutes} د`
                  : "—"
              }
            />
            <InfoBox
              icon={Trophy}
              label="النجاح"
              value={
                challenge.passing_score ? `${challenge.passing_score}%` : "—"
              }
            />
          </div>

          {isEliminated && (
            <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              أنت خارج هذا التحدي. نشوفك في التحديات القادمة 💪
            </div>
          )}

          {playableRound && (
            <button
              onClick={() =>
                router.push(
                  `/challenges/${challengeId}/play?roundId=${playableRound.id}`
                )
              }
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3.5 text-sm font-bold text-slate-950 hover:bg-cyan-400 sm:w-auto"
            >
              <Play className="h-4 w-4" />
              دخول {playableRound.title}
            </button>
          )}
        </section>

        {/* Rounds timeline */}
        {roundsView.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-cyan-400" />
              <h2 className="text-lg font-bold">مسار التصفيات</h2>
            </div>

            <div className="relative space-y-3">
              {roundsView.map((round, index) => {
                const styles = stateStyles(round.state);
                const Icon = styles.icon;

                return (
                  <div key={round.id} className="relative flex gap-4">
                    {/* timeline line */}
                    {index < roundsView.length - 1 && (
                      <div className="absolute right-[19px] top-12 h-[calc(100%-8px)] w-0.5 bg-slate-800" />
                    )}

                    <div
                      className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${styles.badge}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h3 className="font-bold">
                            {round.title}
                            <span className="mr-2 text-xs font-normal text-slate-500">
                              (دور {round.round_number})
                            </span>
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">
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
                          className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${styles.badge}`}
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
                          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400"
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
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[11px] font-semibold">{label}</span>
      </div>
      <p className="mt-1.5 text-sm font-bold text-white">{value}</p>
    </div>
  );
}