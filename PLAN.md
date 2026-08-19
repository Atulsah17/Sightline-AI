# Sightline AI — Build Plan (working name)

**One-liner:** Video & image intelligence in plain English — describe what you want,
get an annotated video + annotated images + analytics report + training dataset.
No training, no code. Credit/subscription-based.

## Locked spec
- **Concept:** open-vocabulary (YOLO-World) detection + ByteTrack tracking → user-selected outputs.
- **Outputs (user picks per job):** ☐ Annotated video ☐ Annotated images ☐ Report (PDF+CSV) ☐ Dataset export (YOLO/COCO/VOC)
- **Novelty / moat:** open-vocab (no training) × finished outputs (annotated media + report) × self-serve credits.
- **Monetization:** credit-based (per video-minute / per N images); tiers later. Metering scaffolded from day 1, billing stubbed.

## Compute (chosen)
- **Frontend:** Next.js + shadcn/ui → **Vercel** (free)
- **GPU pipeline:** **Modal** — serverless GPU, scale-to-zero, ~$30/mo free credits
- **Storage/outputs:** Modal Volume (served as downloads)

## Models
- **Detect:** YOLO-World (open-vocabulary) — PROVEN working ✅
- **Track:** ByteTrack / BoT-SORT (ultralytics built-in)
- **Annotate:** OpenCV / ffmpeg overlays → output video/images
- **Report:** counts, per-class, events+timestamps, line-crossing, heatmap → PDF + CSV

## Phases
1. ✅ De-risk core — YOLO-World open-vocab detection (DONE)
2. ⏳ Pipeline — detect → track → annotate → report → dataset export (Modal GPU app)
3. ⏳ Frontend — upload → describe classes → pick outputs → job progress → downloads
4. ⏳ Metering — per-job/per-minute usage counter (billing stubbed)
5. ⏳ Deploy — Modal (GPU) + Vercel (app)

## User action needed
- Create a free **Modal** account → https://modal.com (we auth at deploy time)
