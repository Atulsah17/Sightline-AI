"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, AlertCircle } from "lucide-react";
import { Header } from "@/components/header";
import { Uploader } from "@/components/uploader";
import { ClassInput } from "@/components/class-input";
import { OutputSelector } from "@/components/output-selector";
import { SummaryPanel } from "@/components/summary-panel";
import { Processing } from "@/components/processing";
import { Results } from "@/components/results";
import { processVideo, type JobResult, type Outputs } from "@/lib/api";

type View = "config" | "processing" | "results";

export default function Home() {
  const [view, setView] = useState<View>("config");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [classes, setClasses] = useState<string[]>(["person"]);
  const [outputs, setOutputs] = useState<Outputs>({ video: true, report: true, dataset: false });
  const [result, setResult] = useState<JobResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [credits, setCredits] = useState(100);

  useEffect(() => {
    if (!file) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const ready = !!file && classes.length > 0 && Object.values(outputs).some(Boolean);

  async function analyze() {
    if (!ready || !file) return;
    setError(null);
    setView("processing");
    try {
      const res = await processVideo(file, classes, outputs);
      setResult(res);
      setCredits((c) => Math.max(0, c - Math.ceil(res.stats.duration_s / 6)));
      setView("results");
    } catch (e) {
      setError((e as Error).message || "Something went wrong. Please try again.");
      setView("config");
    }
  }

  function reset() {
    setFile(null);
    setResult(null);
    setError(null);
    setView("config");
  }

  return (
    <div className="mesh-bg min-h-screen">
      <Header credits={credits} />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {view === "config" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            {/* hero */}
            <div className="mx-auto max-w-2xl text-center">
              <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-accent" /> Open-vocabulary · no training required
              </div>
              <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
                Analyze any video with <span className="gradient-text">plain English</span>
              </h1>
              <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
                Describe what to find, and Sightline detects, tracks, and counts it — then hands you an
                annotated video, an analytics report, and a training dataset.
              </p>
            </div>

            {error && (
              <div className="mx-auto mt-6 flex max-w-2xl items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            {/* two-column workspace */}
            <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
              {/* left: steps */}
              <div className="space-y-8">
                <section className="space-y-3">
                  <Step n={1} title="Upload a video" />
                  <Uploader file={file} onFile={setFile} />
                </section>
                <section className="space-y-3">
                  <Step n={2} title="What should we find?" />
                  <ClassInput classes={classes} onChange={setClasses} />
                </section>
                <section className="space-y-3">
                  <Step n={3} title="Choose your outputs" />
                  <OutputSelector value={outputs} onChange={setOutputs} />
                </section>
              </div>

              {/* right: sticky preview + summary */}
              <SummaryPanel
                file={file}
                previewUrl={previewUrl}
                classes={classes}
                outputs={outputs}
                ready={ready}
                onAnalyze={analyze}
              />
            </div>
          </motion.div>
        )}

        {view === "processing" && <Processing />}

        {view === "results" && result && (
          <div className="mx-auto max-w-4xl">
            <Results result={result} onReset={reset} />
          </div>
        )}
      </main>
    </div>
  );
}

function Step({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/15 text-xs font-bold text-primary">{n}</span>
      <h3 className="font-semibold">{title}</h3>
    </div>
  );
}
