"use client";
import { useEffect, useRef, useState } from "react";
import { Minus, Hexagon, Trash2, Check, X, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchThumbnail, type Region } from "@/lib/api";

type Mode = null | "line" | "zone";
type Preview = "loading" | "ready" | "unsupported";

export function RegionEditor({
  src,
  file,
  filename,
  regions,
  onChange,
  onChangeVideo,
}: {
  src: string | null;
  file: File | null;
  filename: string;
  regions: Region[];
  onChange: (r: Region[]) => void;
  onChangeVideo: () => void;
}) {
  const [mode, setMode] = useState<Mode>(null);
  const [draft, setDraft] = useState<number[][]>([]);
  const [preview, setPreview] = useState<Preview>("loading");
  const [poster, setPoster] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Grab a still frame for a stable ROI backdrop. Try the browser first; if it
  // can't decode the codec (e.g. H.265/HEVC from CCTV), fetch a real frame from
  // the server (ffmpeg) so users always draw on the actual footage.
  useEffect(() => {
    setPreview("loading");
    setPoster(null);
    if (!src) return;
    let done = false;
    let objUrl: string | null = null;

    const v = document.createElement("video");
    v.src = src;
    v.muted = true;
    v.playsInline = true;

    const serverFallback = async () => {
      if (done) return;
      if (!file) { done = true; setPreview("unsupported"); return; }
      const url = await fetchThumbnail(file);
      if (done) return;
      done = true;
      if (url) { objUrl = url; setPoster(url); setPreview("ready"); }
      else setPreview("unsupported");
    };

    const grab = () => {
      if (done) return;
      if (!v.videoWidth || !v.videoHeight) { serverFallback(); return; }
      done = true;
      try {
        const c = document.createElement("canvas");
        c.width = v.videoWidth;
        c.height = v.videoHeight;
        c.getContext("2d")!.drawImage(v, 0, 0, c.width, c.height);
        setPoster(c.toDataURL("image/jpeg", 0.72));
        setPreview("ready");
      } catch {
        setPreview("ready"); // frame decoded but canvas tainted — live video still shows
      }
    };

    const onLoaded = () => {
      try { v.currentTime = Math.min(0.5, (v.duration || 1) / 3); } catch { grab(); }
    };

    v.addEventListener("loadeddata", onLoaded);
    v.addEventListener("seeked", grab);
    v.addEventListener("error", serverFallback);
    // safety net: browser stalled on decode → go to server
    const t = window.setTimeout(serverFallback, 4000);

    return () => {
      done = true;
      window.clearTimeout(t);
      v.removeEventListener("loadeddata", onLoaded);
      v.removeEventListener("seeked", grab);
      v.removeEventListener("error", serverFallback);
      v.src = "";
      if (objUrl) URL.revokeObjectURL(objUrl);
    };
  }, [src, file]);

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
      <div className="gradient-border relative aspect-video w-full overflow-hidden bg-black">
        {/* poster frame when we could decode one */}
        {poster && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt="video frame" className="absolute inset-0 h-full w-full object-contain" />
        )}
        {/* live video only while we have no poster yet and the codec is fine */}
        {src && !poster && preview !== "unsupported" && (
          <video ref={videoRef} src={src} muted loop autoPlay playsInline className="absolute inset-0 h-full w-full object-contain" />
        )}

        {/* loading (incl. server-side frame extraction for HEVC) */}
        {preview === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading preview…
          </div>
        )}

        {/* both browser and server couldn't render a frame — draw on a grid */}
        {preview === "unsupported" && (
          <>
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />
            <div className="pointer-events-none absolute inset-x-0 top-3 mx-auto flex w-max items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-[11px] text-amber-300">
              Preview unavailable — you can still draw regions
            </div>
          </>
        )}

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
