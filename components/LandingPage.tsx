"use client";

import React from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useGameStore } from "@/store/game";
import { EnemySprite } from "./EnemySprite";

export const LandingPage: React.FC = () => {
  const { startGame, setIsLive } = useGameStore();
  const { data: session, status } = useSession();

  const handlePlayDemo = () => {
    setIsLive(false);
    void startGame("demo");
  };

  const handlePlayGmail = () => {
    setIsLive(false); // Always starts in DRY RUN
    void startGame("gmail");
  };

  const isAuthenticated = status === "authenticated" && session?.user;

  return (
    <div className="w-full flex flex-col items-center justify-center">
      {/* Hero Section matching Screenshot 1 */}
      <div className="w-full max-w-6xl mx-auto rounded-3xl border border-cyan-500/20 bg-[#091222]/80 backdrop-blur-xl p-8 sm:p-12 shadow-[0_0_50px_rgba(0,229,255,0.06)] relative overflow-hidden">
        {/* Subtle grid backdrop lines */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(0, 229, 255, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 229, 255, 0.1) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Copy & CTAs */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 self-start text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              YOUR INBOX. THE FINAL BOSS.
            </div>

            <h1 className="font-pixel text-2xl sm:text-4xl lg:text-5xl text-white tracking-wide leading-tight sm:leading-tight">
              Play the game.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
                Clear the inbox.
              </span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl font-sans">
              Turn email overload into an arcade run. Beat the clutter, protect what matters, and get
              back to real life with real-time AI enemy classification.
            </p>

            {/* Google Authentication States */}
            {isAuthenticated ? (
              <div className="flex flex-col gap-3 p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>Connected: <strong className="text-cyan-300">{session.user?.email}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => signOut()}
                    className="text-xs font-mono text-slate-400 hover:text-rose-400 underline cursor-pointer"
                  >
                    Disconnect
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handlePlayGmail}
                    className="min-h-[48px] px-6 py-3 rounded-xl font-bold font-mono text-sm text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:opacity-90 active:scale-95 transition-all shadow-[0_0_25px_rgba(34,211,238,0.5)] flex items-center gap-2 cursor-pointer"
                  >
                    <span>⚡ Play with my Gmail</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePlayDemo}
                    className="min-h-[48px] px-5 py-3 rounded-xl font-bold font-mono text-xs text-slate-300 bg-slate-900 border border-slate-700 hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
                  >
                    <span>Play Demo</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={handlePlayDemo}
                  className="min-h-[48px] px-8 py-3.5 rounded-xl font-bold font-mono text-sm text-slate-950 bg-cyan-400 hover:bg-cyan-300 active:scale-95 transition-all shadow-[0_0_25px_rgba(34,211,238,0.5)] flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-300"
                >
                  <span>▶ Play Demo</span>
                </button>

                <button
                  type="button"
                  onClick={() => signIn("google")}
                  className="min-h-[48px] px-6 py-3.5 rounded-xl font-mono text-sm text-slate-200 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 active:scale-95 transition-all flex items-center gap-2 shadow-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  {/* Google G Icon */}
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Connect Gmail</span>
                </button>
              </div>
            )}

            {/* Trust and safety disclaimers */}
            <div className="text-xs text-slate-500 font-mono flex flex-wrap gap-4 pt-2">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="text-emerald-400 font-bold">✓</span> Safe Dry Run by default
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="text-emerald-400 font-bold">✓</span> Real actions, not a to-do list
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="text-emerald-400 font-bold">✓</span> Recoverable from Trash
              </span>
            </div>
          </div>

          {/* Right Column: Hero Preview Card */}
          <div className="lg:col-span-5 relative">
            <div className="flex items-center justify-center gap-5 mb-4 p-3 bg-slate-900/40 rounded-2xl border border-slate-800/80">
              <EnemySprite type="spam" size={26} />
              <EnemySprite type="newsletter" size={32} />
              <EnemySprite type="important" size={26} />
              <EnemySprite type="receipt" size={26} />
              <EnemySprite type="needs_reply" size={26} />
            </div>

            <div className="rounded-2xl bg-[#0c1628] border-2 border-cyan-500/30 p-6 shadow-2xl relative">
              <div className="flex items-center justify-between text-xs font-mono mb-3">
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/40 font-bold">
                  NEWSLETTER
                </span>
                <span className="text-slate-400">AI 98%</span>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <EnemySprite type="newsletter" size={28} />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">Amazon Deals</div>
                  <p className="text-[11px] text-slate-400 font-mono">deals@demo.example • 10:42 AM</p>
                </div>
              </div>

              <div className="font-bold text-xs text-slate-200 mb-1">
                Your weekend deals just dropped
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                A fresh batch of home, tech and everyday finds. Take a peek at this week&#39;s top picks.
              </p>

              <div className="grid grid-cols-2 gap-2">
                <div className="py-2 px-3 rounded-lg bg-cyan-400 text-slate-950 font-bold font-mono text-xs text-center">
                  ← Archive
                </div>
                <div className="py-2 px-3 rounded-lg bg-slate-800 text-slate-300 font-mono text-xs text-center border border-slate-700">
                  Keep →
                </div>
              </div>

              <div className="mt-3 text-[10px] text-emerald-400 font-mono text-center flex items-center justify-center gap-1">
                <span>✓</span> ARCHIVED: Amazon Deals (+100 XP)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
