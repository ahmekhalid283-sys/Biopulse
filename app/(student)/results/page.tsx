"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ResultsContent() {
  const params = useSearchParams();

  const score = params.get("score");
  const total = params.get("total");
  const percentage = params.get("percentage");

  return (
    <main className="max-w-3xl mx-auto p-10">
      <div className="rounded-2xl border bg-white p-10 shadow">

        <h1 className="text-center text-4xl font-bold text-green-600">
          🎉 تم إنهاء الامتحان
        </h1>

        <div className="mt-10 space-y-5">

          <div className="flex justify-between border-b pb-3">
            <span>الدرجة</span>
            <span className="font-bold">
              {score} / {total}
            </span>
          </div>

          <div className="flex justify-between border-b pb-3">
            <span>النسبة المئوية</span>
            <span className="font-bold text-blue-600">
              {percentage}%
            </span>
          </div>

        </div>

        <div className="mt-10 flex gap-4">

          <Link
            href="/dashboard"
            className="flex-1 rounded-lg bg-blue-600 py-3 text-center text-white"
          >
            العودة للوحة الطالب
          </Link>

          <Link
            href="/chapters"
            className="flex-1 rounded-lg border py-3 text-center"
          >
            العودة للفصول
          </Link>

        </div>

      </div>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="p-10">جارٍ التحميل...</div>}>
      <ResultsContent />
    </Suspense>
  );
}