"use client";
import { useState } from "react";
import { X, Sparkles, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PRESETS = ["person", "car", "helmet", "forklift", "dog", "package"];

export function ClassInput({ classes, onChange }: { classes: string[]; onChange: (c: string[]) => void }) {
  const [value, setValue] = useState("");

  function add(raw: string) {
    const items = raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    const next = Array.from(new Set([...classes, ...items]));
    onChange(next);
    setValue("");
  }
  function remove(c: string) {
    onChange(classes.filter((x) => x !== c));
  }

  return (
    <div className="space-y-3">
      <div className="gradient-border flex flex-wrap items-center gap-2 p-2.5">
        <Sparkles className="ml-1.5 h-4 w-4 shrink-0 text-primary" />
        <AnimatePresence>
          {classes.map((c) => (
            <motion.span
              key={c}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="inline-flex items-center gap-1 rounded-lg bg-primary/15 px-2.5 py-1 text-sm font-medium text-primary"
            >
              {c}
              <button onClick={() => remove(c)} aria-label={`Remove ${c}`} className="hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(value); } }}
          placeholder={classes.length ? "Add another…" : "Type anything: person, forklift, red car…"}
          className="min-w-[140px] flex-1 bg-transparent px-1.5 py-1 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.filter((p) => !classes.includes(p)).map((p) => (
          <button
            key={p}
            onClick={() => add(p)}
            className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            <Plus className="h-3 w-3" /> {p}
          </button>
        ))}
      </div>
    </div>
  );
}
