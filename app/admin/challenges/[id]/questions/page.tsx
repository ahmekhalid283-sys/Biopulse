"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ArrowRight,
  Plus,
  Pencil,
  Trash2,
  HelpCircle,
  ClipboardList,
} from "lucide-react";

type QuestionType = "mcq" | "true_false" | "written";

type Question = {
  id: string;
  question: string;
  question_type: QuestionType;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  marks: number;
  explanation: string | null;
};

export default function ChallengeQuestionsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const challengeId = params.id as string;
  const roundId = searchParams.get("roundId");

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [roundTitle, setRoundTitle] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    question_type: "mcq" as QuestionType,
    question: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_answer: "A",
    explanation: "",
    marks: 5,
    difficulty: "متوسط",
  });

  useEffect(() => {
    loadQuestions();
  }, [challengeId, roundId]);

  async function loadQuestions() {
    try {
      setLoading(true);

      if (roundId) {
        const { data: round } = await supabase
          .from("challenge_rounds")
          .select("title")
          .eq("id", roundId)
          .maybeSingle();
        setRoundTitle(round?.title || "");

        const { data: links } = await supabase
          .from("challenge_round_questions")
          .select("question_id, question_order")
          .eq("round_id", roundId)
          .order("question_order", { ascending: true });

        if (!links?.length) {
          setQuestions([]);
          return;
        }

        const ids = links.map((l) => l.question_id);
        const { data } = await supabase
          .from("challenge_questions")
          .select("*")
          .in("id", ids);

        const orderMap = new Map(
          links.map((l) => [l.question_id, l.question_order ?? 0])
        );

        const sorted = (data || []).sort(
          (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0)
        );

        setQuestions(sorted as Question[]);
      } else {
        setQuestions([]);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!form.question.trim()) {
      alert("اكتب نص السؤال");
      return;
    }

    try {
      setSubmitting(true);

      let option_a = form.option_a.trim() || "-";
      let option_b = form.option_b.trim() || "-";
      let option_c = form.option_c.trim() || "-";
      let option_d = form.option_d.trim() || "-";
      let correct = form.correct_answer;
      let explanation = form.explanation.trim() || null;

      if (form.question_type === "true_false") {
        option_a = "صح";
        option_b = "خطأ";
        option_c = "-";
        option_d = "-";
        correct =
          form.correct_answer === "خطأ" || form.correct_answer === "B"
            ? "B"
            : "A";
      }

      if (form.question_type === "written") {
        option_a = option_b = option_c = option_d = "-";
        correct = "A";
        explanation = form.correct_answer.trim() || form.explanation.trim() || null;
      }

      const { data: inserted, error } = await supabase
        .from("challenge_questions")
        .insert([
          {
            question: form.question.trim(),
            question_type: form.question_type,
            option_a,
            option_b,
            option_c,
            option_d,
            correct_answer: correct,
            explanation,
            marks: Number(form.marks),
            difficulty: form.difficulty,
          },
        ])
        .select("id")
        .single();

      if (error || !inserted) {
        alert("فشل الإضافة: " + (error?.message || ""));
        return;
      }

      if (roundId) {
        const { count } = await supabase
          .from("challenge_round_questions")
          .select("*", { count: "exact", head: true })
          .eq("round_id", roundId);

        await supabase.from("challenge_round_questions").insert({
          round_id: roundId,
          question_id: inserted.id,
          question_order: (count || 0) + 1,
        });
      }

      setShowForm(false);
      setForm({
        question_type: "mcq",
        question: "",
        option_a: "",
        option_b: "",
        option_c: "",
        option_d: "",
        correct_answer: "A",
        explanation: "",
        marks: 5,
        difficulty: "متوسط",
      });
      loadQuestions();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("حذف السؤال؟")) return;

    if (roundId) {
      await supabase
        .from("challenge_round_questions")
        .delete()
        .eq("round_id", roundId)
        .eq("question_id", id);
    }

    await supabase.from("challenge_questions").delete().eq("id", id);
    loadQuestions();
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#070b14] p-6 text-white sm:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">أسئلة التحدي</h1>
            <p className="mt-1 text-sm text-slate-400">
              {roundTitle ? `الدور: ${roundTitle}` : "إدارة الأسئلة"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowForm((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-500"
            >
              <Plus className="h-4 w-4" />
              {showForm ? "إغلاق النموذج" : "إضافة سؤال"}
            </button>

            <button
              onClick={() => router.push(`/admin/challenges/${challengeId}`)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-slate-800"
            >
              <ArrowRight className="h-4 w-4" />
              رجوع
            </button>
          </div>
        </div>

        {showForm && (
          <form
            onSubmit={handleAddQuestion}
            className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-5"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { value: "mcq", label: "MCQ" },
                { value: "true_false", label: "صح وخطأ" },
                { value: "written", label: "مقالي" },
              ].map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      question_type: t.value as QuestionType,
                      correct_answer:
                        t.value === "true_false"
                          ? "صح"
                          : t.value === "mcq"
                            ? "A"
                            : "",
                    })
                  }
                  className={`rounded-xl border p-3 text-sm font-bold ${
                    form.question_type === t.value
                      ? "border-blue-500 bg-blue-500/10 text-blue-300"
                      : "border-slate-700 bg-slate-800 text-slate-300"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <textarea
              value={form.question}
              onChange={(e) => setForm({ ...form, question: e.target.value })}
              rows={3}
              required
              placeholder="نص السؤال..."
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />

            {form.question_type === "mcq" && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(["a", "b", "c", "d"] as const).map((letter) => (
                  <input
                    key={letter}
                    value={form[`option_${letter}`]}
                    onChange={(e) =>
                      setForm({ ...form, [`option_${letter}`]: e.target.value })
                    }
                    placeholder={`الخيار ${letter.toUpperCase()}`}
                    className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                ))}
              </div>
            )}

            {form.question_type === "true_false" && (
              <div className="flex gap-3">
                {["صح", "خطأ"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setForm({ ...form, correct_answer: opt })}
                    className={`flex-1 rounded-xl border py-3 text-sm font-bold ${
                      form.correct_answer === opt
                        ? "border-blue-500 bg-blue-500/15 text-blue-300"
                        : "border-slate-700 bg-slate-800"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {form.question_type === "mcq" && (
              <select
                value={form.correct_answer}
                onChange={(e) =>
                  setForm({ ...form, correct_answer: e.target.value })
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm"
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            )}

            {form.question_type === "written" && (
              <textarea
                value={form.correct_answer}
                onChange={(e) =>
                  setForm({ ...form, correct_answer: e.target.value })
                }
                rows={2}
                placeholder="نموذج الإجابة (اختياري)"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm"
              />
            )}

            <input
              type="number"
              min={1}
              value={form.marks}
              onChange={(e) =>
                setForm({ ...form, marks: Number(e.target.value) })
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm"
              placeholder="الدرجات"
            />

            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {submitting ? "جاري الإضافة..." : "حفظ السؤال"}
            </button>
          </form>
        )}

        {loading ? (
          <p className="text-center text-slate-400">جاري التحميل...</p>
        ) : questions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 p-12 text-center">
            <HelpCircle className="mx-auto h-10 w-10 text-slate-600" />
            <p className="mt-3 font-bold text-slate-300">لا توجد أسئلة</p>
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map((q, index) => (
              <div
                key={q.id}
                className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60"
              >
                <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <ClipboardList className="h-4 w-4" />
                    <span>سؤال {index + 1}</span>
                    <span>• {q.marks} درجة</span>
                    <span>
                      •{" "}
                      {q.question_type === "written"
                        ? "مقالي"
                        : q.question_type === "true_false"
                          ? "صح/خطأ"
                          : "MCQ"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        router.push(
                          `/admin/challenges/${challengeId}/questions/${q.id}/edit`
                        )
                      }
                      className="rounded-lg bg-blue-500/15 p-2 text-blue-400"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="rounded-lg bg-red-500/15 p-2 text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <p className="font-bold">{q.question}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}