"""Turn phone videos into landmark clips for dynamic FSL signs.

Folder layout (private, ignored by git):
  machine-learning/data/dynamic_videos/<SIGNER>/<LABEL>/clip1.mp4
Example: machine-learning/data/dynamic_videos/S02/J/clip1.mp4

Usage (from the project root):
  .\machine-learning\fsl_env\Scripts\python.exe machine-learning\extract_dynamic_videos.py
  ... --signer S02 --hand right         (only one signer)
  ... --flip                            (the phone saved the video mirrored)

Record sideways (landscape), one sign per clip, hand visible the whole time.
Only landmarks are saved to data/dynamic/<LABEL>/ (same format as collect_dynamic.py).
"""
import argparse
import os
import re

import cv2
import mediapipe as mp
import numpy as np

from collect_dynamic import MIN_DETECTED, SEQ_LEN, resample

VIDEO_EXT = (".mp4", ".mov", ".m4v", ".avi", ".mkv", ".3gp", ".webm")
MAX_WIDTH = 960


def parse_args():
    p = argparse.ArgumentParser(description="Extract landmark clips from phone videos.")
    p.add_argument("--signer", help="Only process this signer folder, e.g. S02")
    p.add_argument("--label", help="Only process this label folder, e.g. J")
    p.add_argument("--hand", choices=["right", "left"], default="right", help="The signer's signing hand")
    p.add_argument("--window", type=float, default=2.0, help="Seconds of video to keep around the movement")
    p.add_argument("--no-center", action="store_true", help="Use the whole video instead of a centered window")
    p.add_argument("--flip", action="store_true", help="Mirror the frames (if the phone saved a mirrored video)")
    p.add_argument("--allow-portrait", action="store_true", help="Accept portrait videos (not recommended)")
    return p.parse_args()


def read_landmarks(path, flip):
    cap = cv2.VideoCapture(path)
    if not cap.isOpened():
        return None, None, 0.0, False, "cannot open the video (try converting it to an H.264 MP4)"
    fps = cap.get(cv2.CAP_PROP_FPS) or 0.0
    if fps <= 1 or fps > 240:
        fps = 30.0
    hands = mp.solutions.hands.Hands(
        static_image_mode=False, max_num_hands=1,
        min_detection_confidence=0.7, min_tracking_confidence=0.5,
    )
    vecs, mask, portrait = [], [], False
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        h, w = frame.shape[:2]
        if h > w:
            portrait = True
        if w > MAX_WIDTH:
            frame = cv2.resize(frame, (MAX_WIDTH, int(h * MAX_WIDTH / w)))
        if flip:
            frame = cv2.flip(frame, 1)
        res = hands.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        if res.multi_hand_landmarks:
            lm = res.multi_hand_landmarks[0]
            vecs.append(np.array([[q.x, q.y, q.z] for q in lm.landmark], dtype=np.float32).flatten())
            mask.append(True)
        else:
            vecs.append(np.zeros(63, dtype=np.float32))
            mask.append(False)
    cap.release()
    hands.close()
    if len(vecs) < 10:
        return None, None, fps, portrait, "the video is too short"
    return np.array(vecs), np.array(mask, dtype=bool), fps, portrait, None


def pick_window(frames, mask, fps, window_s, center):
    """Keep window_s seconds centered on where the hand moves."""
    n = len(frames)
    duration = n / fps
    if not center or duration <= window_s:
        return slice(0, n)
    t = np.arange(n) / fps
    speed = np.zeros(n)
    for i in range(1, n):
        if mask[i] and mask[i - 1]:
            speed[i] = float(np.mean(np.abs(frames[i] - frames[i - 1])))
    if speed.max() <= 0:
        mid = duration / 2
    else:
        thr = max(0.0015, 0.2 * float(np.percentile(speed[speed > 0], 90)))
        moving = np.where(speed > thr)[0]
        mid = (t[moving[0]] + t[moving[-1]]) / 2 if len(moving) else duration / 2
    start = min(max(0.0, mid - window_s / 2), duration - window_s)
    idx = np.where((t >= start) & (t <= start + window_s))[0]
    return slice(int(idx[0]), int(idx[-1]) + 1)


def main():
    args = parse_args()
    here = os.path.dirname(os.path.abspath(__file__))
    src_root = os.path.join(here, "data", "dynamic_videos")
    out_root = os.path.join(here, "data", "dynamic")
    if not os.path.isdir(src_root):
        os.makedirs(src_root, exist_ok=True)
        print("Created %s. Put videos in <SIGNER>/<LABEL>/ folders, e.g. S02/J/clip1.mp4" % src_root)
        return

    ok_count, bad_count = 0, 0
    for signer in sorted(os.listdir(src_root)):
        s_dir = os.path.join(src_root, signer)
        if not os.path.isdir(s_dir) or (args.signer and signer != args.signer):
            continue
        for label in sorted(os.listdir(s_dir)):
            l_dir = os.path.join(s_dir, label)
            if not os.path.isdir(l_dir) or (args.label and label.upper() != args.label.upper()):
                continue
            out_dir = os.path.join(out_root, label.upper())
            os.makedirs(out_dir, exist_ok=True)
            for fname in sorted(os.listdir(l_dir)):
                if not fname.lower().endswith(VIDEO_EXT):
                    continue
                path = os.path.join(l_dir, fname)
                tag = "%s/%s/%s" % (signer, label, fname)
                frames, mask, fps, portrait, err = read_landmarks(path, args.flip)
                if err is None and portrait and not args.allow_portrait:
                    err = "portrait video. Record sideways (landscape) so the hand shape matches the webcam"
                if err is None:
                    sl = pick_window(frames, mask, fps, args.window, not args.no_center)
                    frames, mask = frames[sl], mask[sl]
                    ratio = float(mask.mean()) if len(mask) else 0.0
                    if mask.sum() < 2 or ratio < MIN_DETECTED:
                        err = "the hand was found in only %d%% of frames" % int(ratio * 100)
                if err is not None:
                    print("REJECTED  %s: %s" % (tag, err))
                    bad_count += 1
                    continue
                seq = resample(frames, mask, SEQ_LEN)
                stem = re.sub(r"[^A-Za-z0-9]+", "_", os.path.splitext(fname)[0])
                name = "%s_%s_vid_%s.npy" % (signer, args.hand, stem)
                np.save(os.path.join(out_dir, name), seq)
                print("OK        %s -> %s (hand seen in %d%% of frames)" % (tag, name, int(ratio * 100)))
                ok_count += 1
    print("Done. %d clips saved, %d rejected." % (ok_count, bad_count))


if __name__ == "__main__":
    main()