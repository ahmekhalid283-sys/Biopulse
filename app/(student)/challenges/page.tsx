"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Swords, Lock, Trophy, Users, Clock } from "lucide-react";

type Challenge = {
  id: string;
  title: string;
  description: string | null;
  challenge_type: string;
  difficulty: string;
  status: string;
  start_at: string | null;
  end_at: string | null;
};

export default function StudentChallengesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const { data: setting } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "challenges_enabled")
      .maybeSingle();

    const isEnabled = setting?.value === true || setting?.value === "true";
    setEnabled(isEnabled);

    if (!isEnabled) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("challenges")
      .select("id, title, description, challenge_type, difficulty, status, start_at, end_at")
      .in("status", ["published", "active", "ongoing"])
      .order("created_at", { ascending: false });

    setChallenges(data || []);
    setLoading(false);
  }

  if (loading) {
    return (
      <main dir="rtl" className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        جاري التحميل...
      </main>
    );
  }

  if (!enabled) {
    return (
      <main dir="rtl" className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-white">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-800 text-slate-400">
          <Lock className="h-10 w-10" />
        </div>
        <h1 className="mt-6 text-2xl font-bold">التحديات مقفلة حاليًا</h1>
        <p className="mt-2 text-slate-400">سيتم فتحها قريبًا من إدارة المنصة</p>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 p-4 text-white sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-400">
            <Swords className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">تحديات BioPulse</h1>
            <p className="mt-1 text-sm text-slate-400">تنافس وتعلم واربح الجوائز</p>
          </div>
        </div>

        {challenges.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-16 text-center">
            <Trophy className="mx-auto h-12 w-12 text-slate-600" />
            <h2 className="mt-4 text-xl font-bold">لا توجد تحديات متاحة حاليًا</h2>
            <p className="mt-2 text-slate-500">تابعنا قريبًا لمزيد من التحديات</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {challenges.map((challenge) => (
              <div
                key={challenge.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-cyan-500/40"
              >
                <div className="mb-4 flex items-start justify-between">
                  <h3 className="text-lg font-bold">{challenge.title}</h3>
                  <span className="rounded-lg bg-cyan-500/15 px-2.5 py-1 text-xs font-bold text-cyan-400">
                    {challenge.difficulty}
                  </span>
                </div>

                {challenge.description && (
                  <p className="mb-4 line-clamp-2 text-sm text-slate-400">
                    {challenge.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {challenge.challenge_type === "team" ? "جماعي" : "فردي"}
                  </span>
                </div>

                <button
                  onClick={() => router.push(`/challenges/${challenge.id}`)}
                  className="mt-5 w-full rounded-xl bg-cyan-500 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-400"
                >
                  الدخول للتحدي
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}