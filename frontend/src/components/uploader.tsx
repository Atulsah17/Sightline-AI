"use client";
import { useRef, useState } from "react";
import { UploadCloud, Film, X } from "lucide-react";
import { motion } from "framer-motion";
import { cn, formatBytes } from "@/lib/utils";

export function Uploader({ file, onFile }: { file: File | null; onFile: (f: File | null) => void }) {
  const [drag, setDrag] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  if (file) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="gradient-border flex items-center gap-4 p-4"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Film className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{file.name}</p>
          <p className="text-xs text-muted-foreground">{formatBytes(file.size)} · ready to analyze</p>
        </div>
        <button
          onClick={() => onFile(null)}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Remove"
        >
          <X className="h-5 w-5" />
        </button>
      </motion.div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files?.[0] ?? null); }}
      onClick={() => ref.current?.click()}
      className={cn(
        "group relative flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-12 text-center transition-all",
        drag ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/50 hover:bg-muted/30"
      )}
    >
      <div className="relative">
        <span className="absolute inset-0 animate-pulse-ring rounded-full bg-primary/30" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl gradient-btn text-white shadow-glow">
          <UploadCloud className="h-8 w-8" />
        </div>
      </div>
      <div>
        <p className="text-lg font-semibold">Drop a video to analyze</p>
        <p className="mt-1 text-sm text-muted-foreground">MP4, MOV, WebM · or click to browse</p>
      </div>
      <input
        ref={ref}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,video/x-msvideo,.mp4,.mov,.webm,.avi"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
