"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type SolutionVideo = {
  id: string;
  lecture_id: string;
  title: string;
  youtube_url: string;
  video_order: number;
};

function getYoutubeEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);

    const videoId = parsed.searchParams.get("v");

    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }

    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.split("/").filter(Boolean)[0];

      if (id) {
        return `https://www.youtube.com/embed/${id}`;
      }
    }

    if (parsed.pathname.startsWith("/embed/")) {
      return url;
    }

    return url;
  } catch {
    return url;
  }
}

export default function SingleSolutionVideoPage() {
  const params = useParams();

  const lectureId = params.lectureId as string;
  const videoId = params.videoId as string;

  const [video, setVideo] = useState<SolutionVideo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideo = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("lecture_solution_videos")
        .select("*")
        .eq("id", videoId)
        .eq("lecture_id", lectureId)
        .single();

      if (error) {
        console.error("Fetch solution video error:", error);
        setVideo(null);
      } else {
        setVideo(data);
      }

      setLoading(false);
    };

    if (lectureId && videoId) {
      fetchVideo();
    }
  }, [lectureId, videoId]);

  if (loading) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-slate-950 text-white flex items-center justify-center"
      >
        <div className="text-cyan-400 text-lg font-bold">
          جاري تحميل فيديو الحل...
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4"
      >
        <div className="text-center">
          <p className="text-slate-400 text-lg mb-6">
            فيديو الحل غير موجود
          </p>

          <Link
            href={`/lectures/${lectureId}/solution-videos`}
            className="inline-flex items-center justify-center px-6 h-12 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold"
          >
            العودة إلى فيديوهات الحل
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-950 text-white px-4 py-8 md:px-8"
    >
      <div className="max-w-5xl mx-auto">

        <Link
          href={`/lectures/${lectureId}/solution-videos`}
          className="inline-flex items-center text-slate-400 hover:text-cyan-400 mb-6 transition"
        >
          ← العودة إلى فيديوهات الحل
        </Link>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">

          <div className="p-5 md:p-7">
            <div className="text-sm text-cyan-400 mb-2">
              فيديو الحل {video.video_order}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {video.title || `فيديو الحل ${video.video_order}`}
            </h1>
          </div>

          <div className="aspect-video bg-black">
            <iframe
              src={getYoutubeEmbedUrl(video.youtube_url)}
              title={video.title || `فيديو الحل ${video.video_order}`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          <div className="p-5 md:p-7">
            <a
              href={video.youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-full h-12 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold transition"
            >
              مشاهدة الفيديو على YouTube ↗
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}