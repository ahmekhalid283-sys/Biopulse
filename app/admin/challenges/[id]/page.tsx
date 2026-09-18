"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import {
  Trophy,
  ChevronLeft,
  ClipboardList,
  RefreshCw,
  Pencil,
  Send,
  UserCheck,
  Eye,
  X,
} from "lucide-react";

type Challenge = {
  id: string;
  title: string;
  description: string | null;
  difficulty: string | null;
  status: string | null;
  duration_minutes: number | null;
  passing_score: number | null;
  total_rounds?: number | null;
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

type Question = {
  id: string;
  question_text: string;
  question_type: "mcq" | "true_false" | "written";
  options: string[];
  correct_answer: string;
  points: number;
};

type ParticipantRow = {
  attemptId: string;
  studentId: string;
  studentName: string;
  roundId: string | null;
  roundTitle: string;
  score: number | null;
  totalScore: number | null;
  percentage: number | null;
  finishedAt: string | null;
  pendingWritten: boolean;
};

type ReviewAnswer = {
  id: string;
  question_id: string;
  student_answer: string | null;
  selected_option: string | null;
  is_correct: boolean | null;
  marks_awarded: number | null;
  question_order: number | null;
  question?: string;
  question_type?: string;
  marks?: number;
  correct_answer?: string;
};

type ReviewSource = "quick" | "elimination";

function isWrittenType(t?: string | null) {
  return t === "written" || t === "essay";
}

export default function ChallengeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const challengeId = params.id as string;

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewAnswers, setReviewAnswers] = useState<ReviewAnswer[]>([]);
  const [reviewMeta, setReviewMeta] = useState<ParticipantRow | null>(null);
  const [reviewSource, setReviewSource] = useState<ReviewSource | null>(null);
  const [savingGrade, setSavingGrade] = useState(false);

  const isElimination = rounds.length > 0;
  const isVisibleToStudents =
    challenge?.status === "registration" ||
    challenge?.status === "upcoming" ||
    challenge?.status === "active";

  useEffect(() => {
    if (challengeId) fetchData();
  }, [challengeId]);

  useEffect(() => {
    if (!challengeId) return;
    if (isElimination && selectedRoundId) {
      fetchRoundQuestions(selectedRoundId);
    } else if (!isElimination) {
      fetchQuickQuestions();
    }
  }, [selectedRoundId, isElimination, challengeId]);

  useEffect(() => {
    if (challengeId) loadParticipants();
  }, [challengeId]);

  async function fetchData() {
    try {
      setLoading(true);
      const [challengeRes, roundsRes] = await Promise.all([
        supabase.from("challenges").select("*").eq("id", challengeId).single(),
        supabase
          .from("challenge_rounds")
          .select("*")
          .eq("challenge_id", challengeId)
          .order("round_number", { ascending: true }),
      ]);

      if (challengeRes.error) {
        alert("حدث خطأ أثناء جلب بيانات التحدي");
        return;
      }

      setChallenge(challengeRes.data);
      const roundsData = roundsRes.data || [];
      setRounds(roundsData);

      if (roundsData.length > 0) {
        setSelectedRoundId(roundsData[0].id);
      } else {
        await fetchQuickQuestions();
      }
    } catch (error) {
      console.error("fetchData error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleTogglePublish() {
    if (!challenge) return;
    try {
      setToggling(true);
      const newStatus = isVisibleToStudents ? "draft" : "active";
      const { error } = await supabase
        .from("challenges")
        .update({ status: newStatus })
        .eq("id", challengeId);
      if (error) throw error;
      setChallenge({ ...challenge, status: newStatus });
      alert(
        newStatus === "active"
          ? "تم نشر التحدي بنجاح وأصبح مرئياً للطلاب"
          : "تم سحب نشر التحدي بنجاح وتحويله إلى مسودة"
      );
    } catch (error: any) {
      alert(error?.message || "حدث خطأ أثناء تغيير حالة النشر");
    } finally {
      setToggling(false);
    }
  }

  function mapEliminationQuestion(q: any): Question {
    return {
      id: q.id,
      question_text: q.question || "",
      question_type: (q.question_type as Question["question_type"]) || "mcq",
      options: [q.option_a, q.option_b, q.option_c, q.option_d].filter(
        (o) => o && o !== "-"
      ),
      correct_answer:
        q.correct_answer === "A"
          ? q.option_a
          : q.correct_answer === "B"
            ? q.option_b
            : q.correct_answer === "C"
              ? q.option_c
              : q.correct_answer === "D"
                ? q.option_d
                : q.correct_answer,
      points: Number(q.marks) || 0,
    };
  }

  function mapQuickQuestion(q: any): Question {
    let options: string[] = [];
    if (Array.isArray(q.options)) {
      options = q.options.filter(Boolean);
    } else if (typeof q.options === "string") {
      try {
        const parsed = JSON.parse(q.options);
        if (Array.isArray(parsed)) options = parsed.filter(Boolean);
      } catch {
        options = [];
      }
    }
    return {
      id: q.id,
      question_text: q.question_text || q.question || "",
      question_type: (q.question_type as Question["question_type"]) || "mcq",
      options,
      correct_answer: q.correct_answer || "",
      points: Number(q.points) || 0,
    };
  }

  async function fetchQuickQuestions() {
    const { data, error } = await supabase
      .from("questions")
      .select(
        "id, question_text, question_type, options, correct_answer, points"
      )
      .eq("challenge_id", challengeId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("fetchQuickQuestions error:", error);
      setQuestions([]);
      return;
    }
    setQuestions((data || []).map(mapQuickQuestion));
  }

  async function fetchRoundQuestions(roundId: string) {
    const { data: links, error: linksError } = await supabase
      .from("challenge_round_questions")
      .select("question_id, question_order")
      .eq("round_id", roundId)
      .order("question_order", { ascending: true });

    if (linksError || !links || links.length === 0) {
      setQuestions([]);
      return;
    }

    const ids = links.map((l) => l.question_id);
    const { data, error } = await supabase
      .from("challenge_questions")
      .select(
        "id, question, question_type, option_a, option_b, option_c, option_d, correct_answer, marks"
      )
      .in("id", ids);

    if (error || !data) {
      setQuestions([]);
      return;
    }

    const orderMap = new Map(
      links.map((l) => [l.question_id, l.question_order ?? 0])
    );

    setQuestions(
      data
        .sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0))
        .map(mapEliminationQuestion)
    );
  }

  async function loadParticipants() {
    try {
      setLoadingParticipants(true);

      const { data: attempts, error } = await supabase
        .from("challenge_attempts")
        .select(
          "id, participant_id, round_id, score, total_score, percentage, finished_at"
        )
        .eq("challenge_id", challengeId)
        .order("finished_at", { ascending: false });

      if (error || !attempts) {
        console.error("attempts error:", error);
        setParticipants([]);
        return;
      }

      const attemptIds = attempts.map((a) => a.id);
      // attemptId -> عنده مقالي لسه marks_awarded null
      const pendingSet = new Set<string>();

      if (attemptIds.length > 0) {
        // --- Quick ---
        const { data: quickAnswers } = await supabase
          .from("quick_challenge_attempt_answers")
          .select("attempt_id, question_id, marks_awarded")
          .in("attempt_id", attemptIds);

        const quickQIds = [
          ...new Set((quickAnswers || []).map((a) => a.question_id)),
        ];

        if (quickQIds.length > 0) {
          const { data: quickQs } = await supabase
            .from("questions")
            .select("id, question_type")
            .in("id", quickQIds);

          const typeMap = new Map(
            (quickQs || []).map((q: any) => [q.id, q.question_type])
          );

          for (const a of quickAnswers || []) {
            if (
              isWrittenType(typeMap.get(a.question_id) as string) &&
              a.marks_awarded === null
            ) {
              pendingSet.add(a.attempt_id);
            }
          }
        }

        // --- Elimination ---
        const { data: elimAnswers } = await supabase
          .from("challenge_attempt_answers")
          .select("attempt_id, question_id, marks_awarded")
          .in("attempt_id", attemptIds);

        const elimQIds = [
          ...new Set((elimAnswers || []).map((a) => a.question_id)),
        ];

        if (elimQIds.length > 0) {
          const { data: elimQs } = await supabase
            .from("challenge_questions")
            .select("id, question_type")
            .in("id", elimQIds);

          const typeMap = new Map(
            (elimQs || []).map((q: any) => [q.id, q.question_type])
          );

          for (const a of elimAnswers || []) {
            if (
              isWrittenType(typeMap.get(a.question_id) as string) &&
              a.marks_awarded === null
            ) {
              pendingSet.add(a.attempt_id);
            }
          }
        }
      }

      const participantIds = [
        ...new Set(attempts.map((a) => a.participant_id).filter(Boolean)),
      ];
      const roundIds = [
        ...new Set(attempts.map((a) => a.round_id).filter(Boolean)),
      ] as string[];

      const [participantsRes, roundsRes] = await Promise.all([
        participantIds.length
          ? supabase
              .from("challenge_participants")
              .select("id, student_id")
              .in("id", participantIds)
          : Promise.resolve({ data: [] as any[] }),
        roundIds.length
          ? supabase
              .from("challenge_rounds")
              .select("id, title")
              .in("id", roundIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const parts = participantsRes.data || [];
      const roundsData = roundsRes.data || [];
      const participantToStudent = new Map(
        parts.map((p: any) => [p.id, p.student_id])
      );
      const studentIds = [
        ...new Set([...participantToStudent.values()].filter(Boolean)),
      ];

      const { data: students } = studentIds.length
        ? await supabase
            .from("students")
            .select("id, full_name")
            .in("id", studentIds)
        : { data: [] as any[] };

      const nameMap = new Map(
        (students || []).map((s: any) => [s.id, s.full_name || "طالب"])
      );
      const roundMap = new Map(
        roundsData.map((r: any) => [r.id, r.title])
      );

      setParticipants(
        attempts.map((attempt) => {
          const studentId =
            participantToStudent.get(attempt.participant_id) || "";
          return {
            attemptId: attempt.id,
            studentId,
            studentName: nameMap.get(studentId) || "طالب",
            roundId: attempt.round_id,
            roundTitle: attempt.round_id
              ? roundMap.get(attempt.round_id) || "دور"
              : "تحدي سريع",
            score: attempt.score,
            totalScore: attempt.total_score,
            percentage: attempt.percentage,
            finishedAt: attempt.finished_at,
            pendingWritten: pendingSet.has(attempt.id),
          };
        })
      );
    } catch (error) {
      console.error("loadParticipants error:", error);
      setParticipants([]);
    } finally {
      setLoadingParticipants(false);
    }
  }

  async function openReview(attemptId: string) {
    const meta = participants.find((p) => p.attemptId === attemptId) || null;
    setReviewMeta(meta);
    setReviewOpen(true);
    setReviewLoading(true);
    setReviewAnswers([]);
    setReviewSource(null);

    try {
      const { data: quickAnswers, error: quickError } = await supabase
        .from("quick_challenge_attempt_answers")
        .select("*")
        .eq("attempt_id", attemptId);

      if (quickError) console.error("quick review error:", quickError);

      if (quickAnswers && quickAnswers.length > 0) {
        const questionIds = [
          ...new Set(quickAnswers.map((a) => a.question_id)),
        ];
        const { data: quickQuestions, error: questionsError } = await supabase
          .from("questions")
          .select(
            "id, question_text, question_type, correct_answer, points"
          )
          .in("id", questionIds);
        if (questionsError) throw questionsError;

        const questionMap = new Map(
          (quickQuestions || []).map((q: any) => [q.id, q])
        );

        setReviewSource("quick");
        setReviewAnswers(
          quickAnswers
            .sort(
              (a, b) => (a.question_order ?? 0) - (b.question_order ?? 0)
            )
            .map((answer) => {
              const q = questionMap.get(answer.question_id);
              return {
                id: answer.id,
                question_id: answer.question_id,
                student_answer: answer.student_answer ?? null,
                selected_option: answer.selected_option ?? null,
                is_correct: answer.is_correct ?? null,
                marks_awarded: answer.marks_awarded ?? null,
                question_order: answer.question_order ?? null,
                question: q?.question_text || "سؤال",
                question_type: q?.question_type || "mcq",
                marks: Number(q?.points || 0),
                correct_answer: q?.correct_answer || "",
              };
            })
        );
        return;
      }

      const { data: eliminationAnswers, error: eliminationError } =
        await supabase
          .from("challenge_attempt_answers")
          .select("*")
          .eq("attempt_id", attemptId);

      if (eliminationError) throw eliminationError;
      if (!eliminationAnswers || eliminationAnswers.length === 0) return;

      const questionIds = [
        ...new Set(eliminationAnswers.map((a) => a.question_id)),
      ];
      const { data: eliminationQuestions, error: questionsError } =
        await supabase
          .from("challenge_questions")
          .select("id, question, question_type, marks, correct_answer")
          .in("id", questionIds);
      if (questionsError) throw questionsError;

      const questionMap = new Map(
        (eliminationQuestions || []).map((q: any) => [q.id, q])
      );

      setReviewSource("elimination");
      setReviewAnswers(
        eliminationAnswers
          .sort((a, b) => (a.question_order ?? 0) - (b.question_order ?? 0))
          .map((answer) => {
            const q = questionMap.get(answer.question_id);
            return {
              id: answer.id,
              question_id: answer.question_id,
              student_answer: answer.student_answer ?? null,
              selected_option: answer.selected_option ?? null,
              is_correct: answer.is_correct ?? null,
              marks_awarded: answer.marks_awarded ?? null,
              question_order: answer.question_order ?? null,
              question: q?.question || "سؤال",
              question_type: q?.question_type || "mcq",
              marks: Number(q?.marks || 0),
              correct_answer: q?.correct_answer || "",
            };
          })
      );
    } catch (error: any) {
      console.error("openReview error:", error);
      alert(error?.message || "حدث خطأ أثناء تحميل الإجابات");
    } finally {
      setReviewLoading(false);
    }
  }

  function updateLocalGrade(
    answerId: string,
    value: string,
    maxMarks: number
  ) {
    if (value === "" || value === null || value === undefined) {
      setReviewAnswers((prev) =>
        prev.map((a) =>
          a.id === answerId
            ? { ...a, marks_awarded: null, is_correct: null }
            : a
        )
      );
      return;
    }

    const num = Number(value);
    if (Number.isNaN(num)) return;
    const clamped = Math.min(Math.max(0, num), maxMarks);

    setReviewAnswers((prev) =>
      prev.map((a) =>
        a.id === answerId
          ? {
              ...a,
              marks_awarded: clamped,
              is_correct: clamped > 0,
            }
          : a
      )
    );
  }

    async function saveGrades() {
    if (!reviewMeta || !reviewSource) return;

    const written = reviewAnswers.filter((a) =>
      isWrittenType(a.question_type)
    );

    if (written.some((a) => a.marks_awarded === null)) {
      alert("سجّل درجة لكل سؤال مقالي (يمكن 0) قبل الحفظ");
      return;
    }

    try {
      setSavingGrade(true);

      const answersTable =
        reviewSource === "quick"
          ? "quick_challenge_attempt_answers"
          : "challenge_attempt_answers";

      // 1) تحديث درجات المقالي عبر RPC
      for (const a of written) {
        const { error } = await supabase.rpc(
          "admin_update_attempt_answer_grade",
          {
            p_answer_id: a.id,
            p_marks: Number(a.marks_awarded) || 0,
            p_is_correct: (Number(a.marks_awarded) || 0) > 0,
            p_table: answersTable,
          }
        );

        if (error) {
          console.error(
            "grade answer error:",
            JSON.stringify(error, null, 2)
          );
          // fallback مباشر
          const { error: directErr } = await supabase
            .from(answersTable)
            .update({
              marks_awarded: a.marks_awarded,
              is_correct: (Number(a.marks_awarded) || 0) > 0,
            })
            .eq("id", a.id);

          if (directErr) {
            throw directErr;
          }
        }
      }

      // 2) حساب الدرجة
      let totalScore = 0;
      let earned = 0;

      for (const a of reviewAnswers) {
        const max = Number(a.marks) || 0;
        totalScore += max;

        if (isWrittenType(a.question_type)) {
          earned += Number(a.marks_awarded) || 0;
        } else if (a.is_correct) {
          earned += max;
        } else {
          earned += Number(a.marks_awarded) || 0;
        }
      }

      const percentage =
        totalScore > 0
          ? Number(((earned / totalScore) * 100).toFixed(2))
          : 0;

      // 3) تحديث المحاولة عبر RPC
      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        "admin_update_attempt_score",
        {
          p_attempt_id: reviewMeta.attemptId,
          p_score: earned,
          p_total_score: totalScore,
          p_percentage: percentage,
        }
      );

      if (rpcError) {
        console.error(
          "update attempt rpc error:",
          JSON.stringify(rpcError, null, 2)
        );

        // fallback
        const { data: updatedRows, error: attemptError } = await supabase
          .from("challenge_attempts")
          .update({
            score: earned,
            total_score: totalScore,
            percentage,
          })
          .eq("id", reviewMeta.attemptId)
          .select("id, score, total_score, percentage");

        if (attemptError) {
          console.error(
            "update attempt error:",
            JSON.stringify(attemptError, null, 2)
          );
          throw attemptError;
        }

        if (!updatedRows || updatedRows.length === 0) {
          throw new Error(
            "التحديث لم يُطبَّق. تأكد أن الحساب role=admin ثم Logout/Login"
          );
        }
      }

      const newScore =
        (rpcResult as any)?.score ?? earned;
      const newTotal =
        (rpcResult as any)?.total_score ?? totalScore;
      const newPct =
        (rpcResult as any)?.percentage ?? percentage;

      setParticipants((prev) =>
        prev.map((p) =>
          p.attemptId === reviewMeta.attemptId
            ? {
                ...p,
                score: newScore,
                totalScore: newTotal,
                percentage: newPct,
                pendingWritten: false,
              }
            : p
        )
      );

      alert("تم حفظ التصحيح وتحديث النتيجة");
      setReviewOpen(false);
      await loadParticipants();
    } catch (err: any) {
      console.error("saveGrades error:", JSON.stringify(err, null, 2));
      alert(err?.message || "فشل حفظ التصحيح");
    } finally {
      setSavingGrade(false);
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

  if (!challenge) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-950 text-white"
      >
        التحدي غير موجود
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-950 p-4 text-white sm:p-6 lg:p-8"
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <button
              onClick={() => router.push("/admin/challenges")}
              className="mt-1 rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:text-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-400">
                <Trophy className="h-7 w-7" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold sm:text-3xl">
                    {challenge.title}
                  </h1>
                  <span
                    className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${
                      isVisibleToStudents
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                        : "border-amber-500/20 bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {isVisibleToStudents ? "متاح للطلاب" : "مسودة"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-400">
                  {challenge.description || "لا يوجد وصف"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() =>
                router.push(`/admin/challenges/${challengeId}/advance`)
              }
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-slate-800"
            >
              <UserCheck className="h-4 w-4" />
              اختيار المتأهلين
            </button>
            <button
              onClick={handleTogglePublish}
              disabled={toggling}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 ${
                isVisibleToStudents
                  ? "bg-amber-600 hover:bg-amber-500"
                  : "bg-emerald-600 hover:bg-emerald-500"
              }`}
            >
              <Send className="h-4 w-4" />
              {isVisibleToStudents ? "سحب النشر" : "نشر التحدي"}
            </button>
            <button
              onClick={() =>
                router.push(`/admin/challenges/${challengeId}/edit`)
              }
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-slate-700"
            >
              <Pencil className="h-4 w-4" />
              تعديل التحدي
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <p className="text-xs text-slate-400">المستوى</p>
            <p className="mt-1 text-lg font-bold">
              {challenge.difficulty || "غير محدد"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <p className="text-xs text-slate-400">المدة الافتراضية</p>
            <p className="mt-1 text-lg font-bold">
              {challenge.duration_minutes
                ? `${challenge.duration_minutes} دقيقة`
                : "غير محددة"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <p className="text-xs text-slate-400">درجة النجاح</p>
            <p className="mt-1 text-lg font-bold">
              {challenge.passing_score !== null
                ? `${challenge.passing_score}%`
                : "غير محددة"}
            </p>
          </div>
        </div>

        {rounds.length > 0 && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">أدوار التحدي</h2>
                <p className="mt-1 text-sm text-slate-400">
                  اختر دورًا لعرض أسئلته
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {rounds.map((round) => {
                const selected = selectedRoundId === round.id;
                return (
                  <button
                    key={round.id}
                    onClick={() => setSelectedRoundId(round.id)}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-right ${
                      selected
                        ? "border-blue-500 bg-blue-500/15 text-blue-300"
                        : "border-slate-800 bg-slate-800/40 text-slate-300"
                    }`}
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-xs font-bold">
                      {round.round_number}
                    </span>
                    <div>
                      <p className="text-sm font-bold">{round.title}</p>
                      <p className="text-xs text-slate-400">
                        {round.duration_minutes || 0} د • نجاح{" "}
                        {round.passing_score || 0}%
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold">أسئلة التحدي</h2>
              <p className="mt-1 text-sm text-slate-400">
                {questions.length} سؤال
              </p>
            </div>
            <button
              onClick={() => {
                const query = selectedRoundId
                  ? `?roundId=${selectedRoundId}`
                  : "";
                router.push(
                  `/admin/challenges/${challengeId}/questions${query}`
                );
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-500"
            >
              <ClipboardList className="h-4 w-4" />
              أسئلة التحدي
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">نتائج ومشاركات الطلاب</h2>
              <p className="mt-1 text-sm text-slate-400">
                أصفر = في انتظار تصحيح المقالي · أخضر = تم التصحيح
              </p>
            </div>
            <button
              onClick={loadParticipants}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              تحديث
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="border-b border-slate-800 text-xs text-slate-400">
                <tr>
                  <th className="pb-3 pr-4">الطالب</th>
                  <th className="pb-3">الدور</th>
                  <th className="pb-3">الدرجة</th>
                  <th className="pb-3">النسبة</th>
                  <th className="pb-3">الوقت</th>
                  <th className="pb-3">الحالة</th>
                  <th className="pb-3 pl-4 text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loadingParticipants ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-500">
                      جاري التحميل...
                    </td>
                  </tr>
                ) : participants.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-500">
                      لا توجد محاولات
                    </td>
                  </tr>
                ) : (
                  participants.map((p) => (
                    <tr key={p.attemptId} className="hover:bg-slate-800/30">
                      <td className="py-3.5 pr-4 font-bold">{p.studentName}</td>
                      <td className="py-3.5 text-slate-300">{p.roundTitle}</td>
                      <td className="py-3.5 text-slate-300">
                        {p.score !== null
                          ? `${p.score} / ${p.totalScore}`
                          : "--"}
                      </td>
                      <td className="py-3.5 font-bold text-cyan-400">
                        {p.percentage !== null ? `${p.percentage}%` : "--"}
                      </td>
                      <td className="py-3.5 text-xs text-slate-400">
                        {p.finishedAt
                          ? new Date(p.finishedAt).toLocaleString("ar-EG")
                          : "—"}
                      </td>
                      <td className="py-3.5">
                        {p.pendingWritten ? (
                          <span className="inline-flex rounded-lg bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold text-amber-400">
                            في انتظار التصحيح
                          </span>
                        ) : (
                          <span className="inline-flex rounded-lg bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
                            مصحح
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 pl-4 text-left">
                        <button
                          type="button"
                          onClick={() => openReview(p.attemptId)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600/20 px-3 py-1.5 text-xs font-bold text-blue-400 hover:bg-blue-600/30"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          مراجعة
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {reviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-800 bg-[#090d16] p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold">
                  مراجعة: {reviewMeta?.studentName}
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  {reviewMeta?.roundTitle} • النسبة:{" "}
                  {reviewMeta?.percentage ?? 0}%
                </p>
              </div>
              <button
                onClick={() => setReviewOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-6">
              {reviewLoading ? (
                <div className="py-12 text-center text-slate-500">
                  جاري التحميل...
                </div>
              ) : reviewAnswers.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  لا توجد إجابات
                </div>
              ) : (
                reviewAnswers.map((answer, index) => {
                  const written = isWrittenType(answer.question_type);
                  return (
                    <div
                      key={answer.id}
                      className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">
                          السؤال {index + 1}
                        </span>
                        <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-bold">
                          / {answer.marks}
                        </span>
                      </div>
                      <p className="font-bold leading-7">{answer.question}</p>
                      <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-4">
                        <p className="mb-2 text-xs font-bold text-slate-500">
                          إجابة الطالب
                        </p>
                        <p className="whitespace-pre-wrap text-sm text-slate-200">
                          {answer.student_answer ||
                            answer.selected_option ||
                            "بدون إجابة"}
                        </p>
                      </div>

                      {!written && (
                        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-xs">
                          <span className="text-slate-500">الصحيحة:</span>
                          <span className="font-bold text-emerald-400">
                            {answer.correct_answer || "—"}
                          </span>
                          <span
                            className={`mr-auto rounded-lg px-3 py-1 font-bold ${
                              answer.is_correct
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            {answer.is_correct ? "صحيح" : "خطأ"}
                          </span>
                        </div>
                      )}

                      {written && (
                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <p className="text-sm font-bold text-amber-400">
                              تصحيح يدوي — اكتب أي درجة
                            </p>
                            <span
                              className={`rounded-lg px-3 py-1 text-xs font-bold ${
                                answer.marks_awarded === null
                                  ? "bg-amber-500/15 text-amber-400"
                                  : "bg-emerald-500/15 text-emerald-400"
                              }`}
                            >
                              {answer.marks_awarded === null
                                ? "لم يُصحح"
                                : "تم"}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <label className="text-sm font-bold">الدرجة</label>
                            <input
                              type="number"
                              min={0}
                              max={Number(answer.marks || 0)}
                              step="0.5"
                              value={
                                answer.marks_awarded === null
                                  ? ""
                                  : answer.marks_awarded
                              }
                              placeholder="—"
                              onChange={(e) =>
                                updateLocalGrade(
                                  answer.id,
                                  e.target.value,
                                  Number(answer.marks || 0)
                                )
                              }
                              className="w-24 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-center text-sm font-bold outline-none focus:border-blue-500"
                            />
                            <span className="text-sm text-slate-500">
                              / {answer.marks}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:justify-between">
              <p className="text-xs text-slate-500">
                مقالي غير مصحح:{" "}
                {
                  reviewAnswers.filter(
                    (a) =>
                      isWrittenType(a.question_type) &&
                      a.marks_awarded === null
                  ).length
                }
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setReviewOpen(false)}
                  className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-bold"
                >
                  إغلاق
                </button>
                <button
                  onClick={saveGrades}
                  disabled={
                    savingGrade ||
                    reviewLoading ||
                    reviewAnswers.some(
                      (a) =>
                        isWrittenType(a.question_type) &&
                        a.marks_awarded === null
                    )
                  }
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40"
                >
                  {savingGrade ? "جاري الحفظ..." : "حفظ التصحيح وتحديث النتيجة"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}