"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ChevronLeft, Save, ArrowRight } from "lucide-react";

export default function EditChallengePage() {
  const router = useRouter();
  const params = useParams();
  const challengeId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    difficulty: "متوسط",
    registration_start: "",
    registration_end: "",
    start_at: "",
    end_at: "",
    duration_minutes: 30,
    passing_score: 50,
    allow_retake: false,
    public_results: true,
    show_leaderboard: true,
  });

  function toLocalInput(value: string | null) {
    if (!value) return "";
    const date = new Date(value);
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60 * 1000);
    return local.toISOString().slice(0, 16);
  }

  useEffect(() => {
    if (!challengeId) return;

    async function fetchChallenge() {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("challenges")
          .select("*")
          .eq("id", challengeId)
          .single();

        if (error) throw error;

        if (data) {
          setForm({
            title: data.title || "",
            description: data.description || "",
            difficulty: data.difficulty || "متوسط",
            registration_start: toLocalInput(data.registration_start),
            registration_end: toLocalInput(data.registration_end),
            start_at: toLocalInput(data.start_at),
            end_at: toLocalInput(data.end_at),
            duration_minutes: data.duration_minutes ?? 30,
            passing_score: data.passing_score ?? 50,
            allow_retake: data.allow_retake ?? false,
            public_results: data.public_results ?? true,
            show_leaderboard: data.show_leaderboard ?? true,
          });
        }
      } catch (err: any) {
        console.error(err);
        alert("حدث خطأ أثناء تحميل بيانات التحدي: " + err.message);
        router.push("/admin/challenges");
      } finally {
        setLoading(false);
      }
    }

    fetchChallenge();
  }, [challengeId, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      alert("يرجى إدخال عنوان التحدي");
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from("challenges")
        .update({
          title: form.title.trim(),
          description: form.description.trim() || null,
          challenge_type: "individual",
          type: "individual",
          difficulty: form.difficulty,
          registration_start: form.registration_start || null,
          registration_end: form.registration_end || null,
          start_at: form.start_at || null,
          end_at: form.end_at || null,
          duration_minutes: Number(form.duration_minutes),
          passing_score: Number(form.passing_score),
          allow_retake: form.allow_retake,
          public_results: form.public_results,
          show_leaderboard: form.show_leaderboard,
          min_team_size: null,
          max_team_size: null,
        })
        .eq("id", challengeId);

      if (error) {
        console.error(error);
        alert("خطأ: " + error.message);
        return;
      }

      alert("تم تحديث التحدي بنجاح");
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
        <p className="font-bold text-slate-400">جاري تحميل بيانات التحدي...</p>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#070b14] p-6 text-white sm:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
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
              <span>تعديل</span>
            </div>
            <h1 className="text-3xl font-bold">تعديل التحدي</h1>
            <p className="mt-1 text-sm text-slate-400">التحديات فردية فقط</p>
          </div>

          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-slate-800"
          >
            <ArrowRight className="h-4 w-4" />
            رجوع
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-lg font-bold">المعلومات الأساسية</h2>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-400">
                عنوان التحدي *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-400">
                الوصف
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-400">
                مستوى الصعوبة
              </label>
              <select
                value={form.difficulty}
                onChange={(e) =>
                  setForm({ ...form, difficulty: e.target.value })
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
              >
                <option value="سهل">سهل</option>
                <option value="متوسط">متوسط</option>
                <option value="صعب">صعب</option>
                <option value="تحدي كبير">تحدي كبير</option>
              </select>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-lg font-bold">المواعيد</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-bold text-slate-400">
                  بداية التسجيل
                </label>
                <input
                  type="datetime-local"
                  value={form.registration_start}
                  onChange={(e) =>
                    setForm({ ...form, registration_start: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-slate-400">
                  نهاية التسجيل
                </label>
                <input
                  type="datetime-local"
                  value={form.registration_end}
                  onChange={(e) =>
                    setForm({ ...form, registration_end: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-slate-400">
                  بداية التحدي
                </label>
                <input
                  type="datetime-local"
                  value={form.start_at}
                  onChange={(e) =>
                    setForm({ ...form, start_at: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-slate-400">
                  نهاية التحدي
                </label>
                <input
                  type="datetime-local"
                  value={form.end_at}
                  onChange={(e) =>
                    setForm({ ...form, end_at: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-lg font-bold">إعدادات الاختبار</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-bold text-slate-400">
                  المدة (دقيقة)
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.duration_minutes}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      duration_minutes: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-slate-400">
                  درجة النجاح %
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.passing_score}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      passing_score: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {[
                { key: "allow_retake", label: "السماح بإعادة المحاولة" },
                { key: "public_results", label: "إظهار النتائج للطلاب" },
                { key: "show_leaderboard", label: "تفعيل لوحة المتصدرين" },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex cursor-pointer items-center gap-3"
                >
                  <input
                    type="checkbox"
                    checked={(form as any)[item.key]}
                    onChange={(e) =>
                      setForm({ ...form, [item.key]: e.target.checked })
                    }
                    className="h-4 w-4 rounded"
                  />
                  <span className="text-sm">{item.label}</span>
                </label>
              ))}
            </div>
          </section>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-xl border border-slate-700 bg-slate-900 px-6 py-3 text-sm font-bold text-slate-300 hover:bg-slate-800"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-50"
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