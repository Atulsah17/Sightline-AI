"use client";
import { motion } from "framer-motion";
import { Eye, ArrowRight, Radar, Route, Hash, Bell, HardHat } from "lucide-react";
import { Button } from "@/components/ui/button";

const STRIP = [
  { icon: Radar, label: "Detect" },
  { icon: Route, label: "Track" },
  { icon: Hash, label: "Count" },
  { icon: Bell, label: "Alert" },
  { icon: HardHat, label: "Comply" },
];

export function Landing({ onLaunch }: { onLaunch: () => void }) {
  return (
    <section className="relative min-h-screen overflow-hidden bg-background">
      {/* annotated-detection video background (our actual product output) */}
      <video
        src="/hero.mp4"
        autoPlay muted loop playsInline
        className="absolute inset-0 h-full w-full object-cover opacity-60"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(60rem_40rem_at_50%_-10%,hsl(265_90%_66%/0.25),transparent_60%)]" />

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* nav */}
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-btn text-white shadow-glow">
              <Eye className="h-4 w-4" />
            </div>
            <span className="font-bold tracking-tight">Sightline</span>
          </div>
          <button onClick={onLaunch} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Launch app →
          </button>
        </nav>

        {/* hero */}
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80 backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" /> Open-vocabulary vision AI · no training
            </div>
            <h1 className="text-balance text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-7xl">
              See everything in <br className="hidden sm:block" />
              <span className="gradient-text">your video.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-white/70">
              Describe what to find in plain English. Sightline detects, tracks, counts, and flags it —
              annotated video, analytics, and real-time alerts.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" className="px-8 text-base" onClick={onLaunch}>
                Launch Sightline <ArrowRight className="h-5 w-5" />
              </Button>
              <span className="text-sm text-white/50">No signup · runs on cloud GPU</span>
            </div>
          </motion.div>
        </div>

        {/* feature strip */}
        <div className="mx-auto mb-10 flex w-full max-w-2xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-6">
          {STRIP.map(({ icon: Icon, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.08 }}
              className="flex items-center gap-2 text-sm text-white/60"
            >
              <Icon className="h-4 w-4 text-primary" /> {label}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
