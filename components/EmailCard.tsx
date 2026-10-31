"use client";

import React, { useEffect, useState } from "react";
import { motion, PanInfo } from "framer-motion";
import { ClassifiedEmail, EmailAction, ENEMY_METADATA } from "@/lib/types";
import { EnemySprite } from "./EnemySprite";
import { useGameStore } from "@/store/game";
import { getTier } from "@/lib/protection";

interface EmailCardProps {
  email: ClassifiedEmail;
  nextEmails: ClassifiedEmail[];
  onAction: (action: EmailAction) => void;
}

export const EmailCard: React.FC<EmailCardProps> = ({ email, nextEmails, onAction }) => {
  const [dragOffset, setDragOffset] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const [debugEnabled, setDebugEnabled] = useState(false);
  const { inboxSource, isLive, currentIndex, queue } = useGameStore();

  const meta = ENEMY_METADATA[email.classifiedType];
  const { tier, tierReason } = getTier(email);
  const senderLocalPart = email.senderEmail.split("@")[0] || email.senderEmail;

  useEffect(() => {
    const handleDebugToggle = (event: KeyboardEvent) => {
      if (event.shiftKey && event.key.toLowerCase() === "d") {
        event.preventDefault();
        setDebugEnabled((enabled) => !enabled);
      }
    };
    window.addEventListener("keydown", handleDebugToggle);
    return () => window.removeEventListener("keydown", handleDebugToggle);
  }, []);

  const handleDrag = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setDragOffset(info.offset.x);
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 120;
    if (info.offset.x < -threshold) {
      onAction("archive");
    } else if (info.offset.x > threshold) {
      onAction("keep");
    }
    setDragOffset(0);
  };

  // Drag visual hints
  const isDraggingLeft = dragOffset < -30;
  const isDraggingRight = dragOffset > 30;

  return (
    <div className="relative w-full max-w-lg mx-auto flex flex-col items-center">
      {/* Wave zone header matching Screenshot 2 */}
      <div className="w-full flex items-center justify-between text-xs font-mono text-cyan-400 mb-2 px-1">
        <span className="bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 px-2 py-0.5 rounded text-[11px]">
          WAVE {String(Math.floor(currentIndex / 10) + 1).padStart(2, "0")} / CLUTTER ZONE
        </span>
        <span className="text-slate-500 text-[11px]">
          {inboxSource === "gmail" ? "GMAIL" : "DEMO"} • {inboxSource === "gmail" ? (isLive ? "LIVE" : "DRY RUN") : `${currentIndex + 1}/${queue.length}`}
        </span>
      </div>

      {/* Enemy Mascot Preview over the card (Screenshot 2) */}
      <div className="flex flex-col items-center justify-center py-2 mb-2">
        <div className="p-3 rounded-2xl bg-[#0a1220]/80 border border-slate-800 flex items-center gap-4 shadow-lg">
          <EnemySprite type={email.classifiedType} size={42} />
          <div>
            <div className="text-xs font-mono font-bold text-slate-200 tracking-wide uppercase">
              {meta.tagline.split(" - ")[0]}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              {meta.tagline.split(" - ")[1] || meta.ruleHint}
            </div>
          </div>
        </div>
      </div>

      {/* Card Stack Container */}
      <div className="relative w-full h-[320px]">
        {/* Background Card 2 (Bottom of stack) */}
        {nextEmails[1] && (
          <div
            className="absolute inset-x-4 top-5 h-[270px] rounded-2xl bg-[#0d1728] border border-slate-800/80 shadow-md opacity-40 scale-90 pointer-events-none transition-all duration-300"
            aria-hidden="true"
          />
        )}

        {/* Background Card 1 (Middle of stack) */}
        {nextEmails[0] && (
          <div
            className="absolute inset-x-2 top-2.5 h-[280px] rounded-2xl bg-[#0f1b30] border border-slate-700/60 shadow-lg opacity-70 scale-95 pointer-events-none transition-all duration-300 flex items-start justify-between p-4"
            aria-hidden="true"
          >
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              UP NEXT: {nextEmails[0].sender}
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              AI {Math.round(nextEmails[0].confidence * 100)}%
            </span>
          </div>
        )}

        {/* Active Top Card (Draggable) */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.7}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          animate={{
            x: 0,
            rotate: dragOffset * 0.05,
            transition: { type: "spring", stiffness: 350, damping: 25 },
          }}
          whileTap={{ cursor: "grabbing" }}
          className={`absolute inset-0 rounded-2xl p-6 bg-[#111c30] border-2 shadow-2xl flex flex-col justify-between cursor-grab select-none backdrop-blur-md transition-colors ${
            isDraggingLeft
              ? "border-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.4)]"
              : isDraggingRight
              ? "border-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.4)]"
              : "border-slate-700/80 hover:border-slate-600"
          }`}
          style={{ willChange: "transform" }}
        >
          {debugEnabled && (
            <div className="absolute right-2 top-2 z-20 max-w-[230px] rounded bg-black/85 border border-cyan-500/40 p-2 text-[10px] leading-4 text-cyan-200 font-mono">
              <div>tier: {tier}</div>
              <div>tierReason: {tierReason}</div>
              <div>hasUnsubscribe: {String(Boolean(email.hasUnsubscribe || email.listUnsubscribe))}</div>
              <div>labels: {(email.labelIds || []).join(", ") || "none"}</div>
              <div>senderLocal: {senderLocalPart}</div>
              <div>aiType: {email.classifiedType}</div>
              <div>aiConfidence: {email.confidence.toFixed(2)}</div>
            </div>
          )}
          {/* Card Top Pill & AI Badge */}
          <div className="flex items-center justify-between">
            {/* Enemy Category Pill */}
            <div className="flex items-center gap-2">
              <span
                className="text-[11px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-md uppercase"
                style={{
                  backgroundColor: `${meta.colorHex}22`,
                  color: meta.colorHex,
                  border: `1px solid ${meta.colorHex}55`,
                }}
              >
                {meta.badgeText}
              </span>

              {/* Tooltip trigger for "Why this type?" */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowTooltip(!showTooltip)}
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-[10px] font-mono border border-slate-700"
                  aria-label="Why this type?"
                >
                  ?
                </button>

                {showTooltip && (
                  <div className="absolute left-0 bottom-6 w-52 p-2 bg-slate-900 border border-cyan-500/50 rounded-lg text-[11px] text-slate-200 z-50 shadow-xl font-mono">
                    <div className="font-bold text-cyan-400 mb-0.5">Groq AI Decision:</div>
                    <div>&quot;{email.reason}&quot;</div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Tier: {tierReason}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* AI Confidence */}
            <div className="text-right">
              <span className="text-[11px] font-mono text-slate-400">
                AI {Math.round(email.confidence * 100)}%
              </span>
            </div>
          </div>

          {/* Sender & Enemy Mini-Sprite */}
          <div className="flex items-center gap-3 my-2">
            <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 shrink-0">
              <EnemySprite type={email.classifiedType} size={28} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-white text-base md:text-lg leading-snug truncate">
                {email.sender}
              </h3>
              <p className="text-xs text-slate-400 font-mono truncate">
                {email.senderEmail} • {email.time}
              </p>
            </div>
          </div>

          {/* Subject & Preview */}
          <div className="my-1 flex-1">
            <h4 className="text-sm font-semibold text-slate-100 mb-1 leading-snug line-clamp-1">
              {email.subject}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
              {email.preview}
            </p>
          </div>

          {/* Microcopy footer */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
              tier === "protected"
                ? "bg-rose-950/60 text-rose-300"
                : tier === "clutter"
                  ? "bg-cyan-950/60 text-cyan-300"
                  : "bg-amber-950/60 text-amber-300"
            }`}>
              {tier === "protected" ? "PROTECTED: keep it" : tier === "clutter" ? "CLUTTER: clear it" : "YOUR CALL"}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400">
              {inboxSource === "gmail" ? (isLive ? "LIVE" : "DRY RUN") : "DEMO"}
            </span>
          </div>

          {/* Drag Overlay Feedback indicators */}
          {isDraggingLeft && (
            <div className="absolute inset-0 bg-cyan-950/70 rounded-2xl flex items-center justify-center border-2 border-cyan-400 pointer-events-none">
              <div className="text-cyan-300 font-mono font-bold text-sm tracking-wider uppercase px-4 py-2 bg-slate-900/90 rounded-lg border border-cyan-400/50 shadow-lg">
                ← RELEASE TO ARCHIVE
              </div>
            </div>
          )}

          {isDraggingRight && (
            <div className="absolute inset-0 bg-emerald-950/70 rounded-2xl flex items-center justify-center border-2 border-emerald-400 pointer-events-none">
              <div className="text-emerald-300 font-mono font-bold text-sm tracking-wider uppercase px-4 py-2 bg-slate-900/90 rounded-lg border border-emerald-400/50 shadow-lg">
                RELEASE TO KEEP →
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Swipe Direction Indicators */}
      <div className="w-full flex items-center justify-between text-[11px] font-mono text-slate-500 mt-3 px-2">
        <span>← ARCHIVE</span>
        <span className="text-slate-600">DRAG OR USE KEYS</span>
        <span>KEEP →</span>
      </div>

      {/* 3 Action Buttons below the card (min 44px height, high accessibility) */}
      <div className="w-full grid grid-cols-2 gap-3 mt-4">
        {/* Archive Button */}
        <button
          type="button"
          onClick={() => onAction("archive")}
          className="min-h-[48px] px-4 py-2.5 rounded-xl font-bold font-mono text-xs md:text-sm text-slate-950 bg-cyan-400 hover:bg-cyan-300 active:scale-95 transition-all shadow-[0_0_15px_rgba(34,211,238,0.4)] flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-950"
        >
          <span>← Archive</span>
        </button>

        {/* Keep Button */}
        <button
          type="button"
          onClick={() => onAction("keep")}
          className="min-h-[48px] px-4 py-2.5 rounded-xl font-bold font-mono text-xs md:text-sm text-slate-950 bg-[#bbf7d0] hover:bg-[#86efac] active:scale-95 transition-all shadow-[0_0_15px_rgba(187,247,208,0.4)] flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 focus:ring-offset-slate-950"
        >
          <span>Keep →</span>
        </button>

        {/* Trash Button spanning full width on second row */}
        <button
          type="button"
          onClick={() => onAction("trash")}
          className="col-span-2 min-h-[44px] px-4 py-2 rounded-xl font-bold font-mono text-xs md:text-sm text-pink-300 bg-slate-900/90 hover:bg-pink-950/40 border border-pink-500/40 hover:border-pink-500 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 focus:ring-offset-slate-950"
        >
          <span>↓ Trash (Spam)</span>
        </button>
      </div>

      <div className="text-[11px] text-slate-500 mt-2 text-center font-mono">
        Keyboard: [Left] Archive • [Right] Keep • [Down] Trash
      </div>
    </div>
  );
};
