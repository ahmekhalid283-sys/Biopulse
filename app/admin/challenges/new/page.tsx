"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Trophy,
  ChevronLeft,
  ArrowRight,
  Plus,
  Trash2,
  Layers,
  Zap,
} from "lucide-react";

type Mode = "normal" | "elimination";

type Round = {
  round_number: number;
  title: string;
  participant_limit: number;
  qualified_count: number;
  duration_minutes: number;
  passing_score: number;
};

export default function NewChallengePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [mode, setMode] = useState<Mode>("normal");

  const [form, setForm] = useState({
    title: "",
    description: "",
    difficulty: "متوسط",
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
  });

  const [rounds, setRounds] = useState<Round[]>([]);

  function updateForm<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addRound() {
    const next = rounds.length + 1;

    const titles = [
      "دور الـ 64",
      "دور الـ 32",
      "دور الـ 16",
      "ربع النهائي",
      "نصف النهائي",
      "النهائي",
    ];

    const prevQualified = rounds[rounds.length - 1]?.qualified_count || 64;

    const newRound: Round = {
      round_number: next,
      title: titles[next - 1] || `الدور ${next}`,
      participant_limit: next === 1 ? 64 : prevQualified,
      qualified_count:
        next === 1 ? 32 : Math.max(1, Math.floor(prevQualified / 2)),
      duration_minutes: form.duration_minutes,
      passing_score: form.passing_score,
    };

    setRounds((prev) => [...prev, newRound]);
  }

  function updateRound(index: number, key: keyof Round, value: string | number) {
    setRounds((prev) =>
      prev.map((round, i) =>
        i === index
          ? {
              ...round,
              [key]: key === "title" ? value : Number(value),
            }
          : round
      )
    );
  }

  function removeRound(index: number) {
    setRounds((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((round, i) => ({ ...round, round_number: i + 1 }))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("يرجى إدخال عنوان التحدي");
      return;
    }

    if (mode === "elimination" && rounds.length === 0) {
      alert("أضف دور واحد على الأقل لنظام التصفيات");
      return;
    }

    try {
      setLoading(true);

      const payload: any = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        challenge_type: "individual",
        type: "individual",
        difficulty: form.difficulty,
        status: "draft",

        registration_start: form.registration_start || null,
        registration_end: form.registration_end || null,
        registration_opens_at: form.registration_start || null,
        registration_closes_at: form.registration_end || null,

        start_at: form.start_at || null,
        end_at: form.end_at || null,
        starts_at: form.start_at || null,
        ends_at: form.end_at || null,

        duration_minutes: Number(form.duration_minutes),
        questions_count: Number(form.questions_count),
        question_count: Number(form.questions_count),
        passing_score: Number(form.passing_score),

        allow_retake: form.allow_retake,
        allow_retry: form.allow_retake,
        public_results: form.public_results,
        show_public_results: form.public_results,
        show_leaderboard: form.show_leaderboard,
        show_participant_ranking: form.show_leaderboard,

        total_rounds: mode === "elimination" ? rounds.length : 1,
        qualified_count:
          mode === "elimination"
            ? rounds[rounds.length - 1]?.qualified_count || 1
            : null,
      };

      const { data: challenge, error: challengeError } = await supabase
        .from("challenges")
        .insert([payload])
        .select()
        .single();

      if (challengeError) {
        console.error(challengeError);
        alert(challengeError.message || "فشل إنشاء التحدي");
        return;
      }

      if (mode === "elimination" && rounds.length > 0) {
        const roundsPayload = rounds.map((round) => ({
          challenge_id: challenge.id,
          round_number: round.round_number,
          title: round.title.trim(),
          participant_limit: Number(round.participant_limit),
          qualified_count: Number(round.qualified_count),
          duration_minutes: Number(round.duration_minutes),
          passing_score: Number(round.passing_score),
          status: round.round_number === 1 ? "upcoming" : "draft",
          use_tie_question: false,
        }));

        const { error: roundsError } = await supabase
          .from("challenge_rounds")
          .insert(roundsPayload);

        if (roundsError) {
          console.error(roundsError);
          await supabase.from("challenges").delete().eq("id", challenge.id);
          alert("فشل إنشاء أدوار التصفيات: " + roundsError.message);
          return;
        }
      }

      alert(
        mode === "elimination"
          ? "تم إنشاء البطولة ونظام التصفيات بنجاح"
          : "تم إنشاء التحدي بنجاح"
      );

      router.push(`/admin/challenges/${challenge.id}`);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#070b14] p-6 text-white sm:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
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
              <span>إنشاء جديد</span>
            </div>
            <h1 className="text-3xl font-bold">إنشاء تحدي جديد</h1>
            <p className="mt-1 text-sm text-slate-400">
              تحدي سريع أو بطولة تصفيات احترافية
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-slate-800"
          >
            <ArrowRight className="h-4 w-4" />
            رجوع
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mode Selection */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMode("normal")}
              className={`rounded-2xl border p-5 text-right transition ${
                mode === "normal"
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-bold">تحدي سريع</div>
                  <div className="mt-1 text-xs text-slate-400">
                    اختبار واحد لجميع المشاركين
                  </div>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode("elimination")}
              className={`rounded-2xl border p-5 text-right transition ${
                mode === "elimination"
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400">
                  <Layers className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-bold">بطولة تصفيات</div>
                  <div className="mt-1 text-xs text-slate-400">
                    أدوار متتالية زي كأس العالم
                  </div>
                </div>
              </div>
            </button>
          </section>

          {/* Basic Info */}
          <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-lg font-bold">المعلومات الأساسية</h2>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-400">
                عنوان التحدي *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateForm("title", e.target.value)}
                placeholder="مثال: بطولة BioPulse للخلية"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-400">
                الوصف
              </label>
              <textarea
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                rows={3}
                placeholder="وصف مختصر للتحدي..."
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-400">
                مستوى الصعوبة
              </label>
              <select
                value={form.difficulty}
                onChange={(e) => updateForm("difficulty", e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
              >
                <option value="سهل">سهل</option>
                <option value="متوسط">متوسط</option>
                <option value="صعب">صعب</option>
                <option value="تحدي كبير">تحدي كبير</option>
              </select>
            </div>
          </section>

          {/* Normal Settings */}
          {mode === "normal" && (
            <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
              <h2 className="text-lg font-bold">إعدادات الاختبار</h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-400">
                    المدة (دقيقة)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.duration_minutes}
                    onChange={(e) =>
                      updateForm("duration_minutes", Number(e.target.value))
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-400">
                    عدد الأسئلة
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.questions_count}
                    onChange={(e) =>
                      updateForm("questions_count", Number(e.target.value))
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
                      updateForm("passing_score", Number(e.target.value))
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </section>
          )}

          {/* Elimination Rounds */}
          {mode === "elimination" && (
            <section className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">أدوار التصفيات</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    كل دور له إعداداته الخاصة
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addRound}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-500"
                >
                  <Plus className="h-4 w-4" />
                  إضافة دور
                </button>
              </div>

              {rounds.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center">
                  <Layers className="mx-auto h-8 w-8 text-slate-600" />
                  <p className="mt-3 text-sm font-bold text-slate-400">
                    لا توجد أدوار بعد
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {rounds.map((round, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-slate-700 bg-slate-800/50 p-5"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold">
                            {round.round_number}
                          </div>
                          <div>
                            <h3 className="font-bold">{round.title}</h3>
                            <p className="text-xs text-slate-500">
                              إعدادات الدور
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeRound(index)}
                          className="rounded-xl bg-red-500/15 p-2 text-red-400 hover:bg-red-500/25"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-xs font-bold text-slate-400">
                            اسم الدور
                          </label>
                          <input
                            type="text"
                            value={round.title}
                            onChange={(e) =>
                              updateRound(index, "title", e.target.value)
                            }
                            className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-bold text-slate-400">
                            حد المشاركين
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={round.participant_limit}
                            onChange={(e) =>
                              updateRound(
                                index,
                                "participant_limit",
                                Number(e.target.value)
                              )
                            }
                            className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-bold text-slate-400">
                            عدد المتأهلين
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={round.qualified_count}
                            onChange={(e) =>
                              updateRound(
                                index,
                                "qualified_count",
                                Number(e.target.value)
                              )
                            }
                            className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-bold text-slate-400">
                            المدة (دقيقة)
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={round.duration_minutes}
                            onChange={(e) =>
                              updateRound(
                                index,
                                "duration_minutes",
                                Number(e.target.value)
                              )
                            }
                            className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-bold text-slate-400">
                            درجة النجاح %
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={round.passing_score}
                            onChange={(e) =>
                              updateRound(
                                index,
                                "passing_score",
                                Number(e.target.value)
                              )
                            }
                            className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {rounds.length > 0 && (
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm">
                  <p className="font-bold text-blue-300">مسار البطولة</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {rounds.map((r, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold">
                          {r.title} → {r.qualified_count}
                        </span>
                        {i < rounds.length - 1 && (
                          <ChevronLeft className="h-4 w-4 text-blue-400" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Options */}
          <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-lg font-bold">خيارات إضافية</h2>

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={form.allow_retake}
                onChange={(e) => updateForm("allow_retake", e.target.checked)}
                className="h-4 w-4 rounded"
              />
              <span className="text-sm">السماح بإعادة المحاولة</span>
            </label>

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={form.public_results}
                onChange={(e) => updateForm("public_results", e.target.checked)}
                className="h-4 w-4 rounded"
              />
              <span className="text-sm">إظهار النتائج للطلاب</span>
            </label>

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={form.show_leaderboard}
                onChange={(e) =>
                  updateForm("show_leaderboard", e.target.checked)
                }
                className="h-4 w-4 rounded"
              />
              <span className="text-sm">تفعيل لوحة المتصدرين</span>
            </label>
          </section>

          {/* Submit */}
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
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              <Trophy className="h-4 w-4" />
              {loading ? "جاري الإنشاء..." : "إنشاء التحدي"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}