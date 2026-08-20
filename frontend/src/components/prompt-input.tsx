"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Loader2, Wand2 } from "lucide-react";
import { parsePrompt } from "@/lib/api";

const EXAMPLES = [
  "Count the people and forklifts, and flag anyone without a helmet",
  "Detect all cars and trucks on the road",
  "How many dogs and bicycles are in the video?",
];

export function PromptInput({
  prompt,
  setPrompt,
  classes,
  setClasses,
}: {
  prompt: string;
  setPrompt: (v: string) => void;
  classes: string[];
  setClasses: (c: string[]) => void;
}) {
  const [parsing, setParsing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!prompt.trim()) return;
    setParsing(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const cls = await parsePrompt(prompt);
      if (cls.length) setClasses(cls);
      setParsing(false);
    }, 700);
    return () => { if (timer.current) clearTimeout(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt]);

  return (
    <div className="space-y-3">
      <div className="gradient-border p-1">
        <div className="flex items-start gap-2 p-2">
          <Wand2 className="mt-1.5 h-4 w-4 shrink-0 text-primary" />
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={2}
            placeholder="Describe what to find — e.g. “count the people and forklifts, flag anyone without a helmet”"
            className="min-h-[52px] w-full resize-none bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* example prompts */}
      {!prompt && (
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => setPrompt(ex)}
              className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {/* AI-decoded keywords */}
      <div className="flex min-h-[28px] flex-wrap items-center gap-1.5">
        {parsing ? (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> Understanding your request…
          </span>
        ) : classes.length ? (
          <>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> Detecting:
            </span>
            <AnimatePresence>
              {classes.map((c) => (
                <motion.span
                  key={c}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary/15 px-2 py-0.5 text-sm font-medium text-primary"
                >
                  {c}
                  <button onClick={() => setClasses(classes.filter((x) => x !== c))} aria-label={`Remove ${c}`} className="hover:text-white">
                    <X className="h-3 w-3" />
                  </button>
                </motion.span>
              ))}
            </AnimatePresence>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">Type a request above and I’ll figure out what to detect.</span>
        )}
      </div>
    </div>
  );
}
