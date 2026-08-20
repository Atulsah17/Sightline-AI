export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "https://atulsah17--sightline-web.modal.run";

export interface JobStats {
  frames_processed: number;
  fps: number;
  duration_s: number;
  classes: string[];
  unique_objects: Record<string, number>;
  total_detections: number;
  detections_per_class: Record<string, number>;
}

export interface JobResult {
  job_id: string;
  stats: JobStats;
  files: string[];
}

export interface Outputs {
  video: boolean;
  report: boolean;
  dataset: boolean;
}

/** POST a video to the Modal GPU pipeline. Resolves when processing is complete. */
export async function processVideo(
  file: File,
  classes: string[],
  outputs: Outputs,
  signal?: AbortSignal
): Promise<JobResult> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("classes", classes.join(","));
  fd.append("video", String(outputs.video));
  fd.append("report", String(outputs.report));
  fd.append("dataset", String(outputs.dataset));

  const res = await fetch(`${API_BASE}/api/process`, { method: "POST", body: fd, signal });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail ?? `Processing failed (${res.status})`);
  }
  return res.json();
}

export function fileUrl(jobId: string, name: string): string {
  return `${API_BASE}/api/files/${jobId}/${name}`;
}

/** Decode a natural-language prompt into detectable object keywords. */
export async function parsePrompt(prompt: string): Promise<string[]> {
  const r = await fetch(`${API_BASE}/api/parse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!r.ok) return [];
  return (await r.json()).classes ?? [];
}
