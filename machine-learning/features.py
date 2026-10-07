import numpy as np

FINGERTIPS = [4, 8, 12, 16, 20]


def normalize_landmarks(lm63):
    """Wrist at the origin, scaled by hand size (wrist to middle-finger knuckle)."""
    pts = np.asarray(lm63, dtype=np.float64).reshape(21, 3).copy()
    pts -= pts[0]
    scale = float(np.linalg.norm(pts[9, :2]))
    if scale < 1e-6:
        scale = 1.0
    pts /= scale
    return pts


def extract_features(lm63):
    """79 features: 63 normalized coordinates, 10 fingertip distances,
    2 index/middle joint distances, and 4 index/middle crossing offsets (helps U vs R)."""
    pts = normalize_landmarks(lm63)
    flat = pts.flatten()
    tips = pts[FINGERTIPS]
    tip_dists = [float(np.linalg.norm(tips[i] - tips[j])) for i in range(5) for j in range(i + 1, 5)]
    joint_dists = [
        float(np.linalg.norm(pts[6] - pts[10])),
        float(np.linalg.norm(pts[7] - pts[11])),
    ]
    cross = [
        float(pts[8, 0] - pts[12, 0]),
        float(pts[7, 0] - pts[11, 0]),
        float(pts[6, 0] - pts[10, 0]),
        float(pts[8, 1] - pts[12, 1]),
    ]
    return np.concatenate([flat, tip_dists, joint_dists, cross])