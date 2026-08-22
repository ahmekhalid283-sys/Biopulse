"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Plus, ArrowRight } from "lucide-react";

export default function ChallengeQuestionsPage() {
  const router = useRouter();
  const params = useParams();
  const challengeId = params.id as string;

  const [submitting, setSubmitting] = useState(false);

  const [newQuestion, setNewQuestion] = useState({
    question_text: "",
    question_type: "mcq" as "mcq" | "true_false" | "essay",
    options: ["", "", "", ""],
    correct_answer: "",
    points: 5,
  });

  async function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!newQuestion.question_text.trim()) {
      alert("يرجى إدخال نص السؤال");
      return;
    }

    try {
      setSubmitting(true);

      const finalOptions =
        newQuestion.question_type === "essay"
          ? []
          : newQuestion.question_type === "true_false"
          ? ["صح", "خطأ"]
          : newQuestion.options.filter(Boolean);

      // 1. إضافة السؤال
      const { error: insertError } = await supabase.from("questions").insert([
        {
          challenge_id: challengeId,
          question_text: newQuestion.question_text,
          question_type: newQuestion.question_type,
          options: finalOptions,
          correct_answer: newQuestion.correct_answer,
          points: Number(newQuestion.points),
        },
      ]);

      if (insertError) {
        console.error("Insert Error:", insertError);
        alert(`خطأ في إضافة السؤال: ${insertError.message}`);
        return;
      }

      // 2. نجيب العدد الحقيقي للأسئلة
      const { count, error: countError } = await supabase
        .from("questions")
        .select("*", { count: "exact", head: true })
        .eq("challenge_id", challengeId);

      if (countError) {
        console.error("Count Error:", countError);
      }

      // 3. نحدث questions_count
      const { error: updateError } = await supabase
        .from("challenges")
        .update({ questions_count: count ?? 0 })
        .eq("id", challengeId);

      if (updateError) {
        console.error("Update Error:", updateError);
        alert("تم إضافة السؤال لكن فشل تحديث العدد: " + updateError.message);
      }

      alert("تمت إضافة السؤال بنجاح!");
      router.push(`/admin/challenges/${challengeId}`);
    } catch (err: any) {
      console.error(err);
      alert(`خطأ غير متوقع: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f8fa] p-6 sm:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">
              إضافة سؤال جديد
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              أضف سؤالاً جديداً لهذا التحدي.
            </p>
          </div>

          <button
            onClick={() => router.push(`/admin/challenges/${challengeId}`)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowRight className="h-4 w-4" />
            العودة لتفاصيل التحدي
          </button>
        </div>

        {/* Add Question Form */}
        <form
          onSubmit={handleAddQuestion}
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                نص السؤال *
              </label>
              <textarea
                value={newQuestion.question_text}
                onChange={(e) =>
                  setNewQuestion({
                    ...newQuestion,
                    question_text: e.target.value,
                  })
                }
                placeholder="اكتب السؤال هنا..."
                rows={3}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-950 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  نوع السؤال
                </label>
                <select
                  value={newQuestion.question_type}
                  onChange={(e) =>
                    setNewQuestion({
                      ...newQuestion,
                      question_type: e.target.value as
                        | "mcq"
                        | "true_false"
                        | "essay",
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-950 focus:outline-none bg-white"
                >
                  <option value="mcq">اختيار من متعدد (MCQ)</option>
                  <option value="true_false">صح وخطأ</option>
                  <option value="essay">مقالي</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  الدرجات
                </label>
                <input
                  type="number"
                  value={newQuestion.points}
                  onChange={(e) =>
                    setNewQuestion({
                      ...newQuestion,
                      points: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-950 focus:outline-none"
                />
              </div>
            </div>

            {newQuestion.question_type === "mcq" && (
              <div className="space-y-3 pt-2">
                <label className="block text-sm font-bold text-slate-700">
                  الخيارات (اكتب الخيارات وحدد الإجابة الصحيحة بالأسفل)
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {newQuestion.options.map((opt, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...newQuestion.options];
                        newOpts[idx] = e.target.value;
                        setNewQuestion({ ...newQuestion, options: newOpts });
                      }}
                      placeholder={`الخيار ${idx + 1}`}
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-slate-950 focus:outline-none"
                    />
                  ))}
                </div>
              </div>
            )}

            {newQuestion.question_type === "true_false" && (
              <div className="space-y-3 pt-2">
                <label className="block text-sm font-bold text-slate-700">
                  الخيارات المتاحة لهذا النوع ستكون تلقائياً: (صح / خطأ)
                </label>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                الإجابة الصحيحة *
              </label>
              <input
                type="text"
                value={newQuestion.correct_answer}
                onChange={(e) =>
                  setNewQuestion({
                    ...newQuestion,
                    correct_answer: e.target.value,
                  })
                }
                placeholder={
                  newQuestion.question_type === "true_false"
                    ? "اكتب 'صح' أو 'خطأ'"
                    : "اكتب النص المطابق تماماً للإجابة الصحيحة"
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-950 focus:outline-none"
                required={newQuestion.question_type !== "essay"}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push(`/admin/challenges/${challengeId}`)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              إلغاء
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
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