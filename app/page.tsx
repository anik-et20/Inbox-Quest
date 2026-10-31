"use client";

import React, { useState, useEffect, useCallback } from "react";
import { signIn, useSession } from "next-auth/react";
import { useGameStore } from "@/store/game";
import { LandingPage } from "@/components/LandingPage";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Hud } from "@/components/Hud";
import { EmailCard } from "@/components/EmailCard";
import { ProgressPanel } from "@/components/ProgressPanel";
import { EndScreen } from "@/components/EndScreen";
import { FeedbackOverlay } from "@/components/FeedbackOverlay";

export default function Home() {
  const {
    phase,
    inboxSource,
    isLive,
    setIsLive,
    queue,
    currentIndex,
    processAction,
    setPhase,
    startGame,
    score,
    combo,
    health,
    lastFeedback,
  } = useGameStore();

  const [showLiveConfirmModal, setShowLiveConfirmModal] = useState(false);
  const { data: session } = useSession();

  const currentEmail = queue[currentIndex];
  const nextEmails = queue.slice(currentIndex + 1, currentIndex + 3);

  // Keyboard navigation handler: Left = Archive, Right = Keep, Down = Trash
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (phase !== "playing") return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        processAction("archive");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        processAction("keep");
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        processAction("trash");
      }
    },
    [phase, processAction]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Top banner styling based on mode
  const getBannerConfig = () => {
    if (inboxSource === "gmail") {
      if (isLive) {
        return {
          bg: "bg-[#270912] border-rose-500/50 text-rose-300",
          badge: "bg-rose-950 text-rose-400 border-rose-600/60",
          text: "Gmail connected: LIVE MODE",
          sub: "// REAL ACTIONS ENABLED (RECOVERABLE FROM TRASH)",
        };
      }
      return {
        bg: "bg-[#261d08] border-amber-500/50 text-amber-300",
        badge: "bg-amber-950 text-amber-400 border-amber-600/60",
        text: "Gmail connected: DRY RUN",
        sub: "// SIMULATED ON REAL EMAILS",
      };
    }
    return {
      bg: "bg-[#051a24] border-cyan-800/40 text-cyan-300",
      badge: "bg-cyan-950 text-cyan-400 border-cyan-700/60",
      text: "Demo mode",
      sub: "// SAMPLE DATA ONLY",
    };
  };

  const banner = getBannerConfig();

  return (
    <div className="min-h-screen flex flex-col bg-[#060b14] text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950">
      <a href="#game-main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-cyan-400 focus:px-4 focus:py-2 focus:text-slate-950">
        Skip to game
      </a>
      {/* 1. Top Mode Banner */}
      <div
        className={`w-full border-b py-1.5 px-4 text-center text-[11px] font-mono flex items-center justify-center gap-2 transition-colors ${banner.bg}`}
      >
        <span className={`font-bold px-2 py-0.5 rounded border ${banner.badge}`}>
          {banner.text}
        </span>
        <span className="text-slate-300">
          {inboxSource === "gmail"
            ? isLive
              ? "Real emails will be archived or moved to Trash."
              : "Safe mode. No real emails will be modified."
            : "Fake inbox. No real emails changed."}
        </span>
        <span className="text-slate-500 hidden sm:inline">{banner.sub}</span>
      </div>

      {/* 2. Navigation Header */}
      <header className="w-full border-b border-slate-800/80 bg-[#070e1b]/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div
          onClick={() => setPhase("landing")}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-400/50 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(0,229,255,0.4)] group-hover:scale-105 transition-transform">
            <svg
              width="18"
              height="18"
              className="w-4 h-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <span className="font-pixel text-sm sm:text-base text-white tracking-wider">
            INBOX QUEST
          </span>
        </div>

        <nav aria-label="Game navigation" className="flex items-center gap-3">
          {(session as { error?: string } | null)?.error && (
            <button
              type="button"
              onClick={() => signIn("google")}
              className="px-3.5 py-1.5 rounded-lg bg-amber-400 text-slate-950 text-xs font-mono font-bold cursor-pointer"
            >
              Reconnect Gmail
            </button>
          )}
          {phase === "playing" ? (
            <button
              type="button"
              onClick={() => setPhase("landing")}
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 hover:text-white hover:border-slate-600 transition-colors cursor-pointer"
            >
              Exit demo
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsLive(false);
                void startGame("demo");
              }}
              className="px-4 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-mono font-bold transition-all shadow-[0_0_12px_rgba(34,211,238,0.4)] cursor-pointer"
            >
              Play
            </button>
          )}
        </nav>
      </header>

      {/* 3. Main View Router */}
      <main id="game-main" tabIndex={-1} className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        {phase === "landing" && <LandingPage />}

        {phase === "loading" && <LoadingScreen />}

        {phase === "empty_inbox" && (
          <div className="max-w-md mx-auto my-auto p-8 rounded-3xl bg-[#0a1424] border border-cyan-500/30 text-center shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/50 flex items-center justify-center text-emerald-400 text-2xl">
              ✓
            </div>
            <h2 className="font-pixel text-lg text-white mb-2">Inbox already clear!</h2>
            <p className="text-sm text-slate-400 mb-6 font-sans">
              No unread emails found in your inbox right now. Enjoy the peace or hone your skills in Demo Mode.
            </p>
            <button
              type="button"
              onClick={() => {
                setIsLive(false);
                void startGame("demo");
              }}
              className="px-6 py-3 rounded-xl bg-cyan-400 text-slate-950 font-mono font-bold text-sm shadow-[0_0_20px_rgba(34,211,238,0.5)] cursor-pointer"
            >
              Play Demo
            </button>
          </div>
        )}

        {phase === "playing" && (
          <div className="w-full">
            <Hud onToggleLiveModal={() => setShowLiveConfirmModal(true)} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-4">
              <div className="lg:col-span-7 xl:col-span-8 flex flex-col items-center">
                {currentEmail ? (
                  <EmailCard
                    email={currentEmail}
                    nextEmails={nextEmails}
                    onAction={processAction}
                  />
                ) : (
                  <div className="text-center py-20 font-mono text-cyan-400">
                    No enemies left in this wave!
                  </div>
                )}
              </div>

              <div className="lg:col-span-5 xl:col-span-4 h-full">
                <ProgressPanel />
              </div>
            </div>
          </div>
        )}

        {phase === "ended" && <EndScreen />}
      </main>

      <FeedbackOverlay />
      <div aria-live="polite" className="sr-only">
        {phase === "playing" ? `Score ${score}, combo x${combo}, health ${health} of 3${lastFeedback.message ? `. ${lastFeedback.message}` : ""}` : ""}
      </div>

      {/* 4. Live Mode Confirmation Modal */}
      {showLiveConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0d1627] border-2 border-rose-500/60 rounded-3xl p-6 sm:p-8 shadow-[0_0_40px_rgba(244,63,94,0.3)]">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-400/50 flex items-center justify-center text-rose-400 text-xl font-bold mb-4">
              ⚠
            </div>
            <h3 className="font-pixel text-base sm:text-lg text-white mb-2">
              Enable Live Mode?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6 font-sans">
              Live mode will <strong>archive</strong> or <strong>trash</strong> your real Gmail emails as you play.
              Trashed emails are safely kept in your Gmail Trash for <strong>30 days</strong> and can be restored anytime.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsLive(true);
                  setShowLiveConfirmModal(false);
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-rose-500 hover:bg-rose-400 font-mono font-bold text-xs sm:text-sm text-white shadow-lg cursor-pointer"
              >
                Yes, Enable Live Mode
              </button>
              <button
                type="button"
                onClick={() => setShowLiveConfirmModal(false)}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 font-mono text-xs sm:text-sm text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
