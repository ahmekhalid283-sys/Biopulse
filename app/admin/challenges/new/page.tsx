"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Trophy, ChevronLeft, Save, ArrowRight } from "lucide-react";

export default function NewChallengePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    challenge_type: "individual" as "individual" | "team",
    difficulty: "متوسط",
    category: "البيولوجيا الجزيئية",
    registration_start: "",
    registration_end: "",
    start_at: "",
    end_at: "",
    duration_minutes: 30,
    questions_count: 20,
    passing_score: 50,
    allow_retake: false,
    public_results: true,
    show_leaderboard: true,
    min_team_size: 1,
    max_team_size: 4,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      alert("يرجى إدخال عنوان التحدي");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("challenges")
        .insert([
          {
            title: form.title,
            description: form.description,
            challenge_type: form.challenge_type,
            difficulty: form.difficulty,
            status: "draft",
            registration_start: form.registration_start || null,
            registration_end: form.registration_end || null,
            start_at: form.start_at || null,
            end_at: form.end_at || null,
            duration_minutes: Number(form.duration_minutes),
            questions_count: Number(form.questions_count),
            passing_score: Number(form.passing_score),
            allow_retake: form.allow_retake,
            public_results: form.public_results,
            show_leaderboard: form.show_leaderboard,
            min_team_size: form.challenge_type === "team" ? Number(form.min_team_size) : null,
            max_team_size: form.challenge_type === "team" ? Number(form.max_team_size) : null,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Supabase Error Details:", JSON.stringify(error, null, 2));
        alert(
          [
            `الكود: ${error.code || "غير معروف"}`,
            `الرسالة: ${error.message || "لا توجد رسالة"}`,
            `التفاصيل: ${error.details || "لا توجد تفاصيل"}`,
            `التلميح: ${error.hint || "لا يوجد تلميح"}`,
          ].join("\n")
        );
        return;
      }

      alert("تم إنشاء التحدي بنجاح!");
      router.push(`/admin/challenges/${data.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f8fa] p-6 sm:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
              <span>BioPulse</span>
              <ChevronLeft className="h-4 w-4" />
              <span 
                className="cursor-pointer hover:text-slate-600"
                onClick={() => router.push("/admin/challenges")}
              >
                تحديات BioPulse
              </span>
              <ChevronLeft className="h-4 w-4" />
              <span>إنشاء تحدي جديد</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">
              إنشاء تحدي جديد
            </h1>
          </div>

          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowRight className="h-4 w-4" />
            العودة
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="space-y-4">
            <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3">
              المعلومات الأساسية
            </h2>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                عنوان التحدي *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="مثال: تحدي البيولوجيا الجزيئية - الموسم الأول"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-950 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                وصف التحدي
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="اكتب وصفاً مختصراً لأهداف التحدي..."
                rows={3}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-950 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  نوع التحدي
                </label>
                <select
                  value={form.challenge_type}
                  onChange={(e) =>
                    setForm({ ...form, challenge_type: e.target.value as "individual" | "team" })
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-950 focus:outline-none bg-white"
                >
                  <option value="individual">فردي (طالب ضد طالب)</option>
                  <option value="team">جماعي (فرق)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  مستوى الصعوبة
                </label>
                <select
                  value={form.difficulty}
                  onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-950 focus:outline-none bg-white"
                >
                  <option value="سهل">سهل</option>
                  <option value="متوسط">متوسط</option>
                  <option value="صعب">صعب</option>
                  <option value="تحدي كبير">تحدي كبير</option>
                </select>
              </div>
            </div>
          </div>

          {/* Timings */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3">
              المواعيد والتوقيتات
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  بداية التسجيل
                </label>
                <input
                  type="datetime-local"
                  value={form.registration_start}
                  onChange={(e) => setForm({ ...form, registration_start: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-950 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  نهاية التسجيل
                </label>
                <input
                  type="datetime-local"
                  value={form.registration_end}
                  onChange={(e) => setForm({ ...form, registration_end: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-950 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  بداية الاختبار/التحدي
                </label>
                <input
                  type="datetime-local"
                  value={form.start_at}
                  onChange={(e) => setForm({ ...form, start_at: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-950 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  نهاية التحدي
                </label>
                <input
                  type="datetime-local"
                  value={form.end_at}
                  onChange={(e) => setForm({ ...form, end_at: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-950 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Settings & Rules */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3">
              إعدادات الاختبار
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  مدة الاختبار (بالدقائق)
                </label>
                <input
                  type="number"
                  value={form.duration_minutes}
                  onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-950 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  عدد الأسئلة
                </label>
                <input
                  type="number"
                  value={form.questions_count}
                  onChange={(e) => setForm({ ...form, questions_count: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-950 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  درجة النجاح (%)
                </label>
                <input
                  type="number"
                  value={form.passing_score}
                  onChange={(e) => setForm({ ...form, passing_score: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-950 focus:outline-none"
                />
              </div>
            </div>

            {form.challenge_type === "team" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    الحد الأدنى لأعضاء الفريق
                  </label>
                  <input
                    type="number"
                    value={form.min_team_size}
                    onChange={(e) => setForm({ ...form, min_team_size: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-950 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    الحد الأقصى لأعضاء الفريق
                  </label>
                  <input
                    type="number"
                    value={form.max_team_size}
                    onChange={(e) => setForm({ ...form, max_team_size: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-950 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.allow_retake}
                  onChange={(e) => setForm({ ...form, allow_retake: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-950"
                />
                <span className="text-sm font-bold text-slate-700">السماح بإعادة المحاولة</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.public_results}
                  onChange={(e) => setForm({ ...form, public_results: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-950"
                />
                <span className="text-sm font-bold text-slate-700">إظهار النتائج العامة للطلاب</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.show_leaderboard}
                  onChange={(e) => setForm({ ...form, show_leaderboard: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-950"
                />
                <span className="text-sm font-bold text-slate-700">تفعيل لوحة الترتيب (Leaderboard)</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {loading ? "جاري الحفظ..." : "حفظ وإنشاء التحدي"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}