"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import {
  Clock3,
  FileQuestion,
  Award,
  Play,
} from "lucide-react";

export default function ExamIntroPage() {
  const { examId } = useParams<{ examId: string }>();
  const router = useRouter();

  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (examId) loadExam();
  }, [examId]);


  async function loadExam() {
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .eq("id", examId)
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    setExam(data);
    setLoading(false);
  }


  function startExam() {
    router.push(`/exam/${examId}`);
  }


  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        جاري تحميل الامتحان...
      </main>
    );
  }


  if (!exam) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        الامتحان غير موجود
      </main>
    );
  }


  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">

      <div className="max-w-4xl mx-auto py-16">

        <motion.div
          initial={{opacity:0,y:30}}
          animate={{opacity:1,y:0}}
          className="bg-[#081321] border border-cyan-500/20 rounded-[35px] p-10"
        >

          <h1 className="text-5xl font-black text-center">
            {exam.title}
          </h1>


          <p className="text-center text-slate-400 mt-4">
            قبل البدء تأكد من قراءة التعليمات
          </p>


          <div className="grid md:grid-cols-3 gap-5 mt-10">


            <div className="bg-slate-900 rounded-2xl p-6 text-center">
              <Clock3 className="mx-auto text-cyan-400"/>
              <p className="mt-3 text-slate-400">
                مدة الامتحان
              </p>
              <h2 className="text-3xl font-bold">
                {exam.duration_minutes} دقيقة
              </h2>
            </div>


            <div className="bg-slate-900 rounded-2xl p-6 text-center">
              <FileQuestion className="mx-auto text-yellow-400"/>
              <p className="mt-3 text-slate-400">
                عدد الأسئلة
              </p>
              <h2 className="text-3xl font-bold">
                {exam.questions_count}
              </h2>
            </div>


            <div className="bg-slate-900 rounded-2xl p-6 text-center">
              <Award className="mx-auto text-green-400"/>
              <p className="mt-3 text-slate-400">
                الدرجة
              </p>
              <h2 className="text-3xl font-bold">
                {exam.total_score}
              </h2>
            </div>


          </div>


          <div className="mt-10 bg-slate-900 rounded-2xl p-6">

            <h3 className="text-xl font-bold mb-3">
              تعليمات الامتحان
            </h3>

            <ul className="text-slate-300 space-y-2">
              <li>• لا تغلق الصفحة أثناء الحل.</li>
              <li>• سيتم تسليم الامتحان تلقائياً عند انتهاء الوقت.</li>
              <li>• تأكد من مراجعة إجاباتك قبل التسليم.</li>
            </ul>

          </div>


          <button
            onClick={startExam}
            className="mt-10 w-full bg-cyan-600 hover:bg-cyan-500 py-5 rounded-2xl text-xl font-black flex justify-center items-center gap-3"
          >
            <Play />
            ابدأ الامتحان
          </button>


        </motion.div>

      </div>

    </main>
  );
}