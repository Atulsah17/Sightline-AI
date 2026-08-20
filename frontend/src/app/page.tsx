"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, AlertCircle, Wand2, Radar, Route, FileBarChart } from "lucide-react";
import { Header } from "@/components/header";
import { Uploader } from "@/components/uploader";
import { PromptInput } from "@/components/prompt-input";
import { OutputToggles } from "@/components/output-toggles";
import { RegionEditor } from "@/components/region-editor";
import { RulesBuilder } from "@/components/rules-builder";
import { Processing } from "@/components/processing";
import { Results } from "@/components/results";
import { Button } from "@/components/ui/button";
import { processVideo, type JobResult, type Outputs, type Region, type Rule } from "@/lib/api";

type View = "config" | "processing" | "results";

export default function Home() {
  const [view, setView] = useState<View>("config");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [classes, setClasses] = useState<string[]>(["person"]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [webhook, setWebhook] = useState("");
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
      const res = await processVideo(file, classes, outputs, regions, rules, webhook);
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
    setRegions([]);
    setRules([]);
    setView("config");
  }

  return (
    <div className="mesh-bg min-h-screen">
      <Header credits={credits} />

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        {view === "config" && (
          <AnimatePresence mode="wait">
            {/* ── Empty state: one focused action ── */}
            {!file ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mx-auto max-w-2xl"
              >
                <div className="mb-8 text-center">
                  <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-accent" /> Open-vocabulary · no training required
                  </div>
                  <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
                    Analyze any video with <span className="gradient-text">plain English</span>
                  </h1>
                  <p className="mx-auto mt-3 max-w-md text-muted-foreground">
                    Upload a video, describe what to find, and get an annotated video, a report, and a dataset.
                  </p>
                </div>

                {error && <ErrorBar msg={error} />}

                <Uploader file={file} onFile={setFile} />

                <div className="mt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground">
                  <HowStep icon={Radar} label="Detect" />
                  <span className="text-border">→</span>
                  <HowStep icon={Route} label="Track" />
                  <span className="text-border">→</span>
                  <HowStep icon={FileBarChart} label="Report" />
                </div>
              </motion.div>
            ) : (
              /* ── Configured: video is the hero + one compact config card ── */
              <motion.div
                key="configure"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="grid gap-6 lg:grid-cols-[1.5fr_1fr]"
              >
                {/* video hero + region editor */}
                <RegionEditor
                  src={previewUrl}
                  filename={file.name}
                  regions={regions}
                  onChange={setRegions}
                  onChangeVideo={() => { setFile(null); setRegions([]); }}
                />

                {/* config card */}
                <div className="gradient-border space-y-5 p-5">
                  <div>
                    <h2 className="text-lg font-bold">Set up your analysis</h2>
                    <p className="text-xs text-muted-foreground">Describe what to find and pick your outputs.</p>
                  </div>

                  {error && <ErrorBar msg={error} />}

                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">What to find</label>
                    <PromptInput prompt={prompt} setPrompt={setPrompt} classes={classes} setClasses={setClasses} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Outputs</label>
                    <OutputToggles value={outputs} onChange={setOutputs} />
                  </div>

                  <RulesBuilder regions={regions} rules={rules} onChange={setRules} webhook={webhook} setWebhook={setWebhook} />

                  <Button className="w-full" size="lg" disabled={!ready} onClick={analyze}>
                    <Wand2 className="h-5 w-5" /> Analyze video
                  </Button>
                  <p className="text-center text-[11px] text-muted-foreground">
                    Runs on a cloud GPU · ~1 credit per 6s of video
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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

function ErrorBar({ msg }: { msg: string }) {
  return (
    <div className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      <AlertCircle className="h-4 w-4 shrink-0" /> {msg}
    </div>
  );
}

function HowStep({ icon: Icon, label }: { icon: typeof Radar; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="h-4 w-4 text-primary" /> {label}
    </span>
  );
}
