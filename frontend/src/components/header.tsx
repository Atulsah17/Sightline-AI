"use client";
import { Eye, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Header({ credits }: { credits: number }) {
  return (
    <header className="sticky top-0 z-30 glass">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl gradient-btn text-white shadow-glow">
            <Eye className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight">Sightline</span>
              <Badge variant="accent" className="hidden sm:flex">AI</Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">Video intelligence in plain English</p>
          </div>
        </div>
        <Badge variant="muted" className="gap-1.5 py-1">
          <Zap className="h-3.5 w-3.5 text-accent" />
          <span className="font-semibold text-foreground">{credits}</span> credits
        </Badge>
      </div>
    </header>
  );
}
