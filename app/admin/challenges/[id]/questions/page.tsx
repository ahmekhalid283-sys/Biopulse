"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleHelp,
  ClipboardList,
  FileText,
  Hash,
  Layers3,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Trash2,
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
  image_url: string | null;
  option_a_image: string | null;
  option_b_image: string | null;
  option_c_image: string | null;
  option_d_image: string | null;
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

  const [questionImage, setQuestionImage] = useState<File | null>(null);
  const [questionImagePreview, setQuestionImagePreview] = useState<string | null>(
    null
  );
  const [optionImages, setOptionImages] = useState<{
    a: File | null;
    b: File | null;
    c: File | null;
    d: File | null;
  }>({ a: null, b: null, c: null, d: null });
  const [optionImagePreviews, setOptionImagePreviews] = useState<{
    a: string | null;
    b: string | null;
    c: string | null;
    d: string | null;
  }>({ a: null, b: null, c: null, d: null });

  async function uploadImage(file: File, path: string) {
    const ext = file.name.split(".").pop();
    const fileName = `${path}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("challenge-images")
      .upload(fileName, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from("challenge-images")
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  function onQuestionImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setQuestionImage(file);
    setQuestionImagePreview(URL.createObjectURL(file));
  }

  function onOptionImageChange(
    key: "a" | "b" | "c" | "d",
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setOptionImages((prev) => ({ ...prev, [key]: file }));
    setOptionImagePreviews((prev) => ({
      ...prev,
      [key]: URL.createObjectURL(file),
    }));
  }

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

  function resetForm() {
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
    setQuestionImage(null);
    setQuestionImagePreview(null);
    setOptionImages({ a: null, b: null, c: null, d: null });
    setOptionImagePreviews({ a: null, b: null, c: null, d: null });
  }

  async function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault();

    if (!roundId) {
      alert("لا يوجد دور محدد — افتح الصفحة من زر أسئلة التحدي بعد اختيار الدور");
      return;
    }

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
        explanation =
          form.correct_answer.trim() || form.explanation.trim() || null;
      }

      let image_url: string | null = null;
      let option_a_image: string | null = null;
      let option_b_image: string | null = null;
      let option_c_image: string | null = null;
      let option_d_image: string | null = null;

      if (questionImage) {
        image_url = await uploadImage(questionImage, `questions/${challengeId}`);
      }
      
      // رفع صور الاختيارات فقط لو كان السؤال اختيار من متعدد (MCQ)
      if (form.question_type === "mcq") {
        if (optionImages.a) {
          option_a_image = await uploadImage(
            optionImages.a,
            `options/${challengeId}`
          );
        }
        if (optionImages.b) {
          option_b_image = await uploadImage(
            optionImages.b,
            `options/${challengeId}`
          );
        }
        if (optionImages.c) {
          option_c_image = await uploadImage(
            optionImages.c,
            `options/${challengeId}`
          );
        }
        if (optionImages.d) {
          option_d_image = await uploadImage(
            optionImages.d,
            `options/${challengeId}`
          );
        }
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
            image_url,
            option_a_image,
            option_b_image,
            option_c_image,
            option_d_image,
          },
        ])
        .select("id")
        .single();

      if (error || !inserted) {
        alert("فشل إضافة السؤال: " + (error?.message || ""));
        return;
      }

      const { data: lastLink } = await supabase
        .from("challenge_round_questions")
        .select("question_order")
        .eq("round_id", roundId)
        .order("question_order", { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextOrder = (lastLink?.question_order || 0) + 1;

      const { error: linkError } = await supabase
        .from("challenge_round_questions")
        .insert({
          round_id: roundId,
          question_id: inserted.id,
          question_order: nextOrder,
        });

      if (linkError) {
        alert("السؤال اتحفظ لكن فشل ربطه بالدور: " + linkError.message);
        return;
      }

      setShowForm(false);
      resetForm();
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

  const options = [
    { key: "A", value: form.option_a, field: "option_a" as const },
    { key: "B", value: form.option_b, field: "option_b" as const },
    { key: "C", value: form.option_c, field: "option_c" as const },
    { key: "D", value: form.option_d, field: "option_d" as const },
  ];

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#070b14] p-4 text-slate-100 sm:p-6 lg:p-10"
    >
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800 bg-[#0b111e] text-blue-400 shadow-lg">
              <CircleHelp className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                  أسئلة التحدي
                </h1>
                <Sparkles className="h-5 w-5 text-cyan-400" />
              </div>
              <p className="mt-1 text-sm text-slate-400">
                {roundTitle
                  ? `الدور: ${roundTitle}`
                  : "إدارة أسئلة التحدي وربطها بالدور"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowForm((v) => !v)}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#2563eb] px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/20 hover:bg-[#1d4ed8]"
            >
              <Plus className="h-4 w-4" />
              {showForm ? "إغلاق النموذج" : "إضافة سؤال"}
            </button>
            <button
              onClick={() => router.push(`/admin/challenges/${challengeId}`)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-800 bg-[#0b111e] px-5 py-3 text-sm font-bold text-slate-300 hover:bg-slate-900"
            >
              <ArrowRight className="h-4 w-4" />
              رجوع
            </button>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <form
            onSubmit={handleAddQuestion}
            className="mb-8 overflow-hidden rounded-3xl border border-slate-800 bg-[#0b111e] shadow-xl"
          >
            <div className="border-b border-slate-800/80 px-5 py-5 sm:px-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-black text-white">بيانات السؤال</h2>
                  <p className="mt-1 text-xs text-slate-400">
                    اختر نوع السؤال، اكتب المحتوى، وحدد الإجابة الصحيحة.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-8 p-5 sm:p-8">
              {/* Type */}
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <Layers3 className="h-5 w-5 text-blue-400" />
                  <h3 className="font-black text-white">نوع السؤال</h3>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    { value: "mcq", label: "اختيار من متعدد" },
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
                      className={`rounded-2xl border py-3.5 text-sm font-black transition ${
                        form.question_type === t.value
                          ? "border-blue-500 bg-blue-500/15 text-blue-300"
                          : "border-slate-800 bg-[#070b14] text-slate-400 hover:border-blue-500/30"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Question text */}
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <CircleHelp className="h-5 w-5 text-blue-400" />
                  <h3 className="font-black text-white">نص السؤال</h3>
                </div>
                <textarea
                  value={form.question}
                  onChange={(e) =>
                    setForm({ ...form, question: e.target.value })
                  }
                  rows={4}
                  required
                  placeholder="اكتب نص السؤال هنا..."
                  className="w-full resize-none rounded-2xl border border-slate-800 bg-[#070b14] px-4 py-4 text-sm leading-7 text-white outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </section>

              {/* Question image */}
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-purple-400" />
                  <h3 className="font-black text-white">صورة السؤال</h3>
                  <span className="text-xs text-slate-500">اختياري</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={onQuestionImageChange}
                  className="block w-full text-sm text-slate-400 file:mr-3 file:rounded-xl file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white"
                />
                {questionImagePreview && (
                  <img
                    src={questionImagePreview}
                    alt="سؤال"
                    className="mt-3 max-h-48 rounded-2xl border border-slate-800 object-contain"
                  />
                )}
              </section>

              {/* MCQ options */}
              {form.question_type === "mcq" && (
                <section>
                  <div className="mb-4 flex items-center gap-2">
                    <Layers3 className="h-5 w-5 text-blue-400" />
                    <h3 className="font-black text-white">الاختيارات</h3>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {options.map((option) => {
                      const isCorrect = form.correct_answer === option.key;
                      return (
                        <div
                          key={option.key}
                          className={`rounded-2xl border p-4 transition ${
                            isCorrect
                              ? "border-emerald-500/30 bg-emerald-500/10"
                              : "border-slate-800 bg-[#070b14]"
                          }`}
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <span
                              className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black ${
                                isCorrect
                                  ? "bg-emerald-500 text-white"
                                  : "border border-slate-800 bg-[#0b111e] text-slate-300"
                              }`}
                            >
                              {option.key}
                            </span>
                            {isCorrect && (
                              <span className="flex items-center gap-1 text-xs font-black text-emerald-400">
                                <CheckCircle2 className="h-4 w-4" />
                                الإجابة الصحيحة
                              </span>
                            )}
                          </div>
                          <input
                            value={option.value}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                [option.field]: e.target.value,
                              })
                            }
                            placeholder={`الاختيار ${option.key}`}
                            className="h-11 w-full rounded-xl border border-slate-800 bg-[#0b111e] px-4 text-sm font-semibold text-white outline-none focus:border-blue-500"
                          />
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Option images - تعديل هنا ليظهر فقط في الـ mcq ويختفي من الصح والخطأ */}
              {form.question_type === "mcq" && (
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-purple-400" />
                    <h3 className="font-black text-white">صور الاختيارات</h3>
                    <span className="text-xs text-slate-500">اختياري</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {(["a", "b", "c", "d"] as const).map((key) => (
                      <div
                        key={key}
                        className="rounded-2xl border border-slate-800 bg-[#070b14] p-4"
                      >
                        <p className="mb-2 text-xs font-bold text-slate-400">
                          صورة الخيار {key.toUpperCase()}
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => onOptionImageChange(key, e)}
                          className="block w-full text-xs text-slate-400"
                        />
                        {optionImagePreviews[key] && (
                          <img
                            src={optionImagePreviews[key]!}
                            alt={`option-${key}`}
                            className="mt-2 max-h-28 rounded-xl object-contain"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Correct answer */}
              {form.question_type === "mcq" && (
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <h3 className="font-black text-white">الإجابة الصحيحة</h3>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {["A", "B", "C", "D"].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() =>
                          setForm({ ...form, correct_answer: item })
                        }
                        className={`rounded-2xl py-3.5 text-sm font-black transition ${
                          form.correct_answer === item
                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                            : "border border-slate-800 bg-[#070b14] text-slate-400 hover:border-emerald-500/30 hover:text-emerald-400"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {form.question_type === "true_false" && (
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <h3 className="font-black text-white">الإجابة الصحيحة</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {["صح", "خطأ"].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          setForm({ ...form, correct_answer: opt })
                        }
                        className={`rounded-2xl py-3.5 text-sm font-black transition ${
                          form.correct_answer === opt
                            ? "bg-emerald-500 text-white"
                            : "border border-slate-800 bg-[#070b14] text-slate-400"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {form.question_type === "written" && (
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-purple-400" />
                    <h3 className="font-black text-white">نموذج الإجابة</h3>
                    <span className="text-xs text-slate-500">اختياري</span>
                  </div>
                  <textarea
                    value={form.correct_answer}
                    onChange={(e) =>
                      setForm({ ...form, correct_answer: e.target.value })
                    }
                    rows={3}
                    placeholder="نموذج الإجابة للمصحح..."
                    className="w-full resize-none rounded-2xl border border-slate-800 bg-[#070b14] px-4 py-4 text-sm text-white outline-none focus:border-purple-500"
                  />
                </section>
              )}

              {/* Marks */}
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <Hash className="h-5 w-5 text-blue-400" />
                  <h3 className="font-black text-white">درجة السؤال</h3>
                </div>
                <input
                  type="number"
                  min={1}
                  value={form.marks}
                  onChange={(e) =>
                    setForm({ ...form, marks: Number(e.target.value) })
                  }
                  className="h-12 w-full rounded-2xl border border-slate-800 bg-[#070b14] px-4 text-sm font-semibold text-white outline-none focus:border-blue-500 sm:max-w-xs"
                />
              </section>

              <div className="border-t border-slate-800 pt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#2563eb] text-base font-black text-white shadow-xl shadow-blue-500/25 transition hover:bg-[#1d4ed8] disabled:opacity-50"
                >
                  <Save className="h-5 w-5" />
                  {submitting ? "جارٍ حفظ السؤال..." : "حفظ السؤال"}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* List */}
        {loading ? (
          <p className="py-16 text-center text-slate-400">جاري التحميل...</p>
        ) : questions.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-700 bg-[#0b111e] p-16 text-center">
            <CircleHelp className="mx-auto h-10 w-10 text-slate-600" />
            <p className="mt-3 font-black text-slate-300">لا توجد أسئلة</p>
            <p className="mt-1 text-sm text-slate-500">
              اضغط «إضافة سؤال» لبدء بناء أسئلة الدور
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map((q, index) => (
              <div
                key={q.id}
                className="overflow-hidden rounded-3xl border border-slate-800 bg-[#0b111e]"
              >
                <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-400">
                    <ClipboardList className="h-4 w-4 text-blue-400" />
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
                      className="rounded-xl bg-blue-500/15 p-2.5 text-blue-400 hover:bg-blue-500/25"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="rounded-xl bg-red-500/15 p-2.5 text-red-400 hover:bg-red-500/25"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-3 p-5">
                  <p className="font-bold text-white">{q.question}</p>
                  {q.image_url && (
                    <img
                      src={q.image_url}
                      alt="question"
                      className="max-h-48 rounded-2xl border border-slate-800 object-contain"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}