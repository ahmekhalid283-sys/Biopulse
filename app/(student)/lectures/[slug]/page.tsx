"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LecturePage() {
  return (
    <main className="min-h-screen bg-slate-100 p-8">

      <h1 className="text-4xl font-bold text-blue-600">
        الدعامة والحركة - المحاضرة الأولى
      </h1>

      <p className="text-gray-500 mt-2 mb-8">
        مدة المحاضرة: ساعتان
      </p>

      <Card>
        <CardContent className="p-6">

          <div className="aspect-video rounded-xl bg-black flex items-center justify-center text-white text-2xl">
            🎥 مكان الفيديو
          </div>

          <div className="mt-6 flex gap-4 flex-wrap">

            <Button>
              📄 تحميل PDF
            </Button>

            <Button variant="outline">
                📝 حل الامتحان
            </Button>

          </div>

        </CardContent>
      </Card>

    </main>
  );
}