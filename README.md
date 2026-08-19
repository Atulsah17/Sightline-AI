<div align="center">

# 👁️ Sightline AI — Video intelligence in plain English

**Describe what to find → get an annotated video, an analytics report, and a training dataset.**
Open-vocabulary detection + tracking. No training, no code.

Next.js · Tailwind · shadcn-style UI (Vercel) &nbsp;|&nbsp; FastAPI · YOLO-World · ByteTrack on **Modal GPU**

</div>

---

## ✨ What it does
1. Upload a video
2. Type target classes in plain English ("person, forklift, helmet, red car") — **open-vocabulary, zero training**
3. Pick outputs — **annotated video · analytics report (CSV) · YOLO training dataset**
4. Sightline detects (**YOLO-World**), tracks (**ByteTrack**), counts, and renders your results on a **cloud GPU**

## 🧠 Why it's novel
Open-vocabulary (any class, no training) **×** finished outputs (annotated media + report) **×** self-serve, credit-based — a combo the market doesn't offer to prosumers.

## 🏗️ Architecture
```
Next.js + Tailwind (Vercel)
        │  POST /api/process (video + classes + outputs)
        ▼
Modal GPU app  ──►  YOLO-World (open-vocab) → ByteTrack → annotate → report → dataset
        │
        └─►  Modal Volume (stores outputs, served as downloads)
```

## 🚀 Run locally
**Backend (Modal GPU):**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install modal ultralytics 'numpy<2'
modal deploy modal_app.py          # deploys the GPU pipeline
```
**Frontend:**
```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_BASE=<your-modal-url>" > .env.local
npm run dev
```

## 🧰 Stack
**Backend:** Python, FastAPI (on Modal), Ultralytics YOLO-World, ByteTrack, OpenCV, ffmpeg, serverless T4 GPU.
**Frontend:** Next.js 14, TypeScript, Tailwind, framer-motion, lucide-react.

---
<div align="center"><sub>Built by <a href="https://github.com/Atulsah17">Atul Sah</a></sub></div>
