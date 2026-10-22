import React from 'react';

/**
 * SafeSight.AI Brand Logo Component
 * Matches the official industrial safety brand identity:
 * - Safety Hardhat in Light Orange (replaces the former blue)
 * - Shield with verified Checkmark in Teal
 * - Typography: "SafeSight" in Light Orange, ".AI" in Teal
 */
export function SafeSightIcon({ className = "w-10 h-10", size }) {
  const style = size ? { width: size, height: size } : {};

  return (
    <svg 
      viewBox="0 0 160 160" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      style={style}
    >
      <defs>
        {/* Light Orange gradient for the Safety Hardhat */}
        <linearGradient id="ss-helmet-orange" x1="20" y1="10" x2="140" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fb923c" />   {/* Light Orange */}
          <stop offset="60%" stopColor="#f97316" />  {/* Warm Orange */}
          <stop offset="100%" stopColor="#ea580c" /> {/* Deep Orange shadow */}
        </linearGradient>

        {/* Top highlight on helmet */}
        <linearGradient id="ss-helmet-glow" x1="80" y1="10" x2="80" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffedd5" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#fed7aa" stopOpacity="0" />
        </linearGradient>

        {/* Shield Teal Gradient */}
        <linearGradient id="ss-shield-teal" x1="40" y1="65" x2="120" y2="155" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#14b8a6" />  {/* Cyan / Teal */}
          <stop offset="70%" stopColor="#0d9488" />  {/* Deep Teal */}
          <stop offset="100%" stopColor="#0f766e" /> {/* Dark Teal */}
        </linearGradient>

        <filter id="ss-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* SHIELD (Lower Body) */}
      <g filter="url(#ss-shadow)">
        <path 
          d="M 38 68 C 38 68 80 65 80 65 C 80 65 122 68 122 68 C 122 108 106 136 80 152 C 54 136 38 108 38 68 Z" 
          fill="url(#ss-shield-teal)" 
        />
        {/* Subtle inner shield edge */}
        <path 
          d="M 44 72 C 44 72 80 70 80 70 C 80 70 116 72 116 72 C 116 106 102 130 80 144 C 58 130 44 106 44 72 Z" 
          stroke="#5eead4" 
          strokeWidth="1.5" 
          strokeOpacity="0.3"
        />
      </g>

      {/* WHITE CHECKMARK IN SHIELD */}
      <path 
        d="M 58 106 L 73 121 L 105 85" 
        stroke="#ffffff" 
        strokeWidth="11" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />

      {/* HARDHAT DOME (Top) in Vibrant Light Orange */}
      <g filter="url(#ss-shadow)">
        <path 
          d="M 36 62 C 34 28 54 12 80 12 C 106 12 126 28 124 62 Z" 
          fill="url(#ss-helmet-orange)" 
        />

        {/* Center Ridge of Hardhat */}
        <path 
          d="M 74 13 C 74 13 77 12 80 12 C 83 12 86 13 86 13 L 88 62 L 72 62 Z" 
          fill="#ffedd5" 
          opacity="0.45" 
        />

        {/* Left Ridge Contour */}
        <path 
          d="M 54 30 C 58 24 64 20 70 16 L 72 62 L 60 62 Z" 
          fill="#c2410c" 
          opacity="0.25" 
        />

        {/* Right Ridge Contour */}
        <path 
          d="M 106 30 C 102 24 96 20 90 16 L 88 62 L 100 62 Z" 
          fill="#c2410c" 
          opacity="0.25" 
        />

        {/* Helmet Top Glow */}
        <ellipse cx="80" cy="22" rx="28" ry="8" fill="url(#ss-helmet-glow)" />

        {/* HARDHAT BRIM (Visor) in Light Orange */}
        <path 
          d="M 22 62 C 22 57 28 55 36 55 L 124 55 C 132 55 138 57 138 62 C 138 67 132 69 124 69 L 36 69 C 28 69 22 67 22 62 Z" 
          fill="url(#ss-helmet-orange)" 
        />
        {/* Visor 3D bottom bevel */}
        <path 
          d="M 26 64 C 42 68 118 68 134 64 C 132 68 124 70 118 70 L 42 70 C 36 70 28 68 26 64 Z" 
          fill="#9a3412" 
          opacity="0.4" 
        />
      </g>
    </svg>
  );
}

/**
 * Full SafeSight.AI Brand Header Logo (Icon + Styled Text)
 */
export default function SafeSightLogo({ 
  size = "md", // "sm" | "md" | "lg"
  showSubtitle = true,
  subtitleText = "Industrial Computer Vision & PPE Audit",
  badgeText = null,
  className = ""
}) {
  const iconSizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
    xl: "w-20 h-20"
  };

  const textSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-2xl",
    xl: "text-3xl"
  };

  return (
    <div className={`flex items-center space-x-3 select-none ${className}`}>
      {/* Icon with light orange hardhat and teal shield */}
      <div className="relative shrink-0">
        <SafeSightIcon className={iconSizes[size] || iconSizes.md} />
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
      </div>

      {/* Brand Text: "SafeSight" in Light Orange, ".AI" in Teal */}
      <div>
        <div className="flex items-center space-x-2">
          <span className={`font-black tracking-tight leading-none ${textSizes[size] || textSizes.md}`}>
            <span className="text-orange-500 dark:text-orange-400 drop-shadow-xs">
              SafeSight
            </span>
            <span className="text-teal-600 dark:text-teal-400">
              .AI
            </span>
          </span>

          {badgeText && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60 shadow-2xs">
              {badgeText}
            </span>
          )}
        </div>

        {showSubtitle && (
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-tight hidden sm:block">
            {subtitleText}
          </p>
        )}
      </div>
    </div>
  );
}
