"""Record landmark clips for dynamic FSL signs (J, Z, IDLE, ...).

Only hand landmarks are saved (never video or photos).
Usage (from the project root):
  .\machine-learning\fsl_env\Scripts\python.exe machine-learning\collect_dynamic.py --label J --signer S01 --clips 10
Keys: SPACE = record a clip, U = undo the last clip of this session, Q = quit.
"""
import argparse
import os
import time
from datetime import datetime

import cv2
import mediapipe as mp
import numpy as np

SEQ_LEN = 32          # every saved clip is resampled to this many frames
MIN_DETECTED = 0.80   # at least this share of frames must contain a hand
COUNTDOWN_S = 3

TIPS = """
Tips for good data
  J : keep the pinky up (I handshape) and draw a J: down, then hook toward you.
  Z : point the index finger and draw a Z in the air: across, diagonal, across.
  IDLE : record hand movement that is NOT J or Z (waving, other letters, resting).
         A model needs these to avoid false J and Z.
  Vary every clip: distance from the camera, angle, speed, lighting, hand position.
  Use a short signer code (S01, S02), never real names. Ask a fluent signer to check J and Z.
"""


def parse_args():
    p = argparse.ArgumentParser(description="Record dynamic sign clips as hand landmarks.")
    p.add_argument("--label", required=True, help="Sign label, e.g. J, Z or IDLE")
    p.add_argument("--signer", required=True, help="Short signer code, e.g. S01")
    p.add_argument("--hand", choices=["right", "left"], default="right", help="The signer's signing hand")
    p.add_argument("--clips", type=int, default=10, help="How many clips to record this session")
    p.add_argument("--seconds", type=float, default=2.0, help="Length of each clip")
    p.add_argument("--camera", type=int, default=0, help="Camera index")
    return p.parse_args()


def resample(frames, mask, length):
    """Fill frames where the hand was lost, then resample to a fixed length."""
    n = len(frames)
    idx = np.where(mask)[0]
    filled = np.zeros_like(frames)
    grid = np.arange(n)
    for c in range(frames.shape[1]):
        filled[:, c] = np.interp(grid, idx, frames[idx, c])
    src = np.linspace(0, n - 1, length)
    out = np.zeros((length, frames.shape[1]), dtype=np.float32)
    for c in range(frames.shape[1]):
        out[:, c] = np.interp(src, grid, filled[:, c])
    return out


def put(img, text, y, scale=0.8, color=(255, 255, 255), thick=2):
    cv2.putText(img, text, (20, y), cv2.FONT_HERSHEY_SIMPLEX, scale, (0, 0, 0), thick + 3, cv2.LINE_AA)
    cv2.putText(img, text, (20, y), cv2.FONT_HERSHEY_SIMPLEX, scale, color, thick, cv2.LINE_AA)


def main():
    args = parse_args()
    label = args.label.upper()
    here = os.path.dirname(os.path.abspath(__file__))
    out_dir = os.path.join(here, "data", "dynamic", label)
    os.makedirs(out_dir, exist_ok=True)

    cap = cv2.VideoCapture(args.camera, cv2.CAP_DSHOW)
    if not cap.isOpened():
        print("Could not open the camera. Close other apps or browser tabs that use it.")
        return

    print(TIPS)
    hands = mp.solutions.hands.Hands(
        static_image_mode=False, max_num_hands=1,
        min_detection_confidence=0.7, min_tracking_confidence=0.5,
    )
    drawing = mp.solutions.drawing_utils

    session = []          # files saved this session
    state = "ready"       # ready -> countdown -> recording -> ready
    message = "Press SPACE when you are ready"
    t_state = time.time()
    buf, mask = [], []

    while True:
        ok, frame = cap.read()
        if not ok:
            break
        res = hands.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        found = bool(res.multi_hand_landmarks)
        vec = np.zeros(63, dtype=np.float32)
        if found:
            lm = res.multi_hand_landmarks[0]
            vec = np.array([[p.x, p.y, p.z] for p in lm.landmark], dtype=np.float32).flatten()
            drawing.draw_landmarks(frame, lm, mp.solutions.hands.HAND_CONNECTIONS)
        view = cv2.flip(frame, 1)  # mirror so it feels like a mirror
        now = time.time()

        if state == "countdown":
            left = COUNTDOWN_S - int(now - t_state)
            if left <= 0:
                state, t_state, buf, mask = "recording", now, [], []
            else:
                put(view, str(left), 200, scale=5.0, color=(0, 215, 255), thick=8)
        elif state == "recording":
            buf.append(vec)
            mask.append(found)
            frac = min(1.0, (now - t_state) / args.seconds)
            h, w = view.shape[:2]
            cv2.rectangle(view, (20, h - 40), (20 + int((w - 40) * frac), h - 20), (0, 0, 255), -1)
            put(view, "RECORDING - sign " + label, 60, color=(0, 0, 255))
            if now - t_state >= args.seconds:
                frames = np.array(buf, dtype=np.float32)
                ok_mask = np.array(mask, dtype=bool)
                ratio = float(ok_mask.mean()) if len(ok_mask) else 0.0
                if ratio >= MIN_DETECTED and ok_mask.sum() >= 2:
                    seq = resample(frames, ok_mask, SEQ_LEN)
                    name = "%s_%s_%s.npy" % (args.signer, args.hand, datetime.now().strftime("%Y%m%d_%H%M%S"))
                    path = os.path.join(out_dir, name)
                    np.save(path, seq)
                    session.append(path)
                    message = "Saved %d/%d (hand seen in %d%% of frames)" % (len(session), args.clips, int(ratio * 100))
                else:
                    message = "Hand was lost too often (%d%%). Try again." % int(ratio * 100)
                state = "ready"

        if state == "ready":
            if len(session) >= args.clips:
                put(view, "Done! Press Q to finish.", 60, color=(0, 255, 0))
            else:
                put(view, message, 60, color=(0, 255, 0) if message.startswith("Saved") else (255, 255, 255))
        put(view, "%s | signer %s | clips %d/%d" % (label, args.signer, len(session), args.clips), view.shape[0] - 60, scale=0.7)
        put(view, "SPACE record   U undo   Q quit", view.shape[0] - 90, scale=0.6)

        cv2.imshow("FSL dynamic recorder", view)
        key = cv2.waitKey(1) & 0xFF
        if key in (ord("q"), ord("Q")):
            break
        if key == ord(" ") and state == "ready" and len(session) < args.clips:
            state, t_state = "countdown", time.time()
        if key in (ord("u"), ord("U")) and state == "ready" and session:
            os.remove(session.pop())
            message = "Removed the last clip (%d/%d)" % (len(session), args.clips)

    cap.release()
    cv2.destroyAllWindows()
    total = len([f for f in os.listdir(out_dir) if f.endswith(".npy")])
    print("Saved this session: %d. Total clips for %s: %d (%s)" % (len(session), label, total, out_dir))


if __name__ == "__main__":
    main()