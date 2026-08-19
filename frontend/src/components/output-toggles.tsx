"use client";
import { Film, FileBarChart, Database, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Outputs } from "@/lib/api";

const ITEMS: { key: keyof Outputs; icon: typeof Film; label: string }[] = [
  { key: "video", icon: Film, label: "Annotated video" },
  { key: "report", icon: FileBarChart, label: "Report (CSV)" },
  { key: "dataset", icon: Database, label: "Training dataset" },
];

export function OutputToggles({ value, onChange }: { value: Outputs; onChange: (o: Outputs) => void }) {
  return (
    <div className="space-y-2">
      {ITEMS.map(({ key, icon: Icon, label }) => {
        const on = value[key];
        return (
          <button
            key={key}
            onClick={() => onChange({ ...value, [key]: !on })}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-all",
              on ? "border-primary/50 bg-primary/10" : "border-border hover:border-primary/30"
            )}
          >
            <Icon className={cn("h-4 w-4", on ? "text-primary" : "text-muted-foreground")} />
            <span className="flex-1 font-medium">{label}</span>
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-md border transition-colors",
                on ? "border-primary bg-primary text-white" : "border-border"
              )}
            >
              {on && <Check className="h-3.5 w-3.5" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
