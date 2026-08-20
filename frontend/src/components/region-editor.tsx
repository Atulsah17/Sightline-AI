"use client";
import { useState } from "react";
import { Minus, Hexagon, Trash2, Check, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Region } from "@/lib/api";

type Mode = null | "line" | "zone";

export function RegionEditor({
  src,
  filename,
  regions,
  onChange,
  onChangeVideo,
}: {
  src: string | null;
  filename: string;
  regions: Region[];
  onChange: (r: Region[]) => void;
  onChangeVideo: () => void;
}) {
  const [mode, setMode] = useState<Mode>(null);
  const [draft, setDraft] = useState<number[][]>([]);

  const lineN = regions.filter((r) => r.type === "line").length;
  const zoneN = regions.filter((r) => r.type === "zone").length;

  function toNorm(e: React.MouseEvent<SVGSVGElement>): number[] {
    const rect = e.currentTarget.getBoundingClientRect();
    return [
      Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    ];
  }

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    if (!mode) return;
    const p = toNorm(e);
    if (mode === "line") {
      const next = [...draft, p];
      if (next.length === 2) {
        onChange([...regions, { type: "line", a: next[0], b: next[1], name: `Line ${lineN + 1}` }]);
        setDraft([]);
        setMode(null);
      } else setDraft(next);
    } else {
      setDraft([...draft, p]);
    }
  }

  function finishZone() {
    if (draft.length >= 3) {
      onChange([...regions, { type: "zone", points: draft, name: `Zone ${zoneN + 1}` }]);
    }
    setDraft([]);
    setMode(null);
  }

  function cancel() { setDraft([]); setMode(null); }

  return (
    <div className="space-y-3">
      <div className="gradient-border relative overflow-hidden">
        {src && <video src={src} muted loop autoPlay playsInline className="aspect-video w-full bg-black object-contain" />}
        <svg
          viewBox="0 0 1 1"
          preserveAspectRatio="none"
          onClick={handleClick}
          className={cn("absolute inset-0 h-full w-full", mode ? "cursor-crosshair" : "pointer-events-none")}
        >
          {regions.map((r, i) =>
            r.type === "line" ? (
              <g key={i}>
                <line x1={r.a[0]} y1={r.a[1]} x2={r.b[0]} y2={r.b[1]} stroke="#50c8ff" strokeWidth={3} vectorEffect="non-scaling-stroke" />
              </g>
            ) : (
              <polygon key={i} points={r.points.map((p) => p.join(",")).join(" ")}
                fill="rgba(168,120,255,0.18)" stroke="#a878ff" strokeWidth={2} vectorEffect="non-scaling-stroke" />
            )
          )}
          {/* draft */}
          {mode === "line" && draft.length === 1 && (
            <circle cx={draft[0][0]} cy={draft[0][1]} r={0.008} fill="#50c8ff" />
          )}
          {mode === "zone" && draft.length > 0 && (
            <polyline points={draft.map((p) => p.join(",")).join(" ")} fill="rgba(168,120,255,0.15)" stroke="#a878ff" strokeWidth={2} vectorEffect="non-scaling-stroke" />
          )}
          {mode === "zone" && draft.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={0.006} fill="#a878ff" />)}
        </svg>
      </div>

      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => { setMode("line"); setDraft([]); }}
          className={cn("inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
            mode === "line" ? "border-accent bg-accent/10 text-accent" : "border-border hover:border-primary/40")}
        >
          <Minus className="h-3.5 w-3.5" /> Counting line
        </button>
        <button
          onClick={() => { setMode("zone"); setDraft([]); }}
          className={cn("inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
            mode === "zone" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40")}
        >
          <Hexagon className="h-3.5 w-3.5" /> Zone
        </button>

        {mode === "zone" && (
          <button onClick={finishZone} disabled={draft.length < 3}
            className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-400 disabled:opacity-40">
            <Check className="h-3.5 w-3.5" /> Finish zone
          </button>
        )}
        {mode && (
          <button onClick={cancel} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" /> Cancel
          </button>
        )}
        {regions.length > 0 && !mode && (
          <button onClick={() => onChange([])} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" /> Clear regions
          </button>
        )}

        <div className="ml-auto">
          <button onClick={onChangeVideo} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <RefreshCw className="h-3.5 w-3.5" /> Change video
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {mode === "line"
          ? "Click two points to draw a line — objects crossing it are counted (in/out)."
          : mode === "zone"
          ? "Click points around an area, then Finish — objects inside are counted with dwell time."
          : regions.length
          ? `${regions.length} region${regions.length > 1 ? "s" : ""} · ${filename}`
          : "Optional: draw a counting line or zone to count objects. Otherwise we count everything."}
      </p>
    </div>
  );
}
