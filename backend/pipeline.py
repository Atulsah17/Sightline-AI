"""Sightline core pipeline: open-vocabulary detect -> track -> annotate -> report -> dataset.

Runs the same locally (CPU) and on Modal (GPU). Outputs are selectable per job.
"""
from __future__ import annotations

import csv
import json
import os
import shutil
import ssl
import subprocess
from collections import Counter

import cv2

# Sandbox self-signed cert workaround for the one-time CLIP text-encoder download.
ssl._create_default_https_context = ssl._create_unverified_context


def _encode_h264(src: str, dst: str) -> None:
    """Re-encode to web-safe H.264 mp4 (plays in every browser). ffmpeg required."""
    if shutil.which("ffmpeg"):
        subprocess.run(
            ["ffmpeg", "-y", "-i", src, "-c:v", "libx264", "-pix_fmt", "yuv420p",
             "-movflags", "+faststart", dst],
            check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
        os.remove(src)
    else:  # no ffmpeg → keep whatever we wrote
        shutil.move(src, dst)


def process(
    video_path: str,
    classes: list[str],
    out_dir: str,
    outputs: dict,
    conf: float = 0.25,
    max_frames: int | None = None,
    model_weights: str = "yolov8s-world.pt",
) -> dict:
    """Process a video with open-vocab detection + tracking.

    outputs: {"video": bool, "report": bool, "dataset": bool}
    Returns a stats dict and writes selected artifacts to out_dir.
    """
    from ultralytics import YOLOWorld

    os.makedirs(out_dir, exist_ok=True)
    model = YOLOWorld(model_weights)
    model.set_classes(classes)

    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    cap.release()

    writer = None
    tmp_video = os.path.join(out_dir, "_tmp.avi")
    if outputs.get("video"):
        # MJPG opens on every OpenCV build; we re-encode to H.264 afterwards.
        writer = cv2.VideoWriter(tmp_video, cv2.VideoWriter_fourcc(*"MJPG"), fps, (w, h))

    dataset_dir = os.path.join(out_dir, "dataset")
    if outputs.get("dataset"):
        os.makedirs(os.path.join(dataset_dir, "images"), exist_ok=True)
        os.makedirs(os.path.join(dataset_dir, "labels"), exist_ok=True)

    detections: list[dict] = []
    track_class: dict[int, str] = {}
    frame_idx = 0

    for r in model.track(
        source=video_path, tracker="bytetrack.yaml", stream=True,
        conf=conf, persist=True, verbose=False,
    ):
        if max_frames is not None and frame_idx >= max_frames:
            break
        names = r.names
        boxes = r.boxes

        yolo_lines: list[str] = []
        if boxes is not None and len(boxes):
            for b in boxes:
                cls_id = int(b.cls)
                cls = names[cls_id]
                tid = int(b.id) if b.id is not None else -1
                x1, y1, x2, y2 = (float(v) for v in b.xyxy[0])
                detections.append({
                    "frame": frame_idx, "time": round(frame_idx / fps, 2),
                    "track_id": tid, "class": cls, "conf": round(float(b.conf), 3),
                    "box": [round(x1, 1), round(y1, 1), round(x2, 1), round(y2, 1)],
                })
                if tid >= 0:
                    track_class[tid] = cls
                if outputs.get("dataset"):
                    cx, cy = ((x1 + x2) / 2) / w, ((y1 + y2) / 2) / h
                    bw, bh = (x2 - x1) / w, (y2 - y1) / h
                    yolo_lines.append(f"{cls_id} {cx:.6f} {cy:.6f} {bw:.6f} {bh:.6f}")

        if writer is not None:
            writer.write(r.plot())

        if outputs.get("dataset") and yolo_lines:
            cv2.imwrite(os.path.join(dataset_dir, "images", f"frame_{frame_idx:05d}.jpg"), r.orig_img)
            with open(os.path.join(dataset_dir, "labels", f"frame_{frame_idx:05d}.txt"), "w") as f:
                f.write("\n".join(yolo_lines))

        frame_idx += 1

    if writer is not None:
        writer.release()
        _encode_h264(tmp_video, os.path.join(out_dir, "annotated.mp4"))

    # ── analytics ────────────────────────────────────────────
    unique_per_class = Counter(track_class.values())
    det_per_class = Counter(d["class"] for d in detections)
    stats = {
        "frames_processed": frame_idx,
        "fps": round(fps, 2),
        "duration_s": round(frame_idx / fps, 2),
        "classes": classes,
        "unique_objects": dict(unique_per_class),   # counted by track ID (no double-count)
        "total_detections": len(detections),
        "detections_per_class": dict(det_per_class),
    }

    if outputs.get("report"):
        with open(os.path.join(out_dir, "detections.csv"), "w", newline="") as f:
            cw = csv.writer(f)
            cw.writerow(["frame", "time_s", "track_id", "class", "conf", "x1", "y1", "x2", "y2"])
            for d in detections:
                cw.writerow([d["frame"], d["time"], d["track_id"], d["class"], d["conf"], *d["box"]])
        with open(os.path.join(out_dir, "report.json"), "w") as f:
            json.dump(stats, f, indent=2)

    if outputs.get("dataset"):
        with open(os.path.join(dataset_dir, "data.yaml"), "w") as f:
            f.write("names:\n" + "".join(f"  {i}: {c}\n" for i, c in enumerate(classes)))

    return stats


if __name__ == "__main__":
    import sys
    out = process(
        sys.argv[1] if len(sys.argv) > 1 else "/tmp/sample.mp4",
        classes=["person"],
        out_dir="/tmp/sightline_out",
        outputs={"video": True, "report": True, "dataset": True},
        max_frames=40,
    )
    print(json.dumps(out, indent=2))
