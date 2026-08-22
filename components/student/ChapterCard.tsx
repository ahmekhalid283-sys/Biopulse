"use client";

import Link from "next/link";
import { motion } from "framer-motion";

type Props = {
  title: string;
  teacher: string;
  lectures: number;
  image: string;
  color: string;
  href: string;
};

export default function ChapterCard({
  title,
  teacher,
  lectures,
  image,
  color,
  href,
}: Props) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="h-[450px]"
    >
      <Link
        href={href}
        className={`group relative flex flex-col h-full overflow-hidden rounded-[24px] bg-[#091423] border ${color} shadow-lg transition-all duration-300 hover:shadow-[0_0_30px_rgba(34,211,238,0.18)]`}
      >
        {/* Image */}
        <div className="relative h-44 w-full overflow-hidden bg-slate-950 flex-shrink-0">
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.src = "/images/chapters/default.png";
            }}
          />

          {/* Image Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#091423] via-transparent to-transparent" />

          {/* Chapter Badge */}
          <div className="absolute top-3 right-3 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/10 px-3 py-1 text-[11px] font-bold text-cyan-300">
            فصل دراسي
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-5 justify-between">
          <div>
            <h3 className="text-lg font-bold text-white leading-relaxed transition-colors group-hover:text-cyan-400">
              {title}
            </h3>

            <p className="mt-2 text-sm text-cyan-400">
              👨‍🏫 {teacher}
            </p>
          </div>

          {/* Bottom */}
          <div className="mt-5 flex items-center justify-between pt-4 border-t border-slate-800/80">
            <span className="text-xs text-slate-400">
              {lectures} محاضرة
            </span>

            <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 text-xs font-bold text-cyan-300 transition-all duration-300 group-hover:bg-cyan-500 group-hover:text-white group-hover:border-cyan-400">
              دخول ←
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}