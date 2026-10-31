import React from "react";
import { EmailType } from "@/lib/types";

interface EnemySpriteProps {
  type: EmailType;
  className?: string;
  size?: number;
}

export const EnemySprite: React.FC<EnemySpriteProps> = ({ type, className = "", size = 48 }) => {
  switch (type) {
    case "newsletter":
      // Purple Space Invader / Blob (Screenshot 1, 2)
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          role="img"
          aria-label={`${type} email enemy`}
          className={`text-purple-400 drop-shadow-[0_0_12px_rgba(168,85,247,0.7)] ${className}`}
        >
          {/* Pixelated alien shape */}
          <path d="M4 2h2v2H4V2zm14 0h2v2h-2V2zM6 4h12v2H6V4zm-2 2h16v4H4V6zm2 4h12v4H6v-4zm-4 4h4v4H2v-4zm18 0h4v4h-4v-4zM6 18h2v4H6v-4zm10 0h2v4h-2v-4zM8 10h2v2H8v-2zm6 0h2v2h-2v-2z" />
        </svg>
      );

    case "spam":
      // Pink Swarm (3 triangular skull/bugs clustered, Screenshot 1 & 4)
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 28 28"
          fill="currentColor"
          role="img"
          aria-label={`${type} email enemy`}
          className={`text-pink-400 drop-shadow-[0_0_12px_rgba(236,72,153,0.7)] ${className}`}
        >
          {/* Cluster of 3 pixel bugs */}
          {/* Bug 1 (Top Left) */}
          <path d="M4 4h4v2H4V4zm-2 2h8v4H2V6zm2 4h4v2H4v-2z" />
          {/* Bug 2 (Top Right) */}
          <path d="M16 4h4v2h-4V4zm-2 2h8v4h-8V6zm2 4h4v2h-4v-2z" />
          {/* Bug 3 (Bottom Center) */}
          <path d="M10 14h4v2h-4v-2zm-2 2h8v4H8v-4zm2 4h4v2h-4v-2z" />
        </svg>
      );

    case "important":
      // Green Gem / Diamond star (Screenshot 1 & 4)
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          role="img"
          aria-label={`${type} email enemy`}
          className={`text-emerald-400 drop-shadow-[0_0_14px_rgba(34,197,94,0.7)] ${className}`}
        >
          <path d="M11 1h2v3h-2V1zm-3 4h8v2H8V5zM5 8h14v2H5V8zm-2 3h18v2H3v-2zm2 3h14v2H5v-2zm3 3h8v2H8v-2zm3 3h2v3h-2v-3z" />
        </svg>
      );

    case "receipt":
      // Amber Chest / Vault (Screenshot 1, 2, 4)
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          role="img"
          aria-label={`${type} email enemy`}
          className={`text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.7)] ${className}`}
        >
          <path d="M3 4h18v4H3V4zm0 6h18v10H3V10zm8 2h2v4h-2v-4z" />
          <path d="M2 3h20v2H2V3zm0 5h20v2H2V8z" opacity="0.6" />
        </svg>
      );

    case "needs_reply":
      // Pink/Rose Horned Boss (Screenshot 1 & 4)
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          role="img"
          aria-label={`${type} email enemy`}
          className={`text-rose-400 drop-shadow-[0_0_14px_rgba(244,63,94,0.8)] ${className}`}
        >
          {/* Horns */}
          <path d="M2 3h3v5H2V3zm17 0h3v5h-3V3z" />
          {/* Main Boss face */}
          <path d="M4 7h16v10H4V7zm2 3h3v3H6v-3zm9 0h3v3h-3v-3zm-6 4h4v2H9v-2z" />
          {/* Jaw / Fangs */}
          <path d="M5 17h2v3H5v-3zm12 0h2v3h-2v-3z" />
        </svg>
      );
  }
};
