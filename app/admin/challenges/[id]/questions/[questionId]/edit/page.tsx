"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowRight, Save } from "lucide-react";

export default function EditQuestionPage() {
  const router = useRouter();
  const params = useParams();
  const challengeId = params.id as string;
  const questionId = params.questionId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    question_text: "",
    question_type: "mcq" as "mcq" | "true_false" | "essay",
    options: ["", "", "", ""],
    correct_answer: "",
    points: 5,
  });

  useEffect(() => {
    if (!questionId) return;

    async function fetchQuestion() {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("questions")
          .select("*")
          .eq("id", questionId)
          .single();

        if (error) throw error;

        if (data) {
          // لو الخيارات أقل من 4 نكملها بفاضي
          const options = Array.isArray(data.options) ? [...data.options] : [];
          while (options.length < 4) {
            options.push("");
          }

          setForm({
            question_text: data.question_text || "",
            question_type: data.question_type || "mcq",
            options: options.slice(0, 4),
            correct_answer: data.correct_answer || "",
            points: data.points ?? 5,
          });
        }
      } catch (err: any) {
        console.error(err);
        alert("حدث خطأ أثناء تحميل السؤال: " + err.message);
        router.push(`/admin/challenges/${challengeId}`);
      } finally {
        setLoading(false);
      }
    }

    fetchQuestion();
  }, [questionId, challengeId, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.question_text.trim()) {
      alert("يرجى إدخال نص السؤال");
      return;
    }

    try {
      setSaving(true);

      const finalOptions =
        form.question_type === "essay"
          ? []
          : form.question_type === "true_false"
          ? ["صح", "خطأ"]
          : form.options.filter(Boolean);

      const { error } = await supabase
        .from("questions")
        .update({
          question_text: form.question_text,
          question_type: form.question_type,
          options: finalOptions,
          correct_answer: form.correct_answer,
          points: Number(form.points),
        })
        .eq("id", questionId);

      if (error) {
        console.error("Supabase Error:", JSON.stringify(error, null, 2));
        alert(`خطأ من قاعدة البيانات: ${error.message}`);
        return;
      }

      alert("تم تحديث السؤال بنجاح!");
      router.push(`/admin/challenges/${challengeId}`);
    } catch (err: any) {
      alert("حدث خطأ غير متوقع: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main dir="rtl" className="min-h-screen bg-[#f7f8fa] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-slate-300 border-t-slate-950 rounded-full mx-auto mb-4"></div>
          <p className="text-slate-500 font-bold">جاري تحميل السؤال...</p>
        </div>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f8fa] p-6 sm:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">
              تعديل السؤال
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              قم بتعديل بيانات السؤال ثم احفظ التغييرات.
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

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                نص السؤال *
              </label>
              <textarea
                value={form.question_text}
                onChange={(e) =>
                  setForm({ ...form, question_text: e.target.value })
                }
                placeholder="اكتب السؤال هنا..."
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-950 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  نوع السؤال
                </label>
                <select
                  value={form.question_type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      question_type: e.target.value as
                        | "mcq"
                        | "true_false"
                        | "essay",
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-slate-950 focus:outline-none bg-white"
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
                  value={form.points}
                  onChange={(e) =>
                    setForm({ ...form, points: Number(e.target.value) })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-950 focus:outline-none"
                />
              </div>
            </div>

            {form.question_type === "mcq" && (
              <div className="space-y-3 pt-2">
                <label className="block text-sm font-bold text-slate-700">
                  الخيارات (اكتب الخيارات وحدد الإجابة الصحيحة بالأسفل)
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {form.options.map((opt, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...form.options];
                        newOpts[idx] = e.target.value;
                        setForm({ ...form, options: newOpts });
                      }}
                      placeholder={`الخيار ${idx + 1}`}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-slate-950 focus:outline-none"
                    />
                  ))}
                </div>
              </div>
            )}

            {form.question_type === "true_false" && (
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
                value={form.correct_answer}
                onChange={(e) =>
                  setForm({ ...form, correct_answer: e.target.value })
                }
                placeholder={
                  form.question_type === "true_false"
                    ? "اكتب 'صح' أو 'خطأ'"
                    : "اكتب النص المطابق تماماً للإجابة الصحيحة"
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-950 focus:outline-none"
                required={form.question_type !== "essay"}
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
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
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