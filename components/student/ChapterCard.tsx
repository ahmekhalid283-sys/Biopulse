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
      whileHover={{
        y: -10,
        scale: 1.03,
      }}
      transition={{
        duration: 0.25,
      }}
      className="group overflow-hidden rounded-[28px]
      border border-cyan-500/20
      bg-[#091423]/90
      backdrop-blur-xl
      shadow-[0_0_30px_rgba(0,255,255,.05)]"
    >
      <Link
        href={href}
        className={`
          group
          relative
          block
          overflow-hidden
          rounded-3xl
          bg-[#081321]/90
          backdrop-blur-xl
          border ${color}
          transition-all
          duration-500
          hover:-translate-y-3
          hover:scale-[1.03]
          hover:shadow-[0_0_35px_rgba(34,211,238,.18)]
        `}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-cyan-500/0 to-cyan-400/10 opacity-0 group-hover:opacity-100 transition duration-500" />

        <div className="relative h-56 overflow-hidden">
          <img
            src={image}
            alt={title}
            className="h-44 w-full object-cover transition-all duration-500 group-hover:scale-110"
            onError={(e) => {
              e.currentTarget.src = "/images/chapters/default.png";
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-[#081321] via-transparent to-transparent" />
        </div>

        <div className="p-6">
          <h3 className="text-xl font-bold transition group-hover:text-cyan-400 text-white">
            {title}
          </h3>

          <p className="mt-3 text-cyan-400">
            👨‍🏫 {teacher}
          </p>

          <div className="mt-5 flex items-center justify-between">
            <span className="text-slate-400">
              {lectures} محاضرة
            </span>

            <div
              className="
              rounded-full
              bg-cyan-500/20
              px-4
              py-2
              text-sm
              font-bold
              text-cyan-300
              transition
              group-hover:bg-cyan-500
              group-hover:text-white"
            >
              <span className="transition duration-300 group-hover:translate-x-2 group-hover:text-cyan-400 inline-block">
                دخول →
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}