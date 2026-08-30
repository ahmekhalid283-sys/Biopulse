"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ArrowRight,
  ChevronLeft,
  Layers,
  RefreshCw,
  Trophy,
  UserCheck,
  Users,
} from "lucide-react";

type Round = {
  id: string;
  round_number: number;
  title: string;
  qualified_count: number | null;
};

type AttemptRow = {
  id: string;
  student_id: string;
  score: number | null;
  total: number | null;
  percentage: number | null;
  status: string | null;
  students?: {
    full_name: string | null;
  } | null;
};

export default function AdvanceStudentsPage() {
  const params = useParams();
  const router = useRouter();
  const challengeId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<string>("");
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(
    new Set()
  );
  const [alreadyQualified, setAlreadyQualified] = useState<Set<string>>(
    new Set()
  );
  const [challengeTitle, setChallengeTitle] = useState("");

  useEffect(() => {
    if (challengeId) loadRounds();
  }, [challengeId]);

  useEffect(() => {
    if (selectedRoundId) loadAttemptsAndEntries();
  }, [selectedRoundId]);

  async function loadRounds() {
    try {
      setLoading(true);

      const [{ data: challenge }, { data: roundsData }] = await Promise.all([
        supabase
          .from("challenges")
          .select("title")
          .eq("id", challengeId)
          .single(),
        supabase
          .from("challenge_rounds")
          .select("id, round_number, title, qualified_count")
          .eq("challenge_id", challengeId)
          .order("round_number", { ascending: true }),
      ]);

      setChallengeTitle(challenge?.title || "");
      const list = roundsData || [];
      setRounds(list);

      if (list.length > 0) {
        setSelectedRoundId(list[0].id);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadAttemptsAndEntries() {
    try {
      setLoading(true);

      const currentIndex = rounds.findIndex((r) => r.id === selectedRoundId);
      const nextRound = currentIndex >= 0 ? rounds[currentIndex + 1] : null;

      // 1) المحاولات
      const { data: attemptsData, error: attemptsError } = await supabase
        .from("challenge_attempts")
        .select(
          "id, participant_id, score, total_score, percentage, started_at, finished_at"
        )
        .eq("challenge_id", challengeId)
        .eq("round_id", selectedRoundId)
        .order("percentage", { ascending: false });

      if (attemptsError) {
        console.error("Attempts error:", JSON.stringify(attemptsError, null, 2));
        setAttempts([]);
        return;
      }

      const rows = attemptsData || [];
      const participantIds = [
        ...new Set(rows.map((r) => r.participant_id).filter(Boolean)),
      ];

      // 2) participant → student
      let participantToStudent = new Map<string, string>();
      if (participantIds.length > 0) {
        const { data: parts } = await supabase
          .from("challenge_participants")
          .select("id, student_id")
          .in("id", participantIds);

        participantToStudent = new Map(
          (parts || []).map((p) => [p.id, p.student_id])
        );
      }

      const studentIds = [
        ...new Set([...participantToStudent.values()].filter(Boolean)),
      ];

      // 3) أسماء الطلاب
      let nameMap = new Map<string, string>();
      if (studentIds.length > 0) {
        const { data: studentsData } = await supabase
          .from("students")
          .select("id, full_name")
          .in("id", studentIds);

        nameMap = new Map(
          (studentsData || []).map((s) => [s.id, s.full_name || "طالب"])
        );
      }

      const mapped: AttemptRow[] = rows
        .map((r) => {
          const studentId = participantToStudent.get(r.participant_id) || "";
          return {
            id: r.id,
            student_id: studentId,
            score: r.score,
            total: r.total_score,
            percentage: r.percentage,
            status: r.finished_at ? "submitted" : "pending",
            students: {
              full_name: nameMap.get(studentId) || "طالب",
            },
          };
        })
        .filter((r) => r.student_id);

      setAttempts(mapped);

      // 4) المتأهلين للدور التالي أو فائزين الدور النهائي
      if (nextRound) {
        const { data: entries } = await supabase
          .from("challenge_round_entries")
          .select("student_id")
          .eq("challenge_id", challengeId)
          .eq("round_id", nextRound.id)
          .eq("status", "qualified");

        const set = new Set((entries || []).map((e) => e.student_id));
        setAlreadyQualified(set);
        setSelectedStudents(new Set(set));
      } else {
        const { data: winners } = await supabase
          .from("challenge_participants")
          .select("student_id")
          .eq("challenge_id", challengeId)
          .eq("final_rank", 1);

        const set = new Set((winners || []).map((w) => w.student_id));
        setAlreadyQualified(set);
        setSelectedStudents(new Set(set));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const currentRound = rounds.find((r) => r.id === selectedRoundId);
  const currentIndex = rounds.findIndex((r) => r.id === selectedRoundId);
  const nextRound = currentIndex >= 0 ? rounds[currentIndex + 1] : null;

  const uniqueAttempts = useMemo(() => {
    const map = new Map<string, AttemptRow>();
    for (const row of attempts) {
      const prev = map.get(row.student_id);
      if (!prev || Number(row.percentage || 0) > Number(prev.percentage || 0)) {
        map.set(row.student_id, row);
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => Number(b.percentage || 0) - Number(a.percentage || 0)
    );
  }, [attempts]);

  function toggleStudent(studentId: string) {
    setSelectedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  }

  function selectTop() {
    const limit = currentRound?.qualified_count || uniqueAttempts.length;
    const top = uniqueAttempts.slice(0, limit).map((a) => a.student_id);
    setSelectedStudents(new Set(top));
  }

  async function saveAdvancement() {
    if (!nextRound) {
      alert("مفيش دور تالي — ده آخر دور");
      return;
    }

    if (selectedStudents.size === 0) {
      alert("اختار طالب واحد على الأقل");
      return;
    }

    const ok = confirm(
      `تأهيل ${selectedStudents.size} طالب للدور: ${nextRound.title}؟`
    );
    if (!ok) return;

    try {
      setSaving(true);

      const allStudentIds = uniqueAttempts.map((a) => a.student_id);

      const qualifiedPayload = Array.from(selectedStudents).map(
        (studentId) => ({
          challenge_id: challengeId,
          round_id: nextRound.id,
          student_id: studentId,
          status: "qualified",
        })
      );

      const eliminatedPayload = allStudentIds
        .filter((id) => !selectedStudents.has(id))
        .map((studentId) => ({
          challenge_id: challengeId,
          round_id: nextRound.id,
          student_id: studentId,
          status: "eliminated",
        }));

      await supabase
        .from("challenge_round_entries")
        .delete()
        .eq("challenge_id", challengeId)
        .eq("round_id", nextRound.id);

      const { error: qError } = await supabase
        .from("challenge_round_entries")
        .insert([...qualifiedPayload, ...eliminatedPayload]);

      if (qError) {
        alert("فشل الحفظ: " + qError.message);
        return;
      }

      // 1) إشعار عام
      const generalNotifs = Array.from(selectedStudents).map((studentId) => ({
        student_id: studentId,
        title: "تم تأهلك 🎉",
        message: `مبروك! تم تأهلك للدور التالي: ${nextRound.title}`,
        type: "announcement",
        link: `/challenges/${challengeId}`,
        is_read: false,
      }));
      const { error: n1 } = await supabase
        .from("notifications")
        .insert(generalNotifs);
      if (n1) {
        console.error("notifications error:", JSON.stringify(n1, null, 2));
        alert("notifications: " + (n1.message || JSON.stringify(n1)));
      }

      // 2) إشعار مرتبط بالتحدي
      const challengeNotifs = Array.from(selectedStudents).map((studentId) => ({
        student_id: studentId,
        challenge_id: challengeId,
        title: "تم تأهلك 🎉",
        message: `مبروك! تم تأهلك للدور التالي: ${nextRound.title}`,
        type: "announcement",
      }));
      const { error: n2 } = await supabase
        .from("challenge_notifications")
        .insert(challengeNotifs);
      if (n2) {
        console.error("challenge_notifications error:", JSON.stringify(n2, null, 2));
        alert("challenge_notifications: " + (n2.message || JSON.stringify(n2)));
      }

      alert("تم حفظ المتأهلين وإرسال الإشعارات بنجاح");
      loadAttemptsAndEntries();
    } catch (err: any) {
      alert(err?.message || "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }

  async function declareWinners() {
    if (selectedStudents.size === 0) {
      alert("اختار فائز واحد على الأقل");
      return;
    }

    const ok = confirm(`تتويج ${selectedStudents.size} فائز وإنهاء التحدي؟`);
    if (!ok) return;

    try {
      setSaving(true);

      const { data: allParts } = await supabase
        .from("challenge_participants")
        .select("id, student_id")
        .eq("challenge_id", challengeId);

      if (allParts?.length) {
        await supabase
          .from("challenge_participants")
          .update({ final_rank: null })
          .eq("challenge_id", challengeId);
      }

      for (const studentId of selectedStudents) {
        await supabase
          .from("challenge_participants")
          .update({ final_rank: 1 })
          .eq("challenge_id", challengeId)
          .eq("student_id", studentId);
      }

      await supabase
        .from("challenges")
        .update({ status: "finished" })
        .eq("id", challengeId);

      alert("تم تتويج الفائز وإنهاء التحدي 🏆");
      router.push(`/admin/challenges/${challengeId}`);
    } catch (err: any) {
      alert(err?.message || "فشل التتويج");
    } finally {
      setSaving(false);
    }
  }

  if (loading && rounds.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070b14] text-white">
        <RefreshCw className="h-7 w-7 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#070b14] p-6 text-white sm:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
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
              <span
                className="cursor-pointer hover:text-slate-300"
                onClick={() =>
                  router.push(`/admin/challenges/${challengeId}`)
                }
              >
                {challengeTitle || "التحدي"}
              </span>
              <ChevronLeft className="h-4 w-4" />
              <span>تأهيل المتأهلين</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600">
                <UserCheck className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold sm:text-3xl">
                  اختيار المتأهلين
                </h1>
                <p className="mt-1 text-sm text-slate-400">
                  اختار الطلاب اللي هينتقلوا للدور التالي
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => router.push(`/admin/challenges/${challengeId}`)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-slate-800"
          >
            <ArrowRight className="h-4 w-4" />
            رجوع
          </button>
        </div>

        {rounds.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 p-12 text-center text-slate-400">
            التحدي مفيهوش أدوار تصفيات
          </div>
        ) : (
          <>
            {/* اختيار الدور */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-400" />
                <h2 className="font-bold">اختر الدور المنتهي</h2>
              </div>

              <div className="flex flex-wrap gap-2">
                {rounds.map((round, index) => (
                  <button
                    key={round.id}
                    onClick={() => setSelectedRoundId(round.id)}
                    className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                      selectedRoundId === round.id
                        ? "bg-blue-600 text-white"
                        : "border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    {round.title}
                    {index < rounds.length - 1 && (
                      <span className="mr-2 text-xs opacity-70">
                        → {rounds[index + 1]?.title}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </section>

            {/* ملخص */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                <p className="text-xs text-slate-500">الدور الحالي</p>
                <p className="mt-1 font-bold">{currentRound?.title || "—"}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                <p className="text-xs text-slate-500">الدور التالي</p>
                <p className="mt-1 font-bold">
                  {nextRound?.title || "لا يوجد (آخر دور)"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                <p className="text-xs text-slate-500">محدد للتأهيل</p>
                <p className="mt-1 font-bold">
                  {selectedStudents.size}
                  {currentRound?.qualified_count
                    ? ` / ${currentRound.qualified_count}`
                    : ""}
                </p>
              </div>
            </div>

            {/* قائمة الطلاب */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  <h2 className="font-bold">
                    طلاب الدور ({uniqueAttempts.length})
                  </h2>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={selectTop}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"
                  >
                    اختيار الأعلى حسب العدد المحدد
                  </button>
                  <button
                    onClick={() =>
                      setSelectedStudents(
                        new Set(uniqueAttempts.map((a) => a.student_id))
                      )
                    }
                    className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"
                  >
                    تحديد الكل
                  </button>
                  <button
                    onClick={() => setSelectedStudents(new Set())}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"
                  >
                    إلغاء الكل
                  </button>
                </div>
              </div>

              {uniqueAttempts.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  لا توجد محاولات في هذا الدور بعد
                </div>
              ) : (
                <div className="space-y-2">
                  {uniqueAttempts.map((row, index) => {
                    const checked = selectedStudents.has(row.student_id);
                    const wasQualified = alreadyQualified.has(row.student_id);
                    const name =
                      row.students?.full_name ||
                      `طالب ${row.student_id.slice(0, 6)}`;

                    return (
                      <label
                        key={row.student_id}
                        className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 transition ${
                          checked
                            ? "border-blue-500/40 bg-blue-500/10"
                            : "border-slate-800 bg-slate-950/40 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleStudent(row.student_id)}
                            className="h-4 w-4"
                          />
                          <div>
                            <p className="font-bold">
                              <span className="ml-2 text-slate-500">
                                #{index + 1}
                              </span>
                              {name}
                              {wasQualified && (
                                <span className="mr-2 text-xs text-emerald-400">
                                  (متأهل سابقًا)
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-500">
                              الحالة: {row.status || "—"}
                            </p>
                          </div>
                        </div>

                        <div className="text-left">
                          <p className="text-sm font-bold text-white">
                            {row.percentage != null
                              ? `${Number(row.percentage).toFixed(1)}%`
                              : "—"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {row.score != null && row.total != null
                              ? `${row.score}/${row.total}`
                              : "بانتظار التصحيح"}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </section>

            {/* حفظ / تتويج */}
            {!nextRound ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-l from-amber-500/10 to-yellow-500/5 p-5">
                  <h3 className="text-lg font-bold text-amber-300">هذا الدور النهائي</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    اختار الفائز (أو أكثر من فائز) ثم اضغط تتويج
                  </p>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => router.push(`/admin/challenges/${challengeId}`)}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-bold text-slate-300 hover:bg-slate-800"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={declareWinners}
                    disabled={saving || selectedStudents.size === 0}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-amber-500 to-yellow-400 px-5 py-3 text-sm font-bold text-slate-950 hover:opacity-90 disabled:opacity-50"
                  >
                    🏆 تتويج الفائز
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-end gap-3">
                <button
                  onClick={() =>
                    router.push(`/admin/challenges/${challengeId}`)
                  }
                  className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-bold text-slate-300 hover:bg-slate-800"
                >
                  إلغاء
                </button>
                <button
                  onClick={saveAdvancement}
                  disabled={saving || !nextRound}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  <Trophy className="h-4 w-4" />
                  {saving
                    ? "جاري الحفظ..."
                    : nextRound
                      ? `تأهيل للدور: ${nextRound.title}`
                      : "لا يوجد دور تالي"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}