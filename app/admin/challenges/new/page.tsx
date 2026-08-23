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
} from "lucide-react";

type ChallengeType = "individual" | "team";

type Round = {
  round_number: number;
  name: string;
  participants_limit: number;
  qualified_count: number;
  questions_count: number;
  duration_minutes: number;
  passing_score: number;
};

export default function NewChallengePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    challenge_type: "individual" as ChallengeType,
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

    qualification_mode: "normal" as "normal" | "elimination",
  });

  const [rounds, setRounds] = useState<Round[]>([]);

  function updateForm<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function addRound() {
    const nextNumber = rounds.length + 1;

    const newRound: Round = {
      round_number: nextNumber,
      name:
        nextNumber === 1
          ? "دور 64"
          : nextNumber === 2
          ? "دور 32"
          : nextNumber === 3
          ? "دور 16"
          : nextNumber === 4
          ? "دور 8"
          : nextNumber === 5
          ? "نصف النهائي"
          : nextNumber === 6
          ? "النهائي"
          : `الدور ${nextNumber}`,

      participants_limit:
        nextNumber === 1
          ? 64
          : rounds[rounds.length - 1]?.qualified_count || 32,

      qualified_count:
        nextNumber === 1
          ? 32
          : Math.max(
              1,
              Math.floor(
                (rounds[rounds.length - 1]?.qualified_count || 32) / 2
              )
            ),

      questions_count: form.questions_count,
      duration_minutes: form.duration_minutes,
      passing_score: form.passing_score,
    };

    setRounds((prev) => [...prev, newRound]);
  }

  function updateRound(
    index: number,
    key: keyof Round,
    value: string | number
  ) {
    setRounds((prev) =>
      prev.map((round, i) =>
        i === index
          ? {
              ...round,
              [key]:
                key === "name"
                  ? value
                  : Number(value),
            }
          : round
      )
    );
  }

  function removeRound(index: number) {
    setRounds((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((round, i) => ({
          ...round,
          round_number: i + 1,
        }))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("يرجى إدخال عنوان التحدي");
      return;
    }

    if (
      form.qualification_mode === "elimination" &&
      rounds.length === 0
    ) {
      alert("يرجى إضافة دور واحد على الأقل للتصفيات");
      return;
    }

    try {
      setLoading(true);

      const { data: challenge, error: challengeError } = await supabase
        .from("challenges")
        .insert([
          {
            title: form.title.trim(),
            description: form.description.trim() || null,

            challenge_type: form.challenge_type,
            difficulty: form.difficulty,
            status: "draft",

            registration_start:
              form.registration_start || null,

            registration_end:
              form.registration_end || null,

            start_at:
              form.start_at || null,

            end_at:
              form.end_at || null,

            duration_minutes:
              Number(form.duration_minutes),

            questions_count:
              Number(form.questions_count),

            passing_score:
              Number(form.passing_score),

            allow_retake:
              form.allow_retake,

            public_results:
              form.public_results,

            show_leaderboard:
              form.show_leaderboard,

            min_team_size:
              form.challenge_type === "team"
                ? Number(form.min_team_size)
                : null,

            max_team_size:
              form.challenge_type === "team"
                ? Number(form.max_team_size)
                : null,
          },
        ])
        .select()
        .single();

      if (challengeError) {
        console.error(
          "Challenge creation error:",
          JSON.stringify(challengeError, null, 2)
        );

        alert(
          [
            `الكود: ${challengeError.code || "غير معروف"}`,
            `الرسالة: ${
              challengeError.message || "لا توجد رسالة"
            }`,
            `التفاصيل: ${
              challengeError.details || "لا توجد تفاصيل"
            }`,
            `التلميح: ${
              challengeError.hint || "لا يوجد تلميح"
            }`,
          ].join("\n")
        );

        return;
      }

      if (
        form.qualification_mode === "elimination" &&
        rounds.length > 0
      ) {
        const roundsPayload = rounds.map((round) => ({
          challenge_id: challenge.id,
          round_number: round.round_number,
          title: round.name.trim(),
          participant_limit: Number(round.participants_limit),
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
          console.error(
            "Rounds creation error:",
            JSON.stringify(roundsError, null, 2)
          );

          await supabase
            .from("challenges")
            .delete()
            .eq("id", challenge.id);

          alert(
            [
              "تم فشل إنشاء أدوار التصفيات.",
              "",
              `الكود: ${roundsError.code || "غير معروف"}`,
              `الرسالة: ${
                roundsError.message || "لا توجد رسالة"
              }`,
              `التفاصيل: ${
                roundsError.details || "لا توجد تفاصيل"
              }`,
              `التلميح: ${
                roundsError.hint || "لا يوجد تلميح"
              }`,
            ].join("\n")
          );

          return;
        }
      }

      alert(
        form.qualification_mode === "elimination"
          ? "تم إنشاء التحدي ونظام التصفيات بنجاح!"
          : "تم إنشاء التحدي بنجاح!"
      );

      router.push(`/admin/challenges/${challenge.id}`);
    } catch (error: any) {
      console.error(
        "Unexpected challenge creation error:",
        error
      );

      alert(
        error?.message ||
          "حدث خطأ غير متوقع أثناء إنشاء التحدي"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f7f8fa] p-6 sm:p-8"
    >
      <div className="mx-auto max-w-5xl space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
              <span>BioPulse</span>

              <ChevronLeft className="h-4 w-4" />

              <span
                className="cursor-pointer hover:text-slate-600"
                onClick={() =>
                  router.push("/admin/challenges")
                }
              >
                تحديات BioPulse
              </span>

              <ChevronLeft className="h-4 w-4" />

              <span>إنشاء تحدي جديد</span>
            </div>

            <h1 className="text-3xl font-black tracking-tight text-slate-950">
              إنشاء تحدي جديد
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              إنشاء تحدي عادي أو بطولة بنظام تصفيات متعدد الأدوار.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowRight className="h-4 w-4" />
            العودة
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >

          {/* Basic Information */}
          <section className="space-y-4">
            <h2 className="border-b border-slate-100 pb-3 text-lg font-black text-slate-900">
              المعلومات الأساسية
            </h2>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">
                عنوان التحدي *
              </label>

              <input
                type="text"
                value={form.title}
                onChange={(e) =>
                  updateForm("title", e.target.value)
                }
                placeholder="مثال: بطولة BioPulse للبيولوجيا"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-950 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">
                وصف التحدي
              </label>

              <textarea
                value={form.description}
                onChange={(e) =>
                  updateForm("description", e.target.value)
                }
                placeholder="اكتب وصفاً مختصراً للتحدي..."
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-950 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  نوع التحدي
                </label>

                <select
                  value={form.challenge_type}
                  onChange={(e) =>
                    updateForm(
                      "challenge_type",
                      e.target.value as ChallengeType
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-950 focus:outline-none"
                >
                  <option value="individual">
                    فردي
                  </option>

                  <option value="team">
                    جماعي (فرق)
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  مستوى الصعوبة
                </label>

                <select
                  value={form.difficulty}
                  onChange={(e) =>
                    updateForm(
                      "difficulty",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-950 focus:outline-none"
                >
                  <option value="سهل">سهل</option>
                  <option value="متوسط">متوسط</option>
                  <option value="صعب">صعب</option>
                  <option value="تحدي كبير">
                    تحدي كبير
                  </option>
                </select>
              </div>

            </div>
          </section>

          {/* Competition Mode */}
          <section className="space-y-4 border-t border-slate-100 pt-6">

            <div>
              <h2 className="border-b border-slate-100 pb-3 text-lg font-black text-slate-900">
                نظام البطولة
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                اختر هل التحدي عبارة عن اختبار واحد أم بطولة
                تعتمد على التصفيات والأدوار.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              <button
                type="button"
                onClick={() =>
                  updateForm(
                    "qualification_mode",
                    "normal"
                  )
                }
                className={`rounded-2xl border p-5 text-right transition ${
                  form.qualification_mode === "normal"
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Trophy className="h-6 w-6" />

                  <div>
                    <div className="font-black">
                      تحدي عادي
                    </div>

                    <div
                      className={`mt-1 text-xs ${
                        form.qualification_mode === "normal"
                          ? "text-slate-300"
                          : "text-slate-400"
                      }`}
                    >
                      اختبار واحد لجميع المشاركين
                    </div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  updateForm(
                    "qualification_mode",
                    "elimination"
                  )
                }
                className={`rounded-2xl border p-5 text-right transition ${
                  form.qualification_mode === "elimination"
                    ? "border-cyan-500 bg-cyan-50 text-slate-950"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Layers className="h-6 w-6 text-cyan-600" />

                  <div>
                    <div className="font-black">
                      نظام تصفيات
                    </div>

                    <div className="mt-1 text-xs text-slate-500">
                      أدوار متتالية والناجحون ينتقلون للدور التالي
                    </div>
                  </div>
                </div>
              </button>

            </div>
          </section>

          {/* Normal Challenge Settings */}
          {form.qualification_mode === "normal" && (
            <section className="space-y-4 border-t border-slate-100 pt-6">

              <h2 className="border-b border-slate-100 pb-3 text-lg font-black text-slate-900">
                إعدادات الاختبار
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-700">
                    مدة الاختبار
                  </label>

                  <input
                    type="number"
                    min={1}
                    value={form.duration_minutes}
                    onChange={(e) =>
                      updateForm(
                        "duration_minutes",
                        Number(e.target.value)
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-950 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-700">
                    عدد الأسئلة
                  </label>

                  <input
                    type="number"
                    min={1}
                    value={form.questions_count}
                    onChange={(e) =>
                      updateForm(
                        "questions_count",
                        Number(e.target.value)
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-950 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-700">
                    درجة النجاح %
                  </label>

                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.passing_score}
                    onChange={(e) =>
                      updateForm(
                        "passing_score",
                        Number(e.target.value)
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-950 focus:outline-none"
                  />
                </div>

              </div>
            </section>
          )}

          {/* Elimination Rounds */}
          {form.qualification_mode === "elimination" && (
            <section className="space-y-5 border-t border-slate-100 pt-6">

              <div className="flex items-center justify-between">

                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    أدوار التصفيات
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    كل دور له امتحانه وأسئلته ودرجة نجاحه الخاصة.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addRound}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  <Plus className="h-4 w-4" />
                  إضافة دور
                </button>

              </div>

              {rounds.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">

                  <Layers className="mx-auto h-8 w-8 text-slate-400" />

                  <p className="mt-3 text-sm font-bold text-slate-600">
                    لم تتم إضافة أي أدوار بعد
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    اضغط «إضافة دور» لبناء نظام التصفيات.
                  </p>

                </div>
              ) : (
                <div className="space-y-4">

                  {rounds.map((round, index) => (
                    <div
                      key={`${round.round_number}-${index}`}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                    >

                      <div className="mb-4 flex items-center justify-between">

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-cyan-400">
                            {round.round_number}
                          </div>

                          <div>
                            <h3 className="font-black text-slate-900">
                              الدور {round.round_number}
                            </h3>

                            <p className="text-xs text-slate-400">
                              إعدادات الدور والانتقال للدور التالي
                            </p>
                          </div>

                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeRound(index)
                          }
                          className="rounded-xl bg-red-50 p-2 text-red-500 transition hover:bg-red-100"
                          title="حذف الدور"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

                        {/* Round Name */}
                        <div>
                          <label className="mb-1 block text-xs font-bold text-slate-600">
                            اسم الدور
                          </label>

                          <input
                            type="text"
                            value={round.name}
                            onChange={(e) =>
                              updateRound(
                                index,
                                "name",
                                e.target.value
                              )
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-900 focus:border-slate-950 focus:outline-none"
                          />
                        </div>

                        {/* Participants */}
                        <div>
                          <label className="mb-1 block text-xs font-bold text-slate-600">
                            الحد الأقصى للمشاركين
                          </label>

                          <input
                            type="number"
                            min={1}
                            value={
                              round.participants_limit
                            }
                            onChange={(e) =>
                              updateRound(
                                index,
                                "participants_limit",
                                Number(e.target.value)
                              )
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-slate-950 focus:outline-none"
                          />
                        </div>

                        {/* Qualified */}
                        <div>
                          <label className="mb-1 block text-xs font-bold text-slate-600">
                            عدد المتأهلين للدور التالي
                          </label>

                          <input
                            type="number"
                            min={1}
                            value={
                              round.qualified_count
                            }
                            onChange={(e) =>
                              updateRound(
                                index,
                                "qualified_count",
                                Number(e.target.value)
                              )
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-slate-950 focus:outline-none"
                          />
                        </div>

                        {/* Duration */}
                        <div>
                          <label className="mb-1 block text-xs font-bold text-slate-600">
                            مدة الدور بالدقائق
                          </label>

                          <input
                            type="number"
                            min={1}
                            value={
                              round.duration_minutes
                            }
                            onChange={(e) =>
                              updateRound(
                                index,
                                "duration_minutes",
                                Number(e.target.value)
                              )
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-slate-950 focus:outline-none"
                          />
                        </div>

                        {/* Passing */}
                        <div>
                          <label className="mb-1 block text-xs font-bold text-slate-600">
                            درجة النجاح %
                          </label>

                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={
                              round.passing_score
                            }
                            onChange={(e) =>
                              updateRound(
                                index,
                                "passing_score",
                                Number(e.target.value)
                              )
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-slate-950 focus:outline-none"
                          />
                        </div>

                      </div>

                    </div>
                  ))}

                </div>
              )}

              {rounds.length > 0 && (
                <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4">

                  <div className="flex items-start gap-3">

                    <Layers className="mt-0.5 h-5 w-5 shrink-0 text-cyan-600" />

                    <div className="text-sm text-slate-700">

                      <p className="font-black text-slate-900">
                        مسار التصفيات
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-2">

                        {rounds.map((round, index) => (
                          <div
                            key={round.round_number}
                            className="flex items-center gap-2"
                          >
                            <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-black shadow-sm">
                              {round.name}
                              {" "}
                              ({round.qualified_count})
                            </span>

                            {index < rounds.length - 1 && (
                              <ChevronLeft className="h-4 w-4 text-cyan-500" />
                            )}
                          </div>
                        ))}

                      </div>

                    </div>

                  </div>

                </div>
              )}

            </section>
          )}

          {/* Team Settings */}
          {form.challenge_type === "team" && (
            <section className="space-y-4 border-t border-slate-100 pt-6">

              <h2 className="border-b border-slate-100 pb-3 text-lg font-black text-slate-900">
                إعدادات الفرق
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-700">
                    الحد الأدنى لأعضاء الفريق
                  </label>

                  <input
                    type="number"
                    min={1}
                    value={form.min_team_size}
                    onChange={(e) =>
                      updateForm(
                        "min_team_size",
                        Number(e.target.value)
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-950 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-700">
                    الحد الأقصى لأعضاء الفريق
                  </label>

                  <input
                    type="number"
                    min={1}
                    value={form.max_team_size}
                    onChange={(e) =>
                      updateForm(
                        "max_team_size",
                        Number(e.target.value)
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-950 focus:outline-none"
                  />
                </div>

              </div>
            </section>
          )}

          {/* Timings */}
          <section className="space-y-4 border-t border-slate-100 pt-6">

            <h2 className="border-b border-slate-100 pb-3 text-lg font-black text-slate-900">
              المواعيد والتوقيتات
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  بداية التسجيل
                </label>

                <input
                  type="datetime-local"
                  value={form.registration_start}
                  onChange={(e) =>
                    updateForm("registration_start", e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-950 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  نهاية التسجيل
                </label>

                <input
                  type="datetime-local"
                  value={form.registration_end}
                  onChange={(e) =>
                    updateForm("registration_end", e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-950 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  بداية التحدي
                </label>

                <input
                  type="datetime-local"
                  value={form.start_at}
                  onChange={(e) =>
                    updateForm("start_at", e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-950 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  نهاية التحدي
                </label>

                <input
                  type="datetime-local"
                  value={form.end_at}
                  onChange={(e) =>
                    updateForm("end_at", e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-950 focus:outline-none"
                />
              </div>

            </div>
          </section>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "جاري إنشاء التحدي..." : "إنشاء التحدي"}
            </button>
          </div>

        </form>
      </div>
    </main>
  );
}