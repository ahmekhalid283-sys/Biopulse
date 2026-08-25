"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Plus, ArrowRight } from "lucide-react";

type QuestionType = "mcq" | "true_false" | "written";

export default function ChallengeQuestionsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const challengeId = params.id as string;
  const roundId = searchParams.get("roundId");

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.question.trim()) {
      alert("يرجى إدخال نص السؤال");
      return;
    }

    // تحقق حسب النوع
    if (form.question_type === "mcq") {
      if (!form.option_a.trim() || !form.option_b.trim()) {
        alert("في أسئلة الاختيار من متعدد: الخيار A و B مطلوبين");
        return;
      }
    }

    try {
      setSubmitting(true);

      let option_a = form.option_a.trim() || "-";
      let option_b = form.option_b.trim() || "-";
      let option_c = form.option_c.trim() || "-";
      let option_d = form.option_d.trim() || "-";
      let correct = form.correct_answer;

      if (form.question_type === "true_false") {
        option_a = "صح";
        option_b = "خطأ";
        option_c = "-";
        option_d = "-";
        correct = form.correct_answer === "خطأ" || form.correct_answer === "B" ? "B" : "A";
      }

      if (form.question_type === "written") {
        option_a = "-";
        option_b = "-";
        option_c = "-";
        option_d = "-";
        correct = "A"; // إجباري بسبب الـ CHECK constraint
      }

      const { data: inserted, error: insertError } = await supabase
        .from("challenge_questions")
        .insert([
          {
            question: form.question.trim(),
            question_type: form.question_type,
            option_a,
            option_b,
            option_c,
            option_d,
            correct_answer: correct, // دائمًا A/B/C/D
            explanation:
              form.question_type === "written"
                ? form.correct_answer.trim() || form.explanation.trim() || null
                : form.explanation.trim() || null,
            marks: Number(form.marks),
            difficulty: form.difficulty,
          },
        ])
        .select("id")
        .single();

      if (insertError || !inserted) {
        console.error("Insert error full:", JSON.stringify(insertError, null, 2));
        alert(
          [
            "فشل إضافة السؤال",
            `code: ${insertError?.code}`,
            `message: ${insertError?.message}`,
            `details: ${insertError?.details}`,
            `hint: ${insertError?.hint}`,
          ].join("\n")
        );
        return;
      }

      // ربط بالدور لو تصفيات
      if (roundId) {
        const { count } = await supabase
          .from("challenge_round_questions")
          .select("*", { count: "exact", head: true })
          .eq("round_id", roundId);

        const { error: linkError } = await supabase
          .from("challenge_round_questions")
          .insert({
            round_id: roundId,
            question_id: inserted.id,
            question_order: (count || 0) + 1,
          });

        if (linkError) {
          console.error("Link error full:", JSON.stringify(linkError, null, 2));
          alert(
            [
              "تم إضافة السؤال لكن فشل ربطه بالدور",
              `code: ${linkError?.code}`,
              `message: ${linkError?.message}`,
              `details: ${linkError?.details}`,
              `hint: ${linkError?.hint}`,
            ].join("\n")
          );
          return;
        }
      }

      alert("تم إضافة السؤال بنجاح");
      router.push(`/admin/challenges/${challengeId}`);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "حدث خطأ غير متوقع");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#070b14] p-6 text-white sm:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">إضافة سؤال</h1>
            <p className="mt-1 text-sm text-slate-400">
              {roundId
                ? "السؤال سيتم ربطه بدور التصفيات المختار"
                : "إضافة سؤال للتحدي"}
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
              نوع السؤال *
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { value: "mcq", label: "اختيار من متعدد", desc: "MCQ" },
                { value: "true_false", label: "صح وخطأ", desc: "T&F" },
                { value: "written", label: "مقالي", desc: "Written" },
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      question_type: type.value as QuestionType,
                      correct_answer:
                        type.value === "true_false" ? "صح" : type.value === "mcq" ? "A" : "",
                    })
                  }
                  className={`rounded-xl border p-4 text-right transition ${
                    form.question_type === type.value
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                  }`}
                >
                  <div className="font-bold">{type.label}</div>
                  <div className="mt-1 text-xs text-slate-500">{type.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* نص السؤال */}
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
              placeholder="اكتب السؤال هنا..."
            />
          </div>

          {/* MCQ Options */}
          {form.question_type === "mcq" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(["a", "b", "c", "d"] as const).map((letter) => (
                <div key={letter}>
                  <label className="mb-1 block text-sm font-bold text-slate-400">
                    الخيار {letter.toUpperCase()}
                    {letter === "a" || letter === "b" ? " *" : ""}
                  </label>
                  <input
                    type="text"
                    value={form[`option_${letter}`]}
                    onChange={(e) =>
                      setForm({ ...form, [`option_${letter}`]: e.target.value })
                    }
                    required={letter === "a" || letter === "b"}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500"
                    placeholder={`الخيار ${letter.toUpperCase()}`}
                  />
                </div>
              ))}
            </div>
          )}

          {/* True / False */}
          {form.question_type === "true_false" && (
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-400">
                الإجابة الصحيحة *
              </label>
              <div className="flex gap-3">
                {["صح", "خطأ"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setForm({ ...form, correct_answer: opt })}
                    className={`flex-1 rounded-xl border py-3 text-sm font-bold transition ${
                      form.correct_answer === opt
                        ? "border-blue-500 bg-blue-500/15 text-blue-300"
                        : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Written */}
          {form.question_type === "written" && (
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-400">
                نموذج الإجابة / مفتاح التصحيح (اختياري)
              </label>
              <textarea
                value={form.correct_answer}
                onChange={(e) =>
                  setForm({ ...form, correct_answer: e.target.value })
                }
                rows={2}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                placeholder="نقاط يجب أن يذكرها الطالب في إجابته..."
              />
            </div>
          )}

          {/* MCQ correct answer */}
          {form.question_type === "mcq" && (
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-400">
                الإجابة الصحيحة *
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

          <div>
            <label className="mb-1 block text-sm font-bold text-slate-400">
              شرح الإجابة (اختياري)
            </label>
            <textarea
              value={form.explanation}
              onChange={(e) =>
                setForm({ ...form, explanation: e.target.value })
              }
              rows={2}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
              placeholder="شرح مختصر..."
            />
          </div>

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
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {submitting ? "جاري الإضافة..." : "إضافة السؤال"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}