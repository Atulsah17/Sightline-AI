"""Generate a polished supervision-annotated hero clip (corner boxes + labels + traces)."""
import ssl
import sys

ssl._create_default_https_context = ssl._create_unverified_context

import cv2
import supervision as sv
from ultralytics import YOLOWorld

SRC = sys.argv[1] if len(sys.argv) > 1 else "/tmp/sv_people-walking.mp4"
CLASSES = (sys.argv[2].split(",") if len(sys.argv) > 2 else ["person"])
OUT = "/tmp/hero_sv.avi"
MAX_FRAMES = 170
TARGET_W = 1100

model = YOLOWorld("yolov8s-world.pt")
model.set_classes(CLASSES)
tracker = sv.ByteTrack()

lookup = sv.ColorLookup.TRACK
palette = sv.ColorPalette.DEFAULT
corner = sv.BoxCornerAnnotator(color=palette, thickness=3, corner_length=18, color_lookup=lookup)
label = sv.LabelAnnotator(color=palette, text_color=sv.Color.WHITE, text_scale=0.5,
                          text_thickness=1, text_padding=4, color_lookup=lookup)
trace = sv.TraceAnnotator(color=palette, thickness=2, trace_length=40, color_lookup=lookup)

cap = cv2.VideoCapture(SRC)
fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)); h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
scale = TARGET_W / w if w > TARGET_W else 1.0
ow, oh = int(w * scale), int(h * scale)
writer = cv2.VideoWriter(OUT, cv2.VideoWriter_fourcc(*"MJPG"), fps, (ow, oh))

i = 0
while i < MAX_FRAMES:
    ok, frame = cap.read()
    if not ok:
        break
    if scale != 1.0:
        frame = cv2.resize(frame, (ow, oh))
    res = model.predict(frame, conf=0.2, verbose=False)[0]
    det = sv.Detections.from_ultralytics(res)
    det = tracker.update_with_detections(det)
    labels = [f"#{tid}" for tid in det.tracker_id] if det.tracker_id is not None else None
    out = frame.copy()
    out = trace.annotate(out, det)
    out = corner.annotate(out, det)
    if labels is not None:
        out = label.annotate(out, det, labels)
    writer.write(out)
    i += 1

writer.release()
print(f"done: {i} frames -> {OUT} ({ow}x{oh})")
