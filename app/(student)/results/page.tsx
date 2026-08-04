"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ResultsContent() {
  const params = useSearchParams();

  const score = Number(params.get("score") || 0);
  const total = Number(params.get("total") || 0);
  const percentage = Number(params.get("percentage") || 0);
  const attemptId = params.get("attemptId");
  console.log("Results AttemptId:", attemptId);

  const passed = percentage >= 50;

  return (
    <main className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="/images/background.jpg"
          className="w-full h-full object-cover opacity-10"
          alt=""
        />
        <div className="absolute inset-0 bg-slate-950/90" />
      </div>

      <div className="relative max-w-4xl mx-auto py-16 px-6">
        <div className="rounded-[35px] border border-cyan-500/20 bg-[#081321]/95 backdrop-blur-xl p-10 text-center">
          
          <div
            className={`mx-auto mb-8 flex h-36 w-36 items-center justify-center rounded-full border-8 ${
              passed
                ? "border-green-500 bg-green-500/10"
                : "border-red-500 bg-red-500/10"
            }`}
          >
            <span
              className={`text-5xl font-black ${
                passed ? "text-green-400" : "text-red-400"
              }`}
            >
              {percentage}%
            </span>
          </div>

          <h1 className="text-5xl font-black">
            {passed ? "أحسنت 👏" : "حاول مرة أخرى 💪"}
          </h1>

          <p className="mt-3 text-slate-400">
            {passed
              ? "لقد اجتزت الامتحان بنجاح"
              : "لم تحصل على درجة النجاح"}
          </p>

          <div className="mt-10 grid md:grid-cols-3 gap-5">
            <div className="rounded-2xl bg-slate-900 p-6">
              <p className="text-slate-400">الدرجة</p>
              <h2 className="text-4xl mt-3 font-black text-cyan-400">
                {score}
              </h2>
            </div>

            <div className="rounded-2xl bg-slate-900 p-6">
              <p className="text-slate-400">الدرجة الكلية</p>
              <h2 className="text-4xl mt-3 font-black text-yellow-400">
                {total}
              </h2>
            </div>

            <div className="rounded-2xl bg-slate-900 p-6">
              <p className="text-slate-400">الحالة</p>
              <h2
                className={`text-3xl mt-3 font-black ${
                  passed ? "text-green-400" : "text-red-400"
                }`}
              >
                {passed ? "ناجح" : "راسب"}
              </h2>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {attemptId && (
              <Link
                href={`/review/${attemptId}`}
                className="rounded-xl bg-cyan-600 py-4 font-bold hover:bg-cyan-500 flex items-center justify-center"
              >
                مراجعة الامتحان
              </Link>
            )}

            <Link
              href="/dashboard"
              className="rounded-xl bg-blue-600 py-4 font-bold hover:bg-blue-500 flex items-center justify-center"
            >
              لوحة الطالب
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
          جاري التحميل...
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}