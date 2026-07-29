"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

type FadeInProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
};

export default function FadeIn({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: FadeInProps) {
  const offset = 30;

  const variants = {
    hidden: {
      opacity: 0,
      x:
        direction === "left"
          ? -offset
          : direction === "right"
          ? offset
          : 0,
      y:
        direction === "up"
          ? offset
          : direction === "down"
          ? -offset
          : 0,
    },
    show: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: 0.5,
        delay,
      },
    },
  };

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.div>
  );
}