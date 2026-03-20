"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { CoachChat } from "@/components/coach-chat";

export function FloatingCoach() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm md:hidden"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Chat drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[70] mx-auto max-h-[85vh] w-full max-w-lg overflow-hidden rounded-t-[28px] border border-white/10 bg-white shadow-2xl dark:bg-slate-950 md:bottom-24 md:right-6 md:left-auto md:w-[420px] md:rounded-[28px]"
          >
            <div className="flex items-center justify-between border-b border-slate-200/50 px-5 py-4 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-comet/10 p-2">
                  <MessageCircle className="h-4 w-4 text-comet" />
                </div>
                <div>
                  <p className="font-display text-sm font-bold">AI Study Coach</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Powered by Gemini</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close AI Coach"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-4">
              <CoachChat />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB trigger */}
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-20 right-5 z-[55] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-comet to-ink text-white shadow-glow md:bottom-6 md:right-6"
        aria-label={open ? "Close AI Coach" : "Open AI Coach"}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X className="h-5 w-5" />
            </motion.span>
          ) : (
            <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <MessageCircle className="h-5 w-5" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
