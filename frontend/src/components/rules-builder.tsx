"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Plus, X, ChevronDown, Webhook } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Region, Rule } from "@/lib/api";

export function RulesBuilder({
  regions,
  rules,
  onChange,
  webhook,
  setWebhook,
}: {
  regions: Region[];
  rules: Rule[];
  onChange: (r: Rule[]) => void;
  webhook: string;
  setWebhook: (s: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [metric, setMetric] = useState("screen");
  const [threshold, setThreshold] = useState(3);

  const zones = regions.filter((r) => r.type === "zone").map((r) => (r as { name?: string }).name || "Zone");
  const lines = regions.filter((r) => r.type === "line").map((r) => (r as { name?: string }).name || "Line");

  function add() {
    let m: Rule["metric"] = "screen";
    let region: string | undefined;
    let label = "objects on screen";
    if (metric.startsWith("zone:")) { m = "zone"; region = metric.slice(5); label = `objects in ${region}`; }
    else if (metric.startsWith("line:")) { m = "line"; region = metric.slice(5); label = `crossings on ${region}`; }
    onChange([...rules, { name: `≥ ${threshold} ${label}`, metric: m, region, threshold }]);
  }

  return (
    <div className="rounded-xl border border-border">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold"
      >
        <Bell className="h-4 w-4 text-accent" />
        Alerts
        {rules.length > 0 && <span className="rounded-full bg-primary/15 px-1.5 text-xs text-primary">{rules.length}</span>}
        <span className="ml-auto text-xs font-normal text-muted-foreground">optional</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="space-y-3 border-t border-border p-3">
              {/* existing rules */}
              {rules.length > 0 && (
                <div className="space-y-1.5">
                  {rules.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg bg-muted/40 px-2.5 py-1.5 text-xs">
                      <Bell className="h-3.5 w-3.5 text-accent" />
                      <span className="flex-1">Alert when <b className="font-semibold">{r.name}</b></span>
                      <button onClick={() => onChange(rules.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* add rule */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-muted-foreground">Alert when</span>
                <select
                  value={metric}
                  onChange={(e) => setMetric(e.target.value)}
                  className="rounded-lg border border-border bg-background px-2 py-1.5 outline-none"
                >
                  <option value="screen">objects on screen</option>
                  {zones.map((z) => <option key={z} value={`zone:${z}`}>objects in {z}</option>)}
                  {lines.map((l) => <option key={l} value={`line:${l}`}>crossings on {l}</option>)}
                </select>
                <span className="text-muted-foreground">reach</span>
                <input
                  type="number"
                  min={1}
                  value={threshold}
                  onChange={(e) => setThreshold(Math.max(1, Number(e.target.value)))}
                  className="w-16 rounded-lg border border-border bg-background px-2 py-1.5 outline-none"
                />
                <button onClick={add} className="inline-flex items-center gap-1 rounded-lg border border-primary/40 bg-primary/10 px-2.5 py-1.5 font-medium text-primary">
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </div>

              {(zones.length === 0 && lines.length === 0) && (
                <p className="text-[11px] text-muted-foreground">Tip: draw a zone or line on the video to alert on regions.</p>
              )}

              {/* webhook */}
              <div className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5">
                <Webhook className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <input
                  value={webhook}
                  onChange={(e) => setWebhook(e.target.value)}
                  placeholder="Webhook URL (optional) — POST alerts here"
                  className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
