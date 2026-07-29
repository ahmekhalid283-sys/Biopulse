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
        y: -8,
        scale: 1.02,
      }}
      transition={{
        duration: 0.25,
      }}
      className={`rounded-2xl overflow-hidden border-2 ${color} bg-slate-900 shadow-lg`}
    >
      <Link href={href}>
        <div className="aspect-video overflow-hidden bg-slate-800">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition duration-300 hover:scale-110"
            onError={(e) => {
              e.currentTarget.src = "/images/chapters/default.png";
            }}
          />
        </div>

        <div className="p-5">
          <h3 className="text-xl font-bold text-white mb-2">
            {title}
          </h3>

          <p className="text-cyan-400 text-sm mb-1">
            👨‍🏫 {teacher}
          </p>

          <p className="text-gray-400 text-sm">
            📚 {lectures} محاضرة
          </p>
        </div>
      </Link>
    </motion.div>
  );
}