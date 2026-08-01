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
      className="h-full"
    >
      <Link
        href={href}
        className={`group relative flex flex-col h-full overflow-hidden rounded-[24px] bg-[#091423] border ${color} shadow-lg transition-all duration-300 hover:shadow-[0_0_25px_rgba(34,211,238,0.15)]`}
      >
        <div className="relative h-48 w-full overflow-hidden bg-slate-900">
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.src = "/images/chapters/default.png";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#091423] via-transparent to-transparent" />
        </div>

        <div className="flex flex-col flex-1 p-5 justify-between">
          <div>
            <h3 className="text-lg font-bold text-white transition-colors group-hover:text-cyan-400">
              {title}
            </h3>
            <p className="mt-2 text-sm text-cyan-400">
              👨‍🏫 {teacher}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800/80">
            <span className="text-xs text-slate-400">
              {lectures} محاضرة
            </span>

            <span className="rounded-full bg-cyan-500/10 px-3 py-1.5 text-xs font-bold text-cyan-300 transition-colors group-hover:bg-cyan-500 group-hover:text-white">
              دخول ←
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}