"""Sightline core pipeline: detect -> track -> ROI counting -> rules/alerts -> safety/PPE -> annotate -> report -> dataset."""
from __future__ import annotations

import csv
import json
import os
import shutil
import ssl
import subprocess
from collections import Counter, defaultdict

import cv2
import numpy as np

ssl._create_default_https_context = ssl._create_unverified_context
FONT = cv2.FONT_HERSHEY_SIMPLEX
VIOLATION_FRAMES = 5  # a person must lack PPE for this many frames to count as a violation


def _encode_h264(src: str, dst: str) -> None:
    if shutil.which("ffmpeg"):
        subprocess.run(["ffmpeg", "-y", "-i", src, "-c:v", "libx264", "-pix_fmt", "yuv420p",
                        "-movflags", "+faststart", dst],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        os.remove(src)
    else:
        shutil.move(src, dst)


def _ccw(a, b, c) -> float:
    return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])


def _segments_intersect(p1, p2, p3, p4) -> bool:
    d1, d2 = _ccw(p3, p4, p1), _ccw(p3, p4, p2)
    d3, d4 = _ccw(p1, p2, p3), _ccw(p1, p2, p4)
    return ((d1 > 0) != (d2 > 0)) and ((d3 > 0) != (d4 > 0))


def _in_head(c, box) -> bool:
    x1, y1, x2, y2 = box
    return x1 <= c[0] <= x2 and y1 <= c[1] <= y1 + 0.55 * (y2 - y1)


def _prepare_regions(regions, w, h):
    lines, zones = [], []
    for r in regions or []:
        if r.get("type") == "line" and r.get("a") and r.get("b"):
            lines.append({"name": r.get("name", f"Line {len(lines) + 1}"),
                          "a": (r["a"][0] * w, r["a"][1] * h), "b": (r["b"][0] * w, r["b"][1] * h),
                          "in": 0, "out": 0})
        elif r.get("type") == "zone" and len(r.get("points", [])) >= 3:
            poly = np.array([[p[0] * w, p[1] * h] for p in r["points"]], dtype=np.int32)
            zones.append({"name": r.get("name", f"Zone {len(zones) + 1}"),
                          "poly": poly, "ids": set(), "dwell": defaultdict(int)})
    return lines, zones


def _prepare_rules(rules):
    return [{"name": r.get("name") or "Alert", "metric": r.get("metric", "screen"),
             "region": r.get("region"), "cls": r.get("class") or r.get("cls"),
             "threshold": float(r.get("threshold", 1)), "fired": False, "first_time": None, "peak": 0}
            for r in rules or []]


def _draw_regions(frame, lines, zones):
    for L in lines:
        a = (int(L["a"][0]), int(L["a"][1])); b = (int(L["b"][0]), int(L["b"][1]))
        cv2.line(frame, a, b, (80, 200, 255), 3)
        cv2.putText(frame, f"{L['name']}: in {L['in']} / out {L['out']}",
                    ((a[0] + b[0]) // 2 - 60, (a[1] + b[1]) // 2 - 8), FONT, 0.6, (80, 200, 255), 2, cv2.LINE_AA)
    for Z in zones:
        cv2.polylines(frame, [Z["poly"]], True, (180, 120, 255), 2)
        x, y = int(Z["poly"][:, 0].min()), int(Z["poly"][:, 1].min())
        cv2.putText(frame, f"{Z['name']}: {len(Z['ids'])}", (x, max(y - 8, 14)), FONT, 0.6, (180, 120, 255), 2, cv2.LINE_AA)


def _eval_rules(rules, t, frame_total, frame_class, frame_zone, lines):
    line_totals = {L["name"]: L["in"] + L["out"] for L in lines}
    for R in rules:
        if R["metric"] == "zone":
            val = frame_zone.get(R["region"], 0)
        elif R["metric"] == "line":
            val = line_totals.get(R["region"], 0)
        else:
            val = frame_class.get(R["cls"], 0) if R["cls"] else frame_total
        R["peak"] = max(R["peak"], val)
        if val >= R["threshold"] and not R["fired"]:
            R["fired"], R["first_time"] = True, round(t, 2)


def process(video_path, classes, out_dir, outputs, regions=None, rules=None, safety=None,
            conf=0.25, max_frames=None, model_weights="yolov8s-world.pt"):
    from ultralytics import YOLOWorld

    os.makedirs(out_dir, exist_ok=True)

    required = []
    if safety:
        required = [c.lower() for c in (safety.get("require") or ["helmet"])]
        classes = list(dict.fromkeys([*classes, "person", *required]))

    model = YOLOWorld(model_weights)
    model.set_classes(classes)

    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)); h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    cap.release()

    lines, zones = _prepare_regions(regions, w, h)
    rules_state = _prepare_rules(rules)
    track_prev: dict[int, tuple[float, float]] = {}
    safety_missing: dict[int, int] = defaultdict(int)
    safety_events: dict[int, float] = {}

    writer = None
    tmp_video = os.path.join(out_dir, "_tmp.avi")
    if outputs.get("video"):
        writer = cv2.VideoWriter(tmp_video, cv2.VideoWriter_fourcc(*"MJPG"), fps, (w, h))

    dataset_dir = os.path.join(out_dir, "dataset")
    if outputs.get("dataset"):
        os.makedirs(os.path.join(dataset_dir, "images"), exist_ok=True)
        os.makedirs(os.path.join(dataset_dir, "labels"), exist_ok=True)

    detections: list[dict] = []
    track_class: dict[int, str] = {}
    frame_idx = 0

    for r in model.track(source=video_path, tracker="bytetrack.yaml", stream=True,
                         conf=conf, persist=True, verbose=False):
        if max_frames is not None and frame_idx >= max_frames:
            break
        names = r.names
        boxes = r.boxes
        yolo_lines: list[str] = []
        frame_total = int(len(boxes)) if boxes is not None else 0
        frame_class: Counter = Counter()
        frame_zone = {Z["name"]: 0 for Z in zones}
        persons: list = []
        ppe_centers: dict = defaultdict(list)

        if boxes is not None and len(boxes):
            for b in boxes:
                cls_id = int(b.cls); cls = names[cls_id]
                tid = int(b.id) if b.id is not None else -1
                x1, y1, x2, y2 = (float(v) for v in b.xyxy[0])
                cx, cy = (x1 + x2) / 2, (y1 + y2) / 2
                frame_class[cls] += 1
                detections.append({"frame": frame_idx, "time": round(frame_idx / fps, 2),
                                   "track_id": tid, "class": cls, "conf": round(float(b.conf), 3),
                                   "box": [round(x1, 1), round(y1, 1), round(x2, 1), round(y2, 1)]})
                if safety:
                    if cls == "person":
                        persons.append((x1, y1, x2, y2, tid))
                    elif cls in required:
                        ppe_centers[cls].append((cx, cy))

                inside = [Z for Z in zones if cv2.pointPolygonTest(Z["poly"], (cx, cy), False) >= 0]
                for Z in inside:
                    frame_zone[Z["name"]] += 1
                if tid >= 0:
                    track_class[tid] = cls
                    prev = track_prev.get(tid)
                    for L in lines:
                        if prev is not None and _segments_intersect(prev, (cx, cy), L["a"], L["b"]):
                            L["in" if _ccw(L["a"], L["b"], (cx, cy)) >= 0 else "out"] += 1
                    for Z in inside:
                        Z["ids"].add(tid); Z["dwell"][tid] += 1
                    track_prev[tid] = (cx, cy)
                if outputs.get("dataset"):
                    cxn, cyn = ((x1 + x2) / 2) / w, ((y1 + y2) / 2) / h
                    yolo_lines.append(f"{cls_id} {cxn:.6f} {cyn:.6f} {(x2 - x1) / w:.6f} {(y2 - y1) / h:.6f}")

        # PPE association
        frame_flags = []
        if safety:
            for (x1, y1, x2, y2, tid) in persons:
                missing = [item for item in required
                           if not any(_in_head(c, (x1, y1, x2, y2)) for c in ppe_centers.get(item, []))]
                frame_flags.append(((x1, y1, x2, y2), not missing, missing))
                if missing and tid >= 0:
                    safety_missing[tid] += 1
                    if safety_missing[tid] == VIOLATION_FRAMES and tid not in safety_events:
                        safety_events[tid] = round(frame_idx / fps, 2)

        if rules_state:
            _eval_rules(rules_state, frame_idx / fps, frame_total, frame_class, frame_zone, lines)

        if writer is not None:
            frame = r.plot()
            if lines or zones:
                _draw_regions(frame, lines, zones)
            for (pbox, ok, missing) in frame_flags:
                if not ok:
                    x1, y1, x2, y2 = map(int, pbox)
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (60, 60, 235), 3)
                    cv2.putText(frame, "NO " + "/".join(missing).upper(), (x1, max(y1 - 6, 12)),
                                FONT, 0.55, (60, 60, 235), 2, cv2.LINE_AA)
            writer.write(frame)

        if outputs.get("dataset") and yolo_lines:
            cv2.imwrite(os.path.join(dataset_dir, "images", f"frame_{frame_idx:05d}.jpg"), r.orig_img)
            with open(os.path.join(dataset_dir, "labels", f"frame_{frame_idx:05d}.txt"), "w") as f:
                f.write("\n".join(yolo_lines))
        frame_idx += 1

    if writer is not None:
        writer.release()
        _encode_h264(tmp_video, os.path.join(out_dir, "annotated.mp4"))

    stats = {
        "frames_processed": frame_idx, "fps": round(fps, 2), "duration_s": round(frame_idx / fps, 2),
        "classes": classes, "unique_objects": dict(Counter(track_class.values())),
        "total_detections": len(detections), "detections_per_class": dict(Counter(d["class"] for d in detections)),
        "lines": [{"name": L["name"], "in": L["in"], "out": L["out"], "total": L["in"] + L["out"]} for L in lines],
        "zones": [{"name": Z["name"], "count": len(Z["ids"]),
                   "avg_dwell_s": round(sum(Z["dwell"].values()) / len(Z["dwell"]) / fps, 2) if Z["dwell"] else 0.0}
                  for Z in zones],
        "alerts": [{"name": R["name"], "metric": R["metric"], "region": R["region"], "cls": R["cls"],
                    "threshold": R["threshold"], "time_s": R["first_time"], "peak": R["peak"]}
                   for R in rules_state if R["fired"]],
    }
    if safety:
        stats["safety"] = {
            "required": required,
            "violations": len(safety_events),
            "events": [{"track_id": tid, "time_s": t} for tid, t in sorted(safety_events.items(), key=lambda kv: kv[1])],
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
    out = process(sys.argv[1] if len(sys.argv) > 1 else "/tmp/sample.mp4",
                  classes=["person"], out_dir="/tmp/sightline_out",
                  outputs={"video": True, "report": True, "dataset": False},
                  safety={"require": ["helmet"]}, max_frames=80)
    print(json.dumps(out.get("safety"), indent=2))
