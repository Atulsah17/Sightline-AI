"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ScanEye, Radar, Route, Clapperboard, Check } from "lucide-react";

const STAGES = [
  { icon: ScanEye, label: "Uploading & reading frames" },
  { icon: Radar, label: "Detecting objects (open-vocabulary)" },
  { icon: Route, label: "Tracking across frames" },
  { icon: Clapperboard, label: "Rendering outputs" },
];

export function Processing() {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 4500);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-md py-8 text-center">
      <div className="relative mx-auto mb-8 h-24 w-24">
        <span className="absolute inset-0 animate-pulse-ring rounded-full bg-primary/40" />
        <span className="absolute inset-0 rounded-full border-2 border-primary/30 border-t-primary animate-spin-slow" />
        <div className="absolute inset-2 flex items-center justify-center rounded-full gradient-btn text-white">
          <ScanEye className="h-9 w-9" />
        </div>
      </div>

      <h2 className="text-xl font-bold">Analyzing your video</h2>
      <p className="mt-1 text-sm text-muted-foreground">Running on a cloud GPU — this can take a minute.</p>

      <div className="mt-8 space-y-2 text-left">
        {STAGES.map(({ icon: Icon, label }, i) => {
          const done = i < stage;
          const active = i === stage;
          return (
            <div
              key={label}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                active ? "border-primary/40 bg-primary/5" : "border-border"
              }`}
            >
              <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                done ? "bg-emerald-500/20 text-emerald-400" : active ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              }`}>
                {done ? <Check className="h-4 w-4" /> : <Icon className={`h-4 w-4 ${active ? "animate-pulse" : ""}`} />}
              </span>
              <span className={`text-sm ${active || done ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
              {active && <span className="ml-auto h-2 w-2 animate-ping rounded-full bg-primary" />}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
