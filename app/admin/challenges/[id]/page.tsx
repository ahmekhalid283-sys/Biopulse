"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Trophy,
  ChevronLeft,
  ArrowRight,
  Clock,
  Users,
  ClipboardList,
  RefreshCw,
  HelpCircle,
  Plus,
  Trash2,
  Pencil,
  Layers,
  Send,
  UserCheck,
  Eye,
  X,
  CheckCircle2,
} from "lucide-react";

type Challenge = {
  id: string;
  title: string;
  description: string | null;
  challenge_type: "individual" | "team";
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
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
};

export default function ChallengeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const challengeId = params.id as string;

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewAnswers, setReviewAnswers] = useState<ReviewAnswer[]>([]);
  const [reviewMeta, setReviewMeta] = useState<ParticipantRow | null>(null);
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
      fetchChallengeQuestions();
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
        await fetchChallengeQuestions();
      }
    } finally {
      setLoading(false);
    }
  }

  function mapQuestion(q: any): Question {
    return {
      id: q.id,
      question_text: q.question,
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

  async function fetchChallengeQuestions() {
    const { data: roundsData } = await supabase
      .from("challenge_rounds")
      .select("id")
      .eq("challenge_id", challengeId);

    if (!roundsData || roundsData.length === 0) {
      setQuestions([]);
      return;
    }

    const roundIds = roundsData.map((r) => r.id);

    const { data: links } = await supabase
      .from("challenge_round_questions")
      .select("question_id, question_order")
      .in("round_id", roundIds)
      .order("question_order", { ascending: true });

    if (!links || links.length === 0) {
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

    setQuestions(data.map(mapQuestion));
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

    const mapped = data
      .sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0))
      .map(mapQuestion);

    setQuestions(mapped);
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
        setParticipants([]);
        return;
      }

      const participantIds = [
        ...new Set(attempts.map((a) => a.participant_id).filter(Boolean)),
      ];
      const roundIds = [
        ...new Set(attempts.map((a) => a.round_id).filter(Boolean)),
      ] as string[];
      const attemptIds = attempts.map((a) => a.id);

      const [{ data: parts }, { data: roundsData }, { data: answerRows }] =
        await Promise.all([
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
          attemptIds.length
            ? supabase
                .from("challenge_attempt_answers")
                .select("attempt_id, marks_awarded, is_correct, question_id")
                .in("attempt_id", attemptIds)
            : Promise.resolve({ data: [] as any[] }),
        ]);

      const qIds = [...new Set((answerRows || []).map((a) => a.question_id))];
      const { data: qTypes } = qIds.length
        ? await supabase
            .from("challenge_questions")
            .select("id, question_type")
            .in("id", qIds)
        : { data: [] as any[] };
      const typeMap = new Map((qTypes || []).map((q) => [q.id, q.question_type]));

      const partToStudent = new Map(
        (parts || []).map((p: any) => [p.id, p.student_id])
      );
      const studentIds = [
        ...new Set([...partToStudent.values()].filter(Boolean)),
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
        (roundsData || []).map((r: any) => [r.id, r.title])
      );

      const pendingSet = new Set<string>();
      for (const row of answerRows || []) {
        if (
          typeMap.get(row.question_id) === "written" &&
          Number(row.marks_awarded || 0) === 0
        ) {
          pendingSet.add(row.attempt_id);
        }
      }

      const mapped: ParticipantRow[] = attempts.map((a) => {
        const studentId = partToStudent.get(a.participant_id) || "";
        return {
          attemptId: a.id,
          studentId,
          studentName: nameMap.get(studentId) || "طالب",
          roundId: a.round_id,
          roundTitle: a.round_id
            ? roundMap.get(a.round_id) || "دور"
            : "بدون دور",
          score: a.score,
          totalScore: a.total_score,
          percentage: a.percentage,
          finishedAt: a.finished_at,
          pendingWritten: pendingSet.has(a.id),
        };
      });

      setParticipants(mapped);
    } finally {
      setLoadingParticipants(false);
    }
  }

  async function openReview(attemptId: string) {
    const meta = participants.find((p) => p.attemptId === attemptId) || null;
    setReviewMeta(meta);
    setReviewOpen(true);
    setReviewLoading(true);

    try {
      const { data: answers, error } = await supabase
        .from("challenge_attempt_answers")
        .select(
          "id, question_id, student_answer, selected_option, is_correct, marks_awarded, question_order"
        )
        .eq("attempt_id", attemptId)
        .order("question_order", { ascending: true });

      if (error || !answers) {
        setReviewAnswers([]);
        return;
      }

      const qIds = answers.map((a) => a.question_id);
      const { data: qs } = await supabase
        .from("challenge_questions")
        .select(
          "id, question, question_type, marks, correct_answer, option_a, option_b, option_c, option_d"
        )
        .in("id", qIds);

      const qMap = new Map((qs || []).map((q) => [q.id, q]));

      setReviewAnswers(
        answers.map((a) => {
          const q = qMap.get(a.question_id);
          return {
            ...a,
            question: q?.question,
            question_type: q?.question_type,
            marks: Number(q?.marks || 0),
            correct_answer: q?.correct_answer,
            option_a: q?.option_a,
            option_b: q?.option_b,
            option_c: q?.option_c,
            option_d: q?.option_d,
          };
        })
      );
    } finally {
      setReviewLoading(false);
    }
  }

  function updateLocalGrade(
    answerId: string,
    marks: number,
    isCorrect: boolean
  ) {
    setReviewAnswers((prev) =>
      prev.map((a) =>
        a.id === answerId
          ? {
              ...a,
              marks_awarded: marks,
              is_correct: isCorrect,
            }
          : a
      )
    );
  }

  async function saveGrades() {
    if (!reviewMeta) return;

    try {
      setSavingGrade(true);

      for (const ans of reviewAnswers) {
        if (ans.question_type !== "written") continue;

        await supabase
          .from("challenge_attempt_answers")
          .update({
            marks_awarded: Number(ans.marks_awarded || 0),
            is_correct: !!ans.is_correct,
          })
          .eq("id", ans.id);
      }

      const totalAwarded = reviewAnswers.reduce(
        (sum, a) => sum + Number(a.marks_awarded || 0),
        0
      );
      const totalPossible = reviewAnswers.reduce(
        (sum, a) => sum + Number(a.marks || 0),
        0
      );
      const percentage =
        totalPossible > 0
          ? Number(((totalAwarded / totalPossible) * 100).toFixed(2))
          : 0;

      await supabase
        .from("challenge_attempts")
        .update({
          score: totalAwarded,
          total_score: totalPossible,
          percentage,
        })
        .eq("id", reviewMeta.attemptId);

      alert("تم حفظ التصحيح وتحديث نتيجة الطالب");
      setReviewOpen(false);
      loadParticipants();
    } catch (err: any) {
      alert(err?.message || "فشل حفظ التصحيح");
    } finally {
      setSavingGrade(false);
    }
  }

  async function publishChallenge() {
    try {
      setPublishing(true);

      const { error } = await supabase
        .from("challenges")
        .update({ status: "registration" })
        .eq("id", challengeId);

      if (error) {
        alert("فشل النشر: " + error.message);
        return;
      }

      alert("تم فتح التحدي للطلاب بنجاح");
      setChallenge((prev) =>
        prev ? { ...prev, status: "registration" } : prev
      );
    } catch (err: any) {
      alert("حدث خطأ أثناء النشر: " + err.message);
    } finally {
      setPublishing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070b14]">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-[#070b14] p-8 text-center text-white"
      >
        <h1 className="text-xl font-bold">التحدي غير موجود</h1>
        <button
          onClick={() => router.push("/admin/challenges")}
          className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold"
        >
          العودة للقائمة
        </button>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#070b14] p-6 text-white sm:p-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
              <span className="text-blue-400">BioPulse</span>
              <ChevronLeft className="h-4 w-4" />
              <span
                className="cursor-pointer hover:text-slate-300"
                onClick={() => router.push("/admin/challenges")}
              >
                التحديات
              </span>
              <ChevronLeft className="h-4 w-4" />
              <span>إدارة التحدي</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold">{challenge.title}</h1>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-bold ${
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
              <Users className="h-4 w-4" />
              إدارة الأدوار
            </button>

            {!isVisibleToStudents && (
              <button
                onClick={publishChallenge}
                disabled={publishing}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {publishing ? "جاري النشر..." : "نشر التحدي"}
              </button>
            )}

            <button
              onClick={() => router.push(`/admin/challenges/${challengeId}/edit`)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-slate-700"
            >
              <Pencil className="h-4 w-4" />
              تعديل التحدي
            </button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <p className="text-xs text-slate-400">نوع التحدي</p>
            <p className="mt-1 text-lg font-bold">
              {challenge.challenge_type === "team" ? "فرق" : "فردي"}
            </p>
          </div>
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

        {/* Rounds Section */}
        {rounds.length > 0 && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">أدوار التحدي (المراحل)</h2>
                <p className="mt-1 text-sm text-slate-400">
                  اختر دوراً لعرض تفاصيله أو أسئلته
                </p>
              </div>
              <button
                onClick={() => router.push(`/admin/challenges/${challengeId}/rounds`)}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-slate-700"
              >
                <Layers className="h-4 w-4" />
                إدارة الأدوار
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {rounds.map((round) => {
                const isSelected = selectedRoundId === round.id;
                return (
                  <button
                    key={round.id}
                    onClick={() => setSelectedRoundId(round.id)}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-right transition ${
                      isSelected
                        ? "border-blue-500 bg-blue-500/15 text-blue-300"
                        : "border-slate-800 bg-slate-800/40 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-xs font-bold">
                      {round.round_number}
                    </span>
                    <div>
                      <p className="text-sm font-bold">{round.title}</p>
                      <p className="text-xs text-slate-400">
                        {round.duration_minutes || 0} دقيقة • حد النجاح:{" "}
                        {round.passing_score || 0}%
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Questions Section Button */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold">أسئلة التحدي</h2>
              <p className="mt-1 text-sm text-slate-400">
                عرض وإضافة وتعديل أسئلة{" "}
                {selectedRoundId
                  ? rounds.find((r) => r.id === selectedRoundId)?.title
                  : "التحدي"}
              </p>
            </div>
            <button
              onClick={() => {
                const q = selectedRoundId ? `?roundId=${selectedRoundId}` : "";
                router.push(`/admin/challenges/${challengeId}/questions${q}`);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-500"
            >
              <ClipboardList className="h-4 w-4" />
              أسئلة التحدي
            </button>
          </div>
        </section>

        {/* Participants & Results Section */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">نتائج ومشاركات الطلاب</h2>
              <p className="mt-1 text-sm text-slate-400">
                متابعة المحاولات ودرجات الطلاب وتصحيح الأسئلة المقالية
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
                  <th className="pb-3">الدور / المرحلة</th>
                  <th className="pb-3">الدرجة</th>
                  <th className="pb-3">النسبة</th>
                  <th className="pb-3">وقت الانتهاء</th>
                  <th className="pb-3">الحالة</th>
                  <th className="pb-3 pl-4 text-left">الإجراءات</th>
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
                      لا توجد مشاركات أو محاولات حتى الآن
                    </td>
                  </tr>
                ) : (
                  participants.map((p) => (
                    <tr key={p.attemptId} className="hover:bg-slate-800/30">
                      <td className="py-3.5 pr-4 font-bold">
                        {p.studentName}
                      </td>
                      <td className="py-3.5 text-slate-300">{p.roundTitle}</td>
                      <td className="py-3.5 text-slate-300">
                        {p.score !== null ? `${p.score} / ${p.totalScore}` : "--"}
                      </td>
                      <td className="py-3.5 font-bold text-cyan-400">
                        {p.percentage !== null ? `${p.percentage}%` : "--"}
                      </td>
                      <td className="py-3.5 text-xs text-slate-400">
                        {p.finishedAt
                          ? new Date(p.finishedAt).toLocaleString("ar-EG")
                          : "قيد الاختبار"}
                      </td>
                      <td className="py-3.5">
                        {p.pendingWritten ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-400">
                            <Clock className="h-3 w-3" />
                            بانتظار التصحيح المقالي
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" />
                            مصحح
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 pl-4 text-left">
                        <button
                          onClick={() => openReview(p.attemptId)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600/20 px-3 py-1.5 text-xs font-bold text-blue-400 hover:bg-blue-600/30"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          مراجعة وتصحيح
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

      {/* Review & Grading Modal */}
      {reviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-800 bg-[#090d16] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold">
                  مراجعة محاولة: {reviewMeta?.studentName}
                </h3>
                <p className="text-xs text-slate-400">
                  {reviewMeta?.roundTitle} • النسبة الحالية:{" "}
                  {reviewMeta?.percentage ?? 0}%
                </p>
              </div>
              <button
                onClick={() => setReviewOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-6">
              {reviewLoading ? (
                <div className="py-12 text-center text-slate-500">
                  جاري جلب تفاصيل الإجابات...
                </div>
              ) : reviewAnswers.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  لا توجد إجابات مسجلة لهذه المحاولة
                </div>
              ) : (
                reviewAnswers.map((ans, idx) => (
                  <div
                    key={ans.id}
                    className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>السؤال {idx + 1}</span>
                      <span className="font-bold text-slate-300">
                        الدرجة الكلية: {ans.marks} درجات
                      </span>
                    </div>

                    <p className="font-bold text-white">{ans.question}</p>

                    {/* Student Answer details */}
                    <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-3 text-sm">
                      <p className="text-xs text-slate-500">إجابة الطالب:</p>
                      <p className="mt-1 font-medium text-slate-200">
                        {ans.student_answer || "بدون إجابة"}
                      </p>
                    </div>

                    {/* Correct Answer details for automated questions */}
                    {ans.question_type !== "written" && (
                      <div className="text-xs text-slate-400 flex items-center gap-2">
                        <span>الإجابة الصحيحة:</span>
                        <span className="font-bold text-emerald-400">
                          {ans.correct_answer}
                        </span>
                        <span className="mr-auto font-bold">
                          {ans.is_correct ? "صحيح (درجة كاملة)" : "خطأ (صفر)"}
                        </span>
                      </div>
                    )}

                    {/* Grading section for written questions */}
                    {ans.question_type === "written" && (
                      <div className="mt-3 border-t border-slate-800 pt-3 flex flex-wrap items-center justify-between gap-3">
                        <span className="text-xs font-bold text-amber-400">
                          سؤال مقالي يحتاج تصحيح يدوي
                        </span>
                        <div className="flex items-center gap-3">
                          <label className="text-xs text-slate-400">
                            الدرجة الممنوحة:
                          </label>
                          <input
                            type="number"
                            max={ans.marks}
                            min={0}
                            value={ans.marks_awarded ?? 0}
                            onChange={(e) =>
                              updateLocalGrade(
                                ans.id,
                                Number(e.target.value),
                                Number(e.target.value) > 0
                              )
                            }
                            className="w-20 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-center text-sm font-bold text-white outline-none focus:border-blue-500"
                          />
                          <span className="text-xs text-slate-500">
                            / {ans.marks}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                onClick={() => setReviewOpen(false)}
                className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-slate-800"
              >
                إلغاء
              </button>
              <button
                onClick={saveGrades}
                disabled={savingGrade || reviewLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-50"
              >
                {savingGrade ? "جاري الحفظ..." : "حفظ التصحيح وتحديث النتيجة"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}