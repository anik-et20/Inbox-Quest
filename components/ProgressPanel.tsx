import React from "react";
import { useGameStore } from "@/store/game";

export const ProgressPanel: React.FC = () => {
  const { archivedCount, trashedCount, log, queue, inboxSource, isLive, retryAction } = useGameStore();

  const clearedCount = archivedCount + trashedCount;
  const totalEmails = queue.length;
  const percentCleared = totalEmails ? Math.min(100, Math.round((clearedCount / totalEmails) * 100)) : 0;

  return (
    <div className="w-full bg-[#0b1322]/95 border border-[#1e293b] rounded-2xl p-5 shadow-2xl backdrop-blur-md flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span className="text-sm font-semibold text-slate-200 tracking-wide">
            Real-World Progress
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {inboxSource === "gmail" ? (
            isLive ? (
              <span className="px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/60 text-[10px] font-mono text-rose-300 font-bold animate-pulse">
                GMAIL LIVE
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/60 text-[10px] font-mono text-amber-300 font-bold">
                DRY RUN
              </span>
            )
          ) : (
            <>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="text-[10px] font-mono font-medium text-emerald-400">DEMO</span>
            </>
          )}
        </div>
      </div>

      {/* Main Counter */}
      <div className="my-4">
        <div className="text-[11px] font-mono text-cyan-400 tracking-wider uppercase mb-1">
          {inboxSource === "gmail" ? (isLive ? "LIVE INBOX PROGRESS" : "DRY RUN PROGRESS") : "SAMPLE PROGRESS • DEMO"}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
            {clearedCount.toLocaleString()}
          </span>
          <span className="text-slate-500 font-mono text-sm">
            / {totalEmails.toLocaleString()}
          </span>
        </div>
        <div className="text-xs text-slate-400 mt-0.5">
          {inboxSource === "gmail" ? "emails cleared in your inbox" : "emails cleared in this sample run"}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800/80 rounded-full h-2 mt-3 overflow-hidden border border-slate-700/50" role="progressbar" aria-label="Inbox progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentCleared}>
          <div
            className="bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(45,212,191,0.5)]"
            style={{ width: `${percentCleared}%` }}
          />
        </div>
      </div>

      {/* Stats Breakdown */}
      <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-800/80">
        <div className="bg-[#0f172a]/60 p-2.5 rounded-lg border border-slate-800">
          <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
            Archived
          </div>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-0.5">
            {archivedCount.toLocaleString()}
          </div>
        </div>

        <div className="bg-[#0f172a]/60 p-2.5 rounded-lg border border-slate-800">
          <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
            Trashed
          </div>
          <div className="text-xl font-bold font-mono text-pink-400 mt-0.5">
            {trashedCount.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Live Action Log */}
      <div className="mt-4 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">
            LIVE ACTION LOG
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {inboxSource === "gmail" ? (isLive ? "● REAL API" : "○ SIMULATED") : "DEMO"}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[260px] pr-1 space-y-2 font-mono text-xs scrollbar-thin scrollbar-thumb-slate-700">
          {log.length === 0 ? (
            <div className="text-slate-600 text-xs py-4 text-center italic font-mono">
              Waiting for initial move...
            </div>
          ) : (
            log.map((item) => (
              <div
                key={item.id}
                className="p-2 rounded bg-slate-900/80 border border-slate-800 text-[11px] transition-all"
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {/* Status icon: green check when confirmed, spinner when pending, red on error */}
                    {item.status === "confirmed" ? (
                      item.note?.startsWith("Failed") ? (
                        <span className="text-rose-400 font-bold shrink-0">✗</span>
                      ) : (
                        <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      )
                    ) : (
                      <span className="inline-block w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin shrink-0" />
                    )}

                    <span
                      className={`font-semibold capitalize truncate ${
                        item.action === "archive"
                          ? "text-cyan-300"
                          : item.action === "trash"
                          ? "text-pink-400"
                          : "text-amber-300"
                      }`}
                    >
                      {item.action === "keep" ? "Kept" : item.action === "archive" ? "Archived" : "Trashed"}:
                    </span>
                    <span className="text-slate-300 truncate" title={item.sender}>
                      {item.sender}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                    {item.timestamp}
                  </span>
                </div>

                {/* Subtext info */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 pl-4">
                  <span className="truncate max-w-[140px] text-slate-500">{item.subject}</span>
                  {item.note?.startsWith("Failed") ? (
                    <button
                      type="button"
                      onClick={() => retryAction(item.id)}
                      className="text-rose-400 hover:underline cursor-pointer font-bold"
                    >
                      {item.note}
                    </button>
                  ) : item.tier === "clutter" && item.action === "keep" ? (
                    <span className="text-amber-300 font-mono">{item.note || "Kept clutter"}</span>
                  ) : item.isCorrect ? (
                    <span className="text-emerald-400 font-mono">
                      {item.note ? `[${item.note}] ` : ""}+{item.xpChange} XP
                    </span>
                  ) : (
                    <span className="text-rose-400 font-mono">{item.note || "Wrong move"}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-slate-800/80 text-[10px] text-slate-500 mt-auto">
        {inboxSource === "gmail" && isLive
          ? "Live actions modify your Gmail inbox. Trashed items can be restored from Gmail Trash for 30 days."
          : "Cleared = archived + trashed. Kept emails remain in the inbox and do not increase this count."}
      </div>
    </div>
  );
};
