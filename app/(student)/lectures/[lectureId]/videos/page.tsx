"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type LectureVideo = {
  id: string;
  lecture_id: string;
  title: string;
  youtube_url: string;
  video_order: number;
};

export default function LectureVideosPage() {
  const params = useParams();
  const lectureId = params.lectureId as string;

  const [videos, setVideos] = useState<LectureVideo[]>([]);
  const [lectureTitle, setLectureTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);

      const { data: lecture } = await supabase
        .from("lectures")
        .select("title")
        .eq("id", lectureId)
        .single();

      if (lecture) {
        setLectureTitle(lecture.title);
      }

      const { data, error } = await supabase
        .from("lecture_videos")
        .select("*")
        .eq("lecture_id", lectureId)
        .order("video_order", { ascending: true });

      if (error) {
        console.error("Fetch lecture videos error:", error);
        setVideos([]);
      } else {
        setVideos(data || []);
      }

      setLoading(false);
    };

    if (lectureId) {
      fetchVideos();
    }
  }, [lectureId]);

  if (loading) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-slate-950 text-white flex items-center justify-center"
      >
        <div className="text-cyan-400 text-lg font-bold">
          جاري تحميل الفيديوهات...
        </div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-950 text-white px-4 py-8 md:px-8"
    >
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <Link
            href={`/lectures/${lectureId}`}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition mb-6"
          >
            → العودة إلى المحاضرة
          </Link>

          <div className="rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-slate-900/80 to-slate-950 p-6 md:p-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-2xl">
                🎬
              </div>

              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  فيديوهات الشرح
                </h1>

                <p className="mt-1 text-slate-400">
                  {lectureTitle || "اختر الفيديو الذي تريد مشاهدته"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Videos */}
        {videos.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center">
            <div className="text-4xl mb-4">🎬</div>

            <p className="text-slate-400 text-lg">
              لا توجد فيديوهات شرح متاحة حالياً
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {videos.map((video, index) => (
              <Link
                key={video.id}
                href={`/lectures/${lectureId}/videos/${video.id}`}
                className="block group"
              >
                <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 p-5 md:p-6 transition-all duration-300 group-hover:border-cyan-500/50 group-hover:bg-slate-900 group-hover:-translate-y-1">

                  <div className="flex items-center gap-5">

                    {/* Number */}
                    <div className="w-14 h-14 shrink-0 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                      <span className="text-cyan-400 text-xl font-black">
                        {index + 1}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-cyan-400 font-semibold mb-1">
                        فيديو الشرح {index + 1}
                      </p>

                      <h2 className="text-lg md:text-xl font-bold text-white truncate">
                        {video.title || `فيديو الشرح ${index + 1}`}
                      </h2>

                      <p className="text-sm text-slate-500 mt-1">
                        اضغط لمشاهدة الفيديو
                      </p>
                    </div>

                    {/* Arrow */}
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-800 group-hover:bg-cyan-500 flex items-center justify-center transition-all">
                      <span className="text-slate-400 group-hover:text-slate-950 text-lg font-bold">
                        ←
                      </span>
                    </div>

                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}