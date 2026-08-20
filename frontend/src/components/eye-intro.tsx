"use client";
import { useEffect } from "react";
import { motion } from "framer-motion";

export function EyeIntro({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      onClick={onDone}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex cursor-pointer items-center justify-center bg-background"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: [0.9, 1, 1, 1.6], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2.6, times: [0, 0.2, 0.75, 1], ease: "easeInOut" }}
        className="relative"
      >
        <svg width="260" height="260" viewBox="0 0 220 220" fill="none">
          <defs>
            <radialGradient id="iris" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(190 95% 65%)" />
              <stop offset="45%" stopColor="hsl(265 90% 60%)" />
              <stop offset="100%" stopColor="hsl(265 60% 12%)" />
            </radialGradient>
            <clipPath id="eye">
              <path d="M10,110 Q110,30 210,110 Q110,190 10,110 Z" />
            </clipPath>
            <filter id="glow"><feGaussianBlur stdDeviation="3" /></filter>
          </defs>

          {/* scanning rings */}
          <g opacity="0.5">
            <circle cx="110" cy="110" r="104" stroke="hsl(265 90% 66%)" strokeWidth="0.5" strokeDasharray="2 6"
              className="animate-[spin_9s_linear_infinite]" style={{ transformBox: "view-box", transformOrigin: "110px 110px" }} />
            <circle cx="110" cy="110" r="92" stroke="hsl(190 95% 55%)" strokeWidth="0.5" strokeDasharray="1 10"
              className="animate-[spin_14s_linear_infinite_reverse]" style={{ transformBox: "view-box", transformOrigin: "110px 110px" }} />
          </g>

          {/* eye interior (clipped to almond) */}
          <g clipPath="url(#eye)">
            <circle cx="110" cy="110" r="82" fill="hsl(265 60% 8%)" />
            <motion.circle
              cx="110" cy="110" r="52" fill="url(#iris)"
              initial={{ opacity: 0 }} animate={{ opacity: [0, 1] }} transition={{ delay: 0.5, duration: 0.6 }}
            />
            {/* concentric iris rings */}
            <circle cx="110" cy="110" r="52" stroke="hsl(190 95% 70% / 0.5)" strokeWidth="0.6" fill="none" />
            <circle cx="110" cy="110" r="38" stroke="hsl(265 90% 80% / 0.4)" strokeWidth="0.6" fill="none" />
            {/* radar sweep */}
            <line x1="110" y1="110" x2="110" y2="58" stroke="hsl(190 95% 70%)" strokeWidth="1.2" opacity="0.8"
              className="animate-[spin_2.4s_linear_infinite]" style={{ transformBox: "view-box", transformOrigin: "110px 110px" }} />
            {/* pupil */}
            <motion.circle cx="110" cy="110" r="16" fill="hsl(258 40% 4%)"
              animate={{ r: [16, 13, 16] }} transition={{ duration: 1.8, repeat: Infinity }} />
            <circle cx="104" cy="104" r="4" fill="white" opacity="0.85" />

            {/* eyelids opening */}
            <motion.rect x="0" y="0" width="220" height="112" fill="hsl(var(--background))"
              initial={{ scaleY: 1 }} animate={{ scaleY: 0 }} transition={{ delay: 0.35, duration: 0.9, ease: "easeInOut" }}
              style={{ transformBox: "fill-box", transformOrigin: "top" }} />
            <motion.rect x="0" y="108" width="220" height="112" fill="hsl(var(--background))"
              initial={{ scaleY: 1 }} animate={{ scaleY: 0 }} transition={{ delay: 0.35, duration: 0.9, ease: "easeInOut" }}
              style={{ transformBox: "fill-box", transformOrigin: "bottom" }} />
          </g>

          {/* eye outline */}
          <path d="M10,110 Q110,30 210,110 Q110,190 10,110 Z" stroke="hsl(265 90% 66%)" strokeWidth="1.5" fill="none" filter="url(#glow)" opacity="0.9" />
        </svg>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: [0, 0.8, 0] }} transition={{ duration: 2.6, times: [0.3, 0.6, 1] }}
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm font-medium tracking-[0.3em] text-white/60"
        >
          SIGHTLINE
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
