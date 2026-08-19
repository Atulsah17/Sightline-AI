"use client";
import { Wand2, Film, Sparkles, Cpu, Gauge, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Outputs } from "@/lib/api";

const OUTPUT_LABELS: Record<keyof Outputs, string> = {
  video: "Annotated video",
  report: "Analytics report",
  dataset: "Training dataset",
};

export function SummaryPanel({
  file,
  previewUrl,
  classes,
  outputs,
  ready,
  onAnalyze,
}: {
  file: File | null;
  previewUrl: string | null;
  classes: string[];
  outputs: Outputs;
  ready: boolean;
  onAnalyze: () => void;
}) {
  const chosen = (Object.keys(outputs) as (keyof Outputs)[]).filter((k) => outputs[k]);

  return (
    <div className="lg:sticky lg:top-24 space-y-4">
      {/* preview */}
      <div className="gradient-border overflow-hidden">
        {previewUrl ? (
          <video src={previewUrl} muted loop autoPlay playsInline className="aspect-video w-full bg-black object-contain" />
        ) : (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 bg-muted/30 text-muted-foreground">
            <Film className="h-8 w-8 opacity-50" />
            <span className="text-xs">Your video preview appears here</span>
          </div>
        )}
      </div>

      {/* job summary */}
      <div className="gradient-border space-y-4 p-4">
        <p className="text-sm font-semibold">Job summary</p>

        <Row label="Video">
          <span className="truncate text-sm">{file ? file.name : "—"}</span>
        </Row>

        <Row label="Detecting">
          {classes.length ? (
            <div className="flex flex-wrap justify-end gap-1">
              {classes.map((c) => (
                <span key={c} className="rounded-md bg-primary/15 px-1.5 py-0.5 text-xs text-primary">{c}</span>
              ))}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </Row>

        <Row label="Outputs">
          {chosen.length ? (
            <div className="flex flex-col items-end gap-0.5">
              {chosen.map((k) => (
                <span key={k} className="text-xs text-foreground">{OUTPUT_LABELS[k]}</span>
              ))}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </Row>

        <div className="flex items-center gap-1.5 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <Zap className="h-3.5 w-3.5 text-accent" /> ~1 credit per 6s of video
        </div>

        <Button className="w-full" disabled={!ready} onClick={onAnalyze}>
          <Wand2 className="h-5 w-5" /> Analyze video
        </Button>
      </div>

      {/* trust / features */}
      <div className="space-y-2.5 px-1">
        <Feature icon={Sparkles} title="Open-vocabulary" desc="Any class, zero training" />
        <Feature icon={Cpu} title="Cloud GPU" desc="YOLO-World + ByteTrack" />
        <Feature icon={Gauge} title="Real analytics" desc="Counts, tracks & timelines" />
        <Feature icon={ShieldCheck} title="Your data" desc="Processed per-job, not stored long-term" />
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
      <span className="shrink-0 text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="min-w-0 text-right">{children}</div>
    </div>
  );
}

function Feature({ icon: Icon, title, desc }: { icon: typeof Cpu; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-medium leading-tight">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}
