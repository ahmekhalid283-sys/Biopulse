"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowRight, Save } from "lucide-react";

type QuestionType = "mcq" | "true_false" | "written";

export default function EditQuestionPage() {
  const router = useRouter();
  const params = useParams();
  const challengeId = params.id as string;
  const questionId = params.questionId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
    if (!questionId) return;

    async function fetchQuestion() {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("challenge_questions")
          .select("*")
          .eq("id", questionId)
          .single();

        if (error) throw error;

        if (data) {
          const type = (data.question_type || "mcq") as QuestionType;

          let correctDisplay = data.correct_answer || "A";
          if (type === "true_false") {
            correctDisplay =
              data.correct_answer === "B" || data.correct_answer === "خطأ"
                ? "خطأ"
                : "صح";
          }
          if (type === "written") {
            correctDisplay = data.explanation || "";
          }

          setForm({
            question_type: type,
            question: data.question || "",
            option_a: data.option_a === "-" ? "" : data.option_a || "",
            option_b: data.option_b === "-" ? "" : data.option_b || "",
            option_c: data.option_c === "-" ? "" : data.option_c || "",
            option_d: data.option_d === "-" ? "" : data.option_d || "",
            correct_answer: correctDisplay,
            explanation: type === "written" ? "" : data.explanation || "",
            marks: Number(data.marks) || 5,
            difficulty: data.difficulty || "متوسط",
          });
        }
      } catch (err: any) {
        console.error(err);
        alert("حدث خطأ أثناء تحميل السؤال: " + (err?.message || "خطأ"));
        router.push(`/admin/challenges/${challengeId}`);
      } finally {
        setLoading(false);
      }
    }

    fetchQuestion();
  }, [questionId, challengeId, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.question.trim()) {
      alert("يرجى إدخال نص السؤال");
      return;
    }

    if (form.question_type === "mcq") {
      if (!form.option_a.trim() || !form.option_b.trim()) {
        alert("الخيار A و B مطلوبين");
        return;
      }
    }

    try {
      setSaving(true);

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
        option_a = "-";
        option_b = "-";
        option_c = "-";
        option_d = "-";
        correct = "A";
        explanation = form.correct_answer.trim() || null;
      }

      if (form.question_type === "mcq") {
        correct = form.correct_answer; // A/B/C/D
      }

      const { error } = await supabase
        .from("challenge_questions")
        .update({
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
        })
        .eq("id", questionId);

      if (error) {
        console.error(error);
        alert("خطأ: " + error.message);
        return;
      }

      alert("تم تحديث السؤال بنجاح");
      router.push(`/admin/challenges/${challengeId}`);
    } catch (err: any) {
      alert("حدث خطأ غير متوقع: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#070b14] text-white"
      >
        <p className="font-bold text-slate-400">جاري تحميل السؤال...</p>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#070b14] p-6 text-white sm:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">تعديل السؤال</h1>
            <p className="mt-1 text-sm text-slate-400">
              عدّل البيانات ثم احفظ
            </p>
          </div>

          <button
            onClick={() => router.push(`/admin/challenges/${challengeId}`)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-slate-800"
          >
            <ArrowRight className="h-4 w-4" />
            رجوع
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/50 p-6"
        >
          {/* نوع السؤال */}
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-400">
              نوع السؤال
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { value: "mcq", label: "اختيار من متعدد" },
                { value: "true_false", label: "صح وخطأ" },
                { value: "written", label: "مقالي" },
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      question_type: type.value as QuestionType,
                      correct_answer:
                        type.value === "true_false"
                          ? "صح"
                          : type.value === "mcq"
                            ? "A"
                            : form.correct_answer,
                    })
                  }
                  className={`rounded-xl border p-3 text-sm font-bold transition ${
                    form.question_type === type.value
                      ? "border-blue-500 bg-blue-500/10 text-blue-300"
                      : "border-slate-700 bg-slate-800 text-slate-300"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-slate-400">
              نص السؤال *
            </label>
            <textarea
              value={form.question}
              onChange={(e) => setForm({ ...form, question: e.target.value })}
              rows={3}
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>

          {form.question_type === "mcq" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(["a", "b", "c", "d"] as const).map((letter) => (
                <div key={letter}>
                  <label className="mb-1 block text-sm font-bold text-slate-400">
                    الخيار {letter.toUpperCase()}
                  </label>
                  <input
                    type="text"
                    value={form[`option_${letter}`]}
                    onChange={(e) =>
                      setForm({ ...form, [`option_${letter}`]: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500"
                  />
                </div>
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
                      : "border-slate-700 bg-slate-800 text-slate-300"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {form.question_type === "written" && (
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-400">
                نموذج الإجابة / مفتاح التصحيح
              </label>
              <textarea
                value={form.correct_answer}
                onChange={(e) =>
                  setForm({ ...form, correct_answer: e.target.value })
                }
                rows={2}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
              />
            </div>
          )}

          {form.question_type === "mcq" && (
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-400">
                الإجابة الصحيحة
              </label>
              <select
                value={form.correct_answer}
                onChange={(e) =>
                  setForm({ ...form, correct_answer: e.target.value })
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500"
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-400">
                الدرجات
              </label>
              <input
                type="number"
                min={1}
                value={form.marks}
                onChange={(e) =>
                  setForm({ ...form, marks: Number(e.target.value) })
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-400">
                الصعوبة
              </label>
              <select
                value={form.difficulty}
                onChange={(e) =>
                  setForm({ ...form, difficulty: e.target.value })
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500"
              >
                <option value="سهل">سهل</option>
                <option value="متوسط">متوسط</option>
                <option value="صعب">صعب</option>
              </select>
            </div>
          </div>

          {form.question_type !== "written" && (
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-400">
                شرح الإجابة
              </label>
              <textarea
                value={form.explanation}
                onChange={(e) =>
                  setForm({ ...form, explanation: e.target.value })
                }
                rows={2}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={() => router.push(`/admin/challenges/${challengeId}`)}
              className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-2.5 text-sm font-bold text-slate-300 hover:bg-slate-800"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}