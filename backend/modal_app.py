"""Sightline — Modal GPU app.

Deploy:  modal deploy modal_app.py
Endpoints (served by the `web` ASGI app):
  GET  /api/health
  POST /api/process            (multipart: file, classes, video, report, dataset)
  GET  /api/files/{job}/{name} (download an output artifact)
"""
import os
import shutil
import tempfile
import uuid

import modal

app = modal.App("sightline")

MODEL_PATH = "/root/yolov8s-world.pt"
DATA_DIR = "/data"


def _bake_models():
    """Download YOLO-World + CLIP weights at build time → instant cold starts."""
    import os
    import ssl

    ssl._create_default_https_context = ssl._create_unverified_context
    os.chdir("/root")
    from ultralytics import YOLOWorld

    m = YOLOWorld("yolov8s-world.pt")
    m.set_classes(["person", "car"])  # triggers the one-time CLIP text-encoder download


gpu_image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install("ffmpeg", "libgl1", "libglib2.0-0", "git")
    .pip_install(
        "ultralytics==8.4.123",
        "lap>=0.5.12",
        "numpy<2",
        "ftfy",
        "git+https://github.com/ultralytics/CLIP.git",  # YOLO-World text encoder
    )
    .run_function(_bake_models)
    .add_local_python_source("pipeline")   # local files must be added last
)

web_image = modal.Image.debian_slim(python_version="3.10").pip_install(
    "fastapi[standard]", "python-multipart", "requests"
)


def extract_classes(prompt: str) -> list[str]:
    """Use Gemini to turn a natural-language request into detectable object labels."""
    import json
    import os
    import re

    import requests

    fallback = [w for w in re.findall(r"[a-zA-Z][a-zA-Z-]+", prompt.lower()) if len(w) > 2][:6]
    key = os.environ.get("GEMINI_API_KEY", "")
    if not key:
        return fallback
    body = {
        "model": "gemini-3.1-flash-lite",
        "temperature": 0,
        "messages": [{"role": "user", "content": (
            "From the request below, extract the physical, visually-detectable object types to look "
            "for in a video. Return ONLY a JSON array of short lowercase labels (1-2 words each), at "
            f"most 6, suitable for an object detector.\n\nRequest: {prompt}"
        )}],
    }
    try:
        r = requests.post(
            "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
            headers={"Authorization": f"Bearer {key}"}, json=body, timeout=30,
        )
        r.raise_for_status()
        content = r.json()["choices"][0]["message"]["content"]
        m = re.search(r"\[.*\]", content, re.DOTALL)
        arr = json.loads(m.group(0)) if m else []
        cleaned = [str(x).strip().lower() for x in arr if str(x).strip()][:6]
        return cleaned or fallback
    except Exception:
        return fallback

vol = modal.Volume.from_name("sightline-outputs", create_if_missing=True)


@app.function(image=gpu_image, gpu="T4", timeout=900, volumes={DATA_DIR: vol})
def run_pipeline(job_id: str, video_bytes: bytes, classes: list, outputs: dict) -> dict:
    import pipeline

    tmp = tempfile.mkdtemp()
    vpath = os.path.join(tmp, "input.mp4")
    with open(vpath, "wb") as f:
        f.write(video_bytes)

    out_dir = os.path.join(DATA_DIR, job_id)
    stats = pipeline.process(vpath, classes, out_dir, outputs, model_weights=MODEL_PATH)

    # zip the dataset folder for a single-file download
    ds = os.path.join(out_dir, "dataset")
    if outputs.get("dataset") and os.path.isdir(ds):
        shutil.make_archive(os.path.join(out_dir, "dataset"), "zip", ds)
        shutil.rmtree(ds)

    files = sorted(f for f in os.listdir(out_dir) if os.path.isfile(os.path.join(out_dir, f)))
    vol.commit()
    return {"job_id": job_id, "stats": stats, "files": files}


@app.function(image=web_image, volumes={DATA_DIR: vol}, secrets=[modal.Secret.from_name("sightline-gemini")])
@modal.asgi_app()
def web():
    from fastapi import Body, FastAPI, File, Form, HTTPException, UploadFile
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import FileResponse

    api = FastAPI(title="Sightline API")
    api.add_middleware(
        CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
    )

    @api.get("/api/health")
    def health():
        return {"status": "ok", "service": "sightline"}

    @api.post("/api/parse")
    def parse(prompt: str = Body(..., embed=True)):
        """Turn a natural-language request into detectable object keywords."""
        if not prompt.strip():
            raise HTTPException(400, "Empty prompt.")
        return {"classes": extract_classes(prompt)}

    @api.post("/api/process")
    async def process(
        file: UploadFile = File(...),
        classes: str = Form(""),
        prompt: str = Form(""),
        video: bool = Form(True),
        report: bool = Form(True),
        dataset: bool = Form(False),
    ):
        cls = [c.strip() for c in classes.split(",") if c.strip()]
        if not cls and prompt.strip():
            cls = extract_classes(prompt)
        if not cls:
            raise HTTPException(400, "Provide classes or a prompt.")
        video_bytes = await file.read()
        if not video_bytes:
            raise HTTPException(400, "Empty file.")
        job_id = uuid.uuid4().hex[:12]
        outputs = {"video": video, "report": report, "dataset": dataset}
        result = run_pipeline.remote(job_id, video_bytes, cls, outputs)  # runs on GPU
        return result

    @api.get("/api/files/{job_id}/{name}")
    def download(job_id: str, name: str):
        vol.reload()
        path = os.path.join(DATA_DIR, job_id, name)
        if not os.path.isfile(path):
            raise HTTPException(404, "File not found.")
        return FileResponse(path, filename=name)

    return api
