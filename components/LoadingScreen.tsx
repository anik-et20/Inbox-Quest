"use client";

import React from "react";
import { signIn } from "next-auth/react";
import { useGameStore } from "@/store/game";

export const LoadingScreen: React.FC = () => {
  const {
    loadProgress,
    statusMessage,
    loadError,
    inboxSource,
    retryGame,
    startGame,
    setIsLive,
  } = useGameStore();
  const sessionExpired = loadError?.includes("TOKEN_EXPIRED") || loadError?.includes("401");

  return (
    <div className="w-full max-w-md mx-auto my-auto p-8 rounded-3xl bg-[#0a1424] border border-cyan-500/30 shadow-[0_0_40px_rgba(0,229,255,0.15)] flex flex-col items-center text-center">
      <div className="relative w-28 h-28 my-6 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-cyan-500/30 animate-ping opacity-30" />
        <div className="absolute inset-3 rounded-full border border-cyan-400/50" />
        <div className="absolute inset-8 rounded-full border border-teal-400/70" />
        <div className="w-5 h-5 rounded-full bg-cyan-400 shadow-[0_0_15px_rgba(0,229,255,1)]" />
        <div
          className="absolute inset-0 rounded-full border-t-2 border-cyan-300 animate-spin"
          style={{ animationDuration: "1.5s" }}
        />
      </div>

      <h2 className="font-pixel text-lg sm:text-xl text-white tracking-wider mb-2">
        {statusMessage}
      </h2>
      <p className="text-xs text-slate-400 font-mono mb-6">
        {inboxSource === "gmail" ? "Reading unread metadata (From, Subject, Snippet only)" : "Scanning 40 simulated demo messages"}
      </p>

      <div className="w-full bg-slate-900 border border-slate-700 rounded-full h-3 overflow-hidden p-0.5">
        <div
          className="bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 h-full rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(0,229,255,0.8)]"
          style={{ width: `${Math.max(5, loadProgress)}%` }}
        />
      </div>
      <div className="w-full flex items-center justify-between text-[11px] font-mono text-cyan-400 mt-3">
        <span>AI ANALYSIS</span>
        <span>{loadProgress}%</span>
      </div>

      {loadError && (
        <div className="w-full mt-6 rounded-xl border border-rose-500/40 bg-rose-950/30 p-4 text-left">
          <p className="text-sm text-rose-200 font-mono break-words">{loadError}</p>
          <div className="flex gap-3 mt-4">
            {sessionExpired && (
              <button type="button" onClick={() => signIn("google")} className="px-4 py-2 rounded-lg bg-amber-400 text-slate-950 font-mono text-xs">
                Reconnect Gmail
              </button>
            )}
            <button type="button" onClick={() => void retryGame()} className="px-4 py-2 rounded-lg bg-cyan-400 text-slate-950 font-mono text-xs">
              Retry
            </button>
            <button type="button" onClick={() => { setIsLive(false); void startGame("demo"); }} className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 font-mono text-xs">
              Play Demo instead
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
