"use client";

import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { useGameStore } from "@/store/game";
import { getRank } from "@/lib/ranks";

export const EndScreen: React.FC = () => {
  const {
    score,
    archivedCount,
    trashedCount,
    health,
    queue,
    log,
    restartGame,
    setPhase,
    inboxSource,
    isLive,
  } = useGameStore();

  const totalCleared = archivedCount + trashedCount;
  const initialTotal = queue.length;

  const protectedDecisions = log.filter((l) => l.tier === "protected");
  const protectedSaved = protectedDecisions.filter((l) => l.isCorrect).length;
  const totalDecisions = log.length;
  const scoredDecisions = log.filter((l) => l.tier === "protected" || l.tier === "clutter");
  const correctScoredDecisions = scoredDecisions.filter((l) => l.isCorrect).length;
  const reviewedCount = Math.min(totalDecisions, initialTotal);
  const accuracyPct =
    scoredDecisions.length > 0 ? Math.round((correctScoredDecisions / scoredDecisions.length) * 100) : 100;
  const isGameOver = health === 0;
  const completedSuccessfully = !isGameOver && reviewedCount >= initialTotal;
  const perfectBatch = completedSuccessfully && protectedSaved === protectedDecisions.length;
  const title = isGameOver ? "Game Over" : perfectBatch ? "Inbox Zero!" : "Batch Cleared!";

  const rank = getRank(accuracyPct, reviewedCount);

  const footerText = inboxSource === "demo"
    ? "Demo run using fictitious mail. Your real inbox was not changed."
    : isLive
      ? `Live run: ${archivedCount} archived, ${trashedCount} trashed in your Gmail. Trashed emails stay in Gmail Trash for 30 days.`
      : "Dry run: no real emails were changed.";

  useEffect(() => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#00e5ff", "#22c55e", "#ec4899", "#f59e0b"],
      });
    } catch {
      // Ignore
    }
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 animate-in fade-in duration-500">
      <div className="text-xs font-mono text-cyan-400 mb-6 flex items-center gap-2">
        <span>MISSION COMPLETE</span>
        <span>/</span>
        <span>{inboxSource === "gmail" ? (isLive ? "REAL GMAIL RUN" : "GMAIL DRY RUN") : "FULL SAMPLE RUN"}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Victory Badge Card */}
        <div className="lg:col-span-6 bg-[#0a1424] border-2 border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_35px_rgba(0,229,255,0.15)] flex flex-col items-center text-center relative overflow-hidden">
          <div className="w-full flex items-center justify-between text-[11px] font-mono text-slate-400 mb-4">
            <span>INBOX QUEST</span>
            <span
              className={`px-2 py-0.5 rounded ${
                inboxSource === "gmail"
                  ? isLive
                    ? "bg-rose-950/80 text-rose-300 border border-rose-500/60"
                    : "bg-amber-950/80 text-amber-300 border border-amber-500/60"
                  : "bg-cyan-950/80 text-cyan-300 border border-cyan-700/60"
              }`}
            >
              {inboxSource === "gmail" ? (isLive ? "LIVE GMAIL" : "DRY RUN") : "DEMO RUN"}
            </span>
          </div>

          <div className="my-6 relative">
            <div className="w-24 h-24 rounded-2xl bg-cyan-500/10 border-2 border-cyan-400/60 flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.35)]">
              <svg
                className="w-12 h-12 text-cyan-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.75}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 18h18M4 14l3-8 5 5 5-5 3 8H4z"
                />
              </svg>
            </div>
            <div className="absolute -top-2 -left-2 w-2 h-2 bg-cyan-400"></div>
            <div className="absolute -bottom-2 -right-2 w-2 h-2 bg-pink-400"></div>
            <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-emerald-400"></div>
          </div>

          <h2 className="font-pixel text-xl sm:text-2xl text-white tracking-wider my-2">
            {title}
          </h2>

          <p className="text-slate-400 text-xs sm:text-sm font-sans mb-6">
            {isGameOver ? "Your inbox is a little lighter. Try again!" : "I beat my inbox. Your move."}
          </p>

          <div className="w-full bg-[#070e1c] rounded-xl p-4 border border-slate-800 flex items-center justify-around my-2">
            <div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                {isLive ? "BEFORE" : "SIMULATED"}
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-200 mt-1">
                {initialTotal}
              </div>
            </div>

            <div className="text-cyan-400 text-xl font-bold font-mono">→</div>

            <div>
              <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                {isLive ? "AFTER" : "SIMULATED AFTER"}
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-300 mt-1">
                {Math.max(0, initialTotal - totalCleared)}
              </div>
            </div>
          </div>

          <div className="w-full grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-800/80 text-left">
            <div>
              <div className="text-[10px] font-mono text-slate-500 uppercase">FINAL SCORE</div>
              <div className="text-lg sm:text-xl font-bold font-mono text-cyan-400">
                {score.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-mono text-slate-500 uppercase">RANK</div>
              <div className="text-lg sm:text-xl font-bold font-mono text-emerald-400">
                {rank}
              </div>
            </div>
          </div>
        </div>

        {/* Right Details */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 self-start px-3 py-1 bg-emerald-950/60 border border-emerald-500/40 rounded-full text-xs font-mono text-emerald-300">
            <span>RANK UNLOCKED</span>
            <span>/</span>
            <span className="font-bold">INBOX {rank.toUpperCase()}</span>
          </div>

          <div>
            <h1 className="font-pixel text-2xl sm:text-3xl text-white leading-relaxed mb-3">
              {isGameOver ? "Round over. Nice effort." : "The inbox is quiet. You did that."}
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              {inboxSource === "gmail" && isLive
                ? "Your unread Gmail batch has been cleared. Archived emails are safe in All Mail, and trashed messages remain recoverable for 30 days."
                : "Your batch is clear. Every decision added up to a little more headspace."}
            </p>
          </div>

          <div className="bg-[#0b1322] border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between text-sm font-mono text-slate-200 mb-2">
              <span className="font-bold text-white">
                {totalCleared} / {initialTotal} cleared
              </span>
              <span className="text-emerald-400 font-bold">✓</span>
            </div>
            <div className="text-xs font-mono text-slate-400 mb-3">
              Reviewed {reviewedCount} / {initialTotal}
            </div>

            <div className="w-full bg-slate-800 rounded-full h-2.5 mb-4 overflow-hidden" role="progressbar" aria-label="Emails cleared" aria-valuemin={0} aria-valuemax={initialTotal} aria-valuenow={totalCleared}>
              <div
                className="bg-[#a3e635] h-full rounded-full shadow-[0_0_12px_rgba(163,230,53,0.7)]"
                style={{ width: `${initialTotal ? Math.min(100, Math.round((totalCleared / initialTotal) * 100)) : 0}%` }}
              />
            </div>

            <ul className="space-y-2 text-xs font-mono text-slate-400">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>
                  <strong className="text-slate-200">{archivedCount}</strong> archived • still searchable
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                <span>
                  <strong className="text-slate-200">{trashedCount}</strong> trashed • not permanently deleted
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>
                  <strong className="text-slate-200">Protected emails saved: {protectedSaved} / {protectedDecisions.length}</strong>
                </span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                restartGame();
              }}
              className="flex-1 min-h-[48px] px-6 py-3 rounded-xl font-bold font-mono text-sm text-slate-950 bg-cyan-400 hover:bg-cyan-300 active:scale-95 transition-all shadow-[0_0_20px_rgba(34,211,238,0.4)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Play Again</span>
            </button>

            <button
              type="button"
              onClick={() => setPhase("landing")}
              className="min-h-[48px] px-6 py-3 rounded-xl font-bold font-mono text-sm text-slate-300 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>← Back to home</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center text-xs text-slate-500 font-mono">
        {footerText}
      </div>
    </div>
  );
};
