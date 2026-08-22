"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  CheckCircle2,
  CircleHelp,
  FileText,
  Hash,
  Layers3,
  Save,
  Sparkles,
} from "lucide-react";

type Exam = {
  id: string;
  title: string;
};

export default function NewQuestionPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const resolvedParams = use(params);
  const routeExamId = resolvedParams.examId;

  const [exams, setExams] = useState<Exam[]>([]);
  const [examId, setExamId] = useState(routeExamId || "");

  const [question, setQuestion] = useState("");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [c, setC] = useState("");
  const [d, setD] = useState("");

  const [correct, setCorrect] = useState("A");

  const [marks, setMarks] = useState("1");
  const [order, setOrder] = useState("1");

  const [explanation, setExplanation] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadExams();
  }, []);

  async function loadExams() {
    const { data } = await supabase
      .from("exams")
      .select("id,title")
      .order("created_at", { ascending: false });

    if (data) {
      setExams(data);

      if (!examId && data.length) {
        setExamId(data[0].id);
      }
    }
  }

  async function saveQuestion() {
    if (!examId || !question || !a || !b || !c || !d) {
      alert("املأ جميع البيانات");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("questions")
      .insert({
        exam_id: examId,
        question,
        option_a: a,
        option_b: b,
        option_c: c,
        option_d: d,
        correct_answer: correct,
        marks: Number(marks),
        question_order: Number(order),
        explanation,
      });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("✅ تمت إضافة السؤال");

    setQuestion("");
    setA("");
    setB("");
    setC("");
    setD("");
    setExplanation("");
  }

  const options = [
    {
      key: "A",
      value: a,
      setValue: setA,
    },
    {
      key: "B",
      value: b,
      setValue: setB,
    },
    {
      key: "C",
      value: c,
      setValue: setC,
    },
    {
      key: "D",
      value: d,
      setValue: setD,
    },
  ];

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#070b14] p-4 text-slate-100 sm:p-6 lg:p-10"
    >
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800 bg-[#0b111e] text-blue-400 shadow-lg">
              <CircleHelp className="h-7 w-7" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                  إضافة سؤال
                </h1>

                <Sparkles className="h-5 w-5 text-cyan-400" />
              </div>

              <p className="mt-1 text-sm text-slate-400">
                إنشاء سؤال جديد وربطه بالامتحان مع تحديد الإجابة الصحيحة والدرجة.
              </p>
            </div>

          </div>
        </div>

        {/* Main Form */}
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-[#0b111e] shadow-xl">

          {/* Top Bar */}
          <div className="border-b border-slate-800/80 bg-[#0b111e] px-5 py-5 text-white sm:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
                <FileText className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-black text-white">
                  بيانات السؤال
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  أدخل محتوى السؤال والاختيارات ثم حدد الإجابة الصحيحة.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8 p-5 sm:p-8">

            {/* Exam */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-400" />

                <h3 className="font-black text-white">
                  الامتحان
                </h3>
              </div>

              <select
                value={examId}
                onChange={(e) => setExamId(e.target.value)}
                className="w-full h-12 rounded-2xl border border-slate-800 bg-[#070b14] px-4 text-sm font-semibold text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              >
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id} className="bg-[#0b111e]">
                    {exam.title}
                  </option>
                ))}
              </select>
            </section>

            {/* Question */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <CircleHelp className="h-5 w-5 text-blue-400" />

                <h3 className="font-black text-white">
                  نص السؤال
                </h3>
              </div>

              <textarea
                placeholder="اكتب نص السؤال هنا..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={5}
                className="w-full resize-none rounded-2xl border border-slate-800 bg-[#070b14] px-4 py-4 text-sm leading-7 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </section>

            {/* Options */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers3 className="h-5 w-5 text-blue-400" />

                  <h3 className="font-black text-white">
                    الاختيارات
                  </h3>
                </div>

                <span className="text-xs font-bold text-slate-400">
                  اختر الإجابة الصحيحة بالأسفل
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {options.map((option) => {
                  const isCorrect = correct === option.key;

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

                      <Input
                        placeholder={`الاختيار ${option.key}`}
                        value={option.value}
                        onChange={(e) =>
                          option.setValue(e.target.value)
                        }
                        className="h-11 rounded-xl border-slate-800 bg-[#0b111e] px-4 text-sm font-semibold text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      />
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Correct Answer */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />

                <h3 className="font-black text-white">
                  الإجابة الصحيحة
                </h3>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {["A", "B", "C", "D"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCorrect(item)}
                    className={`rounded-2xl py-3.5 text-sm font-black transition ${
                      correct === item
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                        : "border border-slate-800 bg-[#070b14] text-slate-400 hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-400"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </section>

            {/* Question Settings */}
            <section>
              <div className="mb-4 flex items-center gap-2">
                <Hash className="h-5 w-5 text-blue-400" />

                <h3 className="font-black text-white">
                  إعدادات السؤال
                </h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-400">
                    درجة السؤال
                  </label>

                  <Input
                    type="number"
                    value={marks}
                    onChange={(e) => setMarks(e.target.value)}
                    className="h-12 rounded-2xl border-slate-800 bg-[#070b14] px-4 text-sm font-semibold text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-400">
                    ترتيب السؤال
                  </label>

                  <Input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                    className="h-12 rounded-2xl border-slate-800 bg-[#070b14] px-4 text-sm font-semibold text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

              </div>
            </section>

            {/* Explanation */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-400" />

                <h3 className="font-black text-white">
                  شرح الإجابة
                </h3>

                <span className="text-xs text-slate-500">
                  اختياري
                </span>
              </div>

              <textarea
                placeholder="اكتب شرحًا يساعد الطالب على فهم الإجابة..."
                value={explanation}
                onChange={(e) =>
                  setExplanation(e.target.value)
                }
                rows={5}
                className="w-full resize-none rounded-2xl border border-slate-800 bg-[#070b14] px-4 py-4 text-sm leading-7 text-white outline-none transition placeholder:text-slate-500 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10"
              />
            </section>

            {/* Save */}
            <div className="border-t border-slate-800 pt-6">
              <Button
                onClick={saveQuestion}
                disabled={loading}
                className="h-14 w-full rounded-2xl bg-[#2563eb] text-base font-black text-white shadow-xl shadow-blue-500/25 transition hover:bg-[#1d4ed8] disabled:opacity-50"
              >
                <Save className="ml-2 h-5 w-5" />

                {loading
                  ? "جارٍ حفظ السؤال..."
                  : "حفظ السؤال"}
              </Button>
            </div>

          </div>
        </div>

        {/* Footer hint */}
        <div className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          تأكد من تحديد الإجابة الصحيحة قبل الحفظ
        </div>

      </div>
    </main>
  );
}