import React from "react";
import { useGameStore } from "@/store/game";

interface HudProps {
  onToggleLiveModal: () => void;
}

export const Hud: React.FC<HudProps> = ({ onToggleLiveModal }) => {
  const {
    score,
    combo,
    currentIndex,
    health,
    inboxSource,
    isLive,
    setIsLive,
    rewindLastAction,
    queue,
  } = useGameStore();

  const currentWave = Math.floor(currentIndex / 10) + 1;
  const formattedScore = score.toLocaleString();
  const totalEmails = queue.length;
  const totalWaves = Math.max(1, Math.ceil(totalEmails / 10));

  const getComboStyle = (c: number) => {
    if (c >= 10) {
      return "text-[#ff4df0] drop-shadow-[0_0_12px_rgba(255,77,240,0.8)] border-[#ff4df0]/50";
    }
    if (c >= 5) {
      return "text-[#a3e635] drop-shadow-[0_0_12px_rgba(163,230,53,0.8)] border-[#a3e635]/50";
    }
    if (c >= 2) {
      return "text-[#4ade80] drop-shadow-[0_0_10px_rgba(74,222,128,0.7)] border-[#4ade80]/40";
    }
    return "text-[#00e5ff] drop-shadow-[0_0_8px_rgba(0,229,255,0.5)] border-cyan-500/30";
  };

  const handleToggleMode = () => {
    if (!isLive) {
      // Prompt confirmation modal before enabling Live mode
      onToggleLiveModal();
    } else {
      // Revert safely back to Dry Run
      setIsLive(false);
    }
  };

  return (
    <div className="w-full mb-6">
      {/* Title Bar & Safety Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h1 className="font-pixel text-lg md:text-xl text-white tracking-wider flex items-center gap-2">
          INBOX RAID
        </h1>

        <div className="flex items-center gap-3">
          {/* Mode Indicator & Toggle in Gmail mode */}
          {inboxSource === "gmail" && (
            <div className="flex items-center gap-2 bg-[#091322] border border-slate-700 p-1 rounded-xl">
              <button
                type="button"
                onClick={handleToggleMode}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  isLive
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/60 shadow-[0_0_10px_rgba(244,63,94,0.4)]"
                    : "bg-amber-400/20 text-amber-300 border border-amber-400/60 shadow-[0_0_10px_rgba(251,191,36,0.3)]"
                }`}
              >
                {isLive ? "● LIVE MODE" : "○ DRY RUN"}
              </button>

              {/* Rewind button visible in Live mode */}
              {isLive && (
                <button
                  type="button"
                  onClick={() => rewindLastAction()}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 cursor-pointer"
                  title="Undo last action in Gmail"
                >
                  ↺ Rewind
                </button>
              )}
            </div>
          )}

          <div className="px-3 py-1 bg-slate-800/80 rounded border border-slate-700 text-xs text-slate-300 font-mono">
            {currentIndex} / {totalEmails}
          </div>
        </div>
      </div>

      {/* Top HUD Box */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0d1627]/90 border border-[#1e293b] rounded-xl p-4 shadow-lg backdrop-blur-md">
        <div>
          <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
            Score
          </div>
          <div className="text-xl md:text-2xl font-bold font-mono text-[#00e5ff] drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]">
            {formattedScore}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
            Combo
          </div>
          <div
            className={`text-xl md:text-2xl font-extrabold font-mono transition-all duration-300 ${getComboStyle(
              combo
            )}`}
          >
            x{combo}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
            Wave
          </div>
          <div className="text-xl md:text-2xl font-mono font-semibold text-slate-200">
            {String(currentWave).padStart(2, "0")}{" "}
            <span className="text-sm text-slate-500 font-normal">/ {totalWaves}</span>
          </div>
        </div>

        <div>
          <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
            Health
          </div>
          <div className="flex items-center gap-1.5 mt-1" aria-label={`${health} of 3 health`}>
            {[1, 2, 3].map((heartIndex) => {
              const isFilled = heartIndex <= health;
              return (
                <span
                  key={heartIndex}
                  className={`text-xl transition-all duration-300 ${
                    isFilled
                      ? "text-pink-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)] scale-100"
                      : "text-slate-700 opacity-40 scale-90"
                  }`}
                  aria-label={isFilled ? "Heart: available health" : "Heart: lost health"}
                >
                  {isFilled ? "♥" : "♡"}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
