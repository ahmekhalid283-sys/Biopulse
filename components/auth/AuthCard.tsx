"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

export default function AuthCard() {
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <div className="mx-auto w-full max-w-lg">
      <div
        className="
          relative
          overflow-hidden
          rounded-[32px]
          border border-cyan-400/20
          bg-slate-900/70
          backdrop-blur-2xl
          shadow-[0_20px_80px_rgba(0,255,255,.08)]
          p-10
        "
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 pointer-events-none" />

        <div className="relative z-10">
          <AnimatePresence mode="wait">
            {mode === "login" ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.35 }}
              >
                <LoginForm onSwitch={() => setMode("register")} />
              </motion.div>
            ) : (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.35 }}
              >
                <RegisterForm onSwitch={() => setMode("login")} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}