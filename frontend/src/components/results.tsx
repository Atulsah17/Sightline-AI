"use client";
import { motion } from "framer-motion";
import { Download, Film, FileBarChart, Database, RotateCcw, Users, Target, Clock, Boxes, Minus, Hexagon, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fileUrl, type JobResult } from "@/lib/api";

export function Results({ result, onReset }: { result: JobResult; onReset: () => void }) {
  const { job_id, stats, files } = result;
  const uniqueTotal = Object.values(stats.unique_objects).reduce((a, b) => a + b, 0);

  const statCards = [
    { icon: Users, label: "Unique objects", value: uniqueTotal, accent: true },
    { icon: Target, label: "Total detections", value: stats.total_detections },
    { icon: Clock, label: "Duration", value: `${stats.duration_s}s` },
    { icon: Boxes, label: "Frames", value: stats.frames_processed },
  ];

  const hasVideo = files.includes("annotated.mp4");

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Results are ready</h2>
          <p className="text-sm text-muted-foreground">
            Detected {stats.classes.join(", ")} across your video
          </p>
        </div>
        <Button variant="outline" onClick={onReset}>
          <RotateCcw className="h-4 w-4" /> New analysis
        </Button>
      </div>

      {/* video player */}
      {hasVideo && (
        <div className="gradient-border overflow-hidden">
          <video
            src={fileUrl(job_id, "annotated.mp4")}
            controls
            autoPlay
            loop
            muted
            playsInline
            className="aspect-video w-full bg-black"
          />
        </div>
      )}

      {/* stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map(({ icon: Icon, label, value, accent }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`gradient-border p-4 ${accent ? "shadow-glow" : ""}`}
          >
            <Icon className={`h-5 w-5 ${accent ? "text-primary" : "text-accent"}`} />
            <p className="mt-3 text-2xl font-bold tabular-nums">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* region counts (lines + zones) */}
      {((stats.lines && stats.lines.length > 0) || (stats.zones && stats.zones.length > 0)) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {stats.lines?.map((l) => (
            <div key={l.name} className="gradient-border p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Minus className="h-4 w-4 text-accent" /> {l.name}
              </div>
              <div className="flex items-center gap-4">
                <div><p className="text-2xl font-bold tabular-nums text-accent">{l.in}</p><p className="text-xs text-muted-foreground">in</p></div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div><p className="text-2xl font-bold tabular-nums">{l.out}</p><p className="text-xs text-muted-foreground">out</p></div>
                <div className="ml-auto text-right"><p className="text-2xl font-bold tabular-nums">{l.total}</p><p className="text-xs text-muted-foreground">crossings</p></div>
              </div>
            </div>
          ))}
          {stats.zones?.map((z) => (
            <div key={z.name} className="gradient-border p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Hexagon className="h-4 w-4 text-primary" /> {z.name}
              </div>
              <div className="flex items-center gap-6">
                <div><p className="text-2xl font-bold tabular-nums text-primary">{z.count}</p><p className="text-xs text-muted-foreground">objects entered</p></div>
                <div><p className="text-2xl font-bold tabular-nums">{z.avg_dwell_s}s</p><p className="text-xs text-muted-foreground">avg dwell</p></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* per-class breakdown */}
      {Object.keys(stats.unique_objects).length > 0 && (
        <div className="gradient-border p-4">
          <p className="mb-3 text-sm font-semibold">Unique objects per class</p>
          <div className="space-y-2">
            {Object.entries(stats.unique_objects).map(([cls, n]) => {
              const pct = uniqueTotal ? (n / uniqueTotal) * 100 : 0;
              return (
                <div key={cls} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 truncate text-sm capitalize">{cls}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6 }}
                      className="h-full rounded-full gradient-btn"
                    />
                  </div>
                  <span className="w-8 text-right text-sm font-semibold tabular-nums">{n}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* downloads */}
      <div className="grid gap-3 sm:grid-cols-3">
        {hasVideo && <DownloadCard icon={Film} label="Annotated video" url={fileUrl(job_id, "annotated.mp4")} />}
        {files.includes("detections.csv") && <DownloadCard icon={FileBarChart} label="Report (CSV)" url={fileUrl(job_id, "detections.csv")} />}
        {files.includes("dataset.zip") && <DownloadCard icon={Database} label="Dataset (.zip)" url={fileUrl(job_id, "dataset.zip")} />}
      </div>
    </motion.div>
  );
}

function DownloadCard({ icon: Icon, label, url }: { icon: typeof Film; label: string; url: string }) {
  return (
    <a
      href={url}
      download
      className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-glow"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">Click to download</p>
      </div>
      <Download className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
    </a>
  );
}
