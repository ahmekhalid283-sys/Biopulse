"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function ResultsContent() {
  const params = useSearchParams();

  const score = Number(params.get("score"));
  const total = Number(params.get("total"));
  const percentage = params.get("percentage");
  const attemptId = params.get("attemptId");

  // ملاحظة: الصفحة الحالية هي صفحة النتائج (Results) وليست صفحة المراجعة (Review).
  // إذا كنت تريد إضافة عرض الأسئلة وتفسيرها هنا، فيجب جلب بيانات الأسئلة والإجابات (مثل questions و answers).
  // لكن إذا كانت هذه التعديلات تخص صفحة المراجعة الأصلية، يرجى تطبيقها في ملف review/[attemptId]/page.tsx.
  // إليك الكود مع دمج التعديلات وتوفير المتغيرات الافتراضية لمنع الأخطاء:

  const [currentIndex, setCurrentIndex] = useState(0);
  const questions: any[] = []; // ضع هنا الأسئلة إن وجدت في صفحة النتائج أو استبدلها بالبيانات المناسبة
  const answers: Record<string, any> = {};

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentQuestion?.id];

  return (
    <main className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="/images/background.jpg"
          className="w-full h-full object-cover opacity-10"
          alt=""
        />
        <div className="absolute inset-0 bg-slate-950/80" />
      </div>

      <div className="relative max-w-4xl mx-auto py-16 px-6">
        <div className="rounded-[35px] border border-cyan-500/20 bg-[#081321]/95 backdrop-blur-xl p-10 text-center">
          <div className="mx-auto mb-8 flex h-36 w-36 items-center justify-center rounded-full border-8 border-cyan-500 bg-cyan-500/10">
            <span className="text-5xl font-black text-cyan-400">
              {Math.round(Number(percentage))}%
            </span>
          </div>

          <h1 className="text-5xl font-black text-white">
            أحسنت 👏
          </h1>

          <p className="mt-3 text-slate-400">
            انتهيت من الامتحان بنجاح
          </p>

          <div className="mt-10 grid grid-cols-3 gap-5">
            <div className="rounded-2xl bg-slate-900 p-6">
              <p className="text-slate-400">درجتك</p>
              <h2 className="mt-3 text-4xl font-black text-cyan-400">
                {score}
              </h2>
            </div>

            <div className="rounded-2xl bg-slate-900 p-6">
              <p className="text-slate-400">الإجمالي</p>
              <h2 className="mt-3 text-4xl font-black text-yellow-400">
                {total}
              </h2>
            </div>

            <div className="rounded-2xl bg-slate-900 p-6">
              <p className="text-slate-400">النسبة</p>
              <h2 className="mt-3 text-4xl font-black text-green-400">
                {percentage}%
              </h2>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <Link
              href={`/student/review/${attemptId}`}
              className="rounded-xl bg-cyan-600 py-4 font-bold transition hover:bg-cyan-500 text-center flex items-center justify-center"
            >
              مراجعة الإجابات
            </Link>

            <Link
              href="/student/dashboard"
              className="rounded-xl bg-blue-600 py-4 font-bold transition hover:bg-blue-500 text-center flex items-center justify-center"
            >
              لوحة الطالب
            </Link>

            <Link
              href="/chapters"
              className="rounded-xl border border-slate-700 py-4 font-bold transition hover:border-cyan-500 text-center flex items-center justify-center"
            >
              الفصول
            </Link>
          </div>
        </div>

        {/* خريطة الأسئلة إذا وجدت أسئلة */}
        {questions.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(i)}
                className={`
                  w-12
                  h-12
                  rounded-xl
                  font-bold
                  ${
                    answers[q.id]?.is_correct
                      ? "bg-green-600"
                      : answers[q.id]
                      ? "bg-red-600"
                      : "bg-slate-700"
                  }
                  ${i === currentIndex ? "ring-4 ring-cyan-400" : ""}
                `}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResultsContent />
    </Suspense>
  );
}