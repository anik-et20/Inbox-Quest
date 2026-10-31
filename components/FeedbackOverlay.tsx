"use client";

import React, { useEffect, useState } from "react";
import { useGameStore } from "@/store/game";

export const FeedbackOverlay: React.FC = () => {
  const { lastFeedback } = useGameStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!lastFeedback.status) return;
    setVisible(true);

    const timer = setTimeout(() => {
      setVisible(false);
    }, 1100);

    return () => clearTimeout(timer);
  }, [lastFeedback.key, lastFeedback.status]);

  if (!visible || !lastFeedback.status) return null;

  const isCorrect = lastFeedback.status === "correct";

  return (
    <>
      {/* Screen edge flash */}
      <div
        className={`fixed inset-0 pointer-events-none z-40 transition-opacity duration-300 ${
          isCorrect
            ? "border-[6px] border-emerald-400/60 shadow-[inset_0_0_40px_rgba(52,211,153,0.3)] animate-pulse"
            : "border-[6px] border-rose-500/80 shadow-[inset_0_0_50px_rgba(244,63,94,0.4)] animate-bounce"
        }`}
      />

      {/* Pop label in center (Screenshot 4) */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        {isCorrect ? (
          <div className="flex flex-col items-center animate-in zoom-in-75 fade-in duration-200">
            {lastFeedback.comboLabel && (
              <div className="font-pixel text-lg sm:text-2xl text-lime-400 tracking-wider drop-shadow-[0_0_15px_rgba(163,230,53,0.9)] bg-slate-950/90 px-4 py-1.5 rounded-xl border border-lime-400/50">
                {lastFeedback.comboLabel}
              </div>
            )}
            <div className="font-mono text-xs font-bold text-emerald-300 bg-slate-900/90 px-3 py-1 rounded-full border border-emerald-500/40 mt-1 shadow-lg">
              +{lastFeedback.xpGained} XP • CLEARED
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center animate-in shake duration-200">
            <div className="font-pixel text-sm sm:text-base text-rose-400 tracking-wide bg-slate-950/90 px-4 py-2 rounded-xl border border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.5)]">
              Wrong move! -1 health
            </div>
            <div className="text-[11px] font-mono text-slate-300 mt-1 bg-slate-900/90 px-3 py-0.5 rounded border border-slate-800">
              {lastFeedback.message}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
