"use client";
import { Film, FileBarChart, Database, Check } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Outputs } from "@/lib/api";

const ITEMS: { key: keyof Outputs; icon: typeof Film; title: string; desc: string }[] = [
  { key: "video", icon: Film, title: "Annotated video", desc: "Boxes, labels & track IDs burned in" },
  { key: "report", icon: FileBarChart, title: "Analytics report", desc: "Counts, timeline & CSV of detections" },
  { key: "dataset", icon: Database, title: "Training dataset", desc: "YOLO-format images + labels (.zip)" },
];

export function OutputSelector({ value, onChange }: { value: Outputs; onChange: (o: Outputs) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {ITEMS.map(({ key, icon: Icon, title, desc }) => {
        const on = value[key];
        return (
          <motion.button
            key={key}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange({ ...value, [key]: !on })}
            className={cn(
              "relative overflow-hidden rounded-2xl border p-4 text-left transition-all",
              on ? "border-primary/60 bg-primary/10 shadow-glow" : "border-border bg-card hover:border-primary/30"
            )}
          >
            <div className="flex items-start justify-between">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", on ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                <Icon className="h-5 w-5" />
              </div>
              <div className={cn("flex h-5 w-5 items-center justify-center rounded-md border transition-colors", on ? "border-primary bg-primary text-white" : "border-border")}>
                {on && <Check className="h-3.5 w-3.5" />}
              </div>
            </div>
            <p className="mt-3 font-semibold">{title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
          </motion.button>
        );
      })}
    </div>
  );
}
