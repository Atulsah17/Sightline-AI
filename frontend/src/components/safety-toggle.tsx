"use client";
import { HardHat } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Safety } from "@/lib/api";

const ITEMS = [
  { value: "helmet", label: "helmet" },
  { value: "safety vest", label: "vest" },
  { value: "mask", label: "mask" },
];

export function SafetyToggle({ value, onChange }: { value: Safety | null; onChange: (s: Safety | null) => void }) {
  const on = !!value;
  const item = value?.require?.[0] ?? "helmet";

  return (
    <div className={cn("rounded-xl border p-3 transition-colors", on ? "border-amber-500/50 bg-amber-500/5" : "border-border")}>
      <div className="flex items-center gap-3">
        <HardHat className={cn("h-4 w-4", on ? "text-amber-400" : "text-muted-foreground")} />
        <div className="flex-1">
          <p className="text-sm font-semibold">Safety check (PPE)</p>
          <p className="text-xs text-muted-foreground">Flag any person missing required gear</p>
        </div>
        <button
          onClick={() => onChange(on ? null : { require: [item] })}
          className={cn("relative h-6 w-11 rounded-full transition-colors", on ? "bg-amber-500" : "bg-muted")}
          aria-label="Toggle safety check"
        >
          <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all", on ? "left-[22px]" : "left-0.5")} />
        </button>
      </div>

      {on && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Require every person to wear a</span>
          <select
            value={item}
            onChange={(e) => onChange({ require: [e.target.value] })}
            className="rounded-lg border border-border bg-background px-2 py-1 outline-none"
          >
            {ITEMS.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}
