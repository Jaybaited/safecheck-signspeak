# Trains a scale-proof FSL model and compares it with the current one.
# Saves to separate files; the current model files are never touched.
import os
import time
import numpy as np
import joblib
from sklearn.svm import SVC
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import LabelEncoder

from features import extract_features

rng = np.random.default_rng(42)
N_AUGMENTS = 1


def aug_noise(lm, std=0.005):
    return lm + rng.normal(0, std, lm.shape)


def aug_rotate2d(lm, max_angle_deg=15):
    pts = lm.reshape(21, 3).copy()
    angle = np.radians(rng.uniform(-max_angle_deg, max_angle_deg))
    c, s = np.cos(angle), np.sin(angle)
    origin = pts[0, :2].copy()
    xy = pts[:, :2] - origin
    pts[:, 0] = xy[:, 0] * c - xy[:, 1] * s + origin[0]
    pts[:, 1] = xy[:, 0] * s + xy[:, 1] * c + origin[1]
    return pts.flatten()


def aug_flip(lm):
    flipped = lm.copy()
    flipped[0::3] = 1.0 - flipped[0::3]
    return flipped


def augment(lm):
    out = aug_rotate2d(aug_noise(lm))
    if rng.random() < 0.5:
        out = aug_flip(out)
    return out


def shrink(lm, factor):
    """Simulate a hand farther from the camera: scale x, y, z about the hand centre."""
    pts = lm.reshape(21, 3).copy()
    centre = pts[:, :2].mean(axis=0)
    pts[:, :2] = centre + (pts[:, :2] - centre) * factor
    pts[:, 2] = pts[:, 2] * factor
    return pts.flatten()


print("Loading landmark data...")
data = np.load("./data/landmarks.npy")
labels = np.load("./data/labels.npy")
le = LabelEncoder()
y_all = le.fit_transform(labels)
print("  samples:", len(data), " classes:", len(le.classes_))

idx = np.arange(len(data))
train_idx, test_idx = train_test_split(idx, test_size=0.2, random_state=42, stratify=y_all)

rows, ys = [], []
for i in train_idx:
    rows.append(data[i]); ys.append(y_all[i])
    for _ in range(N_AUGMENTS):
        rows.append(augment(data[i])); ys.append(y_all[i])

CUSTOM_PATH = "./dataset/custom_samples"
if os.path.exists(CUSTOM_PATH):
    added = 0
    for letter in sorted(os.listdir(CUSTOM_PATH)):
        folder = os.path.join(CUSTOM_PATH, letter)
        if not os.path.isdir(folder) or letter not in le.classes_:
            continue
        code = int(le.transform([letter])[0])
        for f in os.listdir(folder):
            if f.endswith(".npy"):
                row = np.load(os.path.join(folder, f))
                if row.shape == (63,):
                    rows.append(row); ys.append(code)
                    for _ in range(N_AUGMENTS + 2):
                        rows.append(augment(row)); ys.append(code)
                    added += 1
    print("  custom samples added:", added)

X_train = np.array([extract_features(r) for r in rows])
y_train = np.array(ys)
print("  training rows:", X_train.shape, "\n")

print("Training the normalized SVM (a few minutes)...")
t0 = time.time()
model = SVC(kernel="rbf", C=10, gamma="scale", probability=True, cache_size=1000)
model.fit(X_train, y_train)
print("  done in %.1f minutes\n" % ((time.time() - t0) / 60))

X_test_norm = np.array([extract_features(data[i]) for i in test_idx])
y_test = labels[test_idx]
pred = le.inverse_transform(model.predict(X_test_norm))
print("New model accuracy on untouched test photos: %.2f%%\n" % (accuracy_score(y_test, pred) * 100))
print(classification_report(y_test, pred))

old, old_le = None, None
if os.path.exists("./models/fsl_svm.pkl") and os.path.exists("./models/fsl_labels.pkl"):
    old = joblib.load("./models/fsl_svm.pkl")
    old_le = joblib.load("./models/fsl_labels.pkl")

print("Robustness: hand shown smaller, as if farther from the camera")
print("(the old model saw copies of these photos while training, so its row at 1.0 is optimistic)")
print("%-12s %-10s %-10s %-12s %-12s" % ("size", "old all", "new all", "old U and R", "new U and R"))
ur = np.isin(y_test, ["U", "R"])
for factor in [1.0, 0.8, 0.7, 0.5]:
    shrunk = np.array([shrink(data[i], factor) for i in test_idx])
    new_pred = le.inverse_transform(model.predict(np.array([extract_features(r) for r in shrunk])))
    new_all = np.mean(new_pred == y_test) * 100
    new_ur = np.mean(new_pred[ur] == y_test[ur]) * 100 if ur.any() else float("nan")
    if old is not None:
        old_pred = old_le.inverse_transform(old.predict(shrunk))
        old_all = np.mean(old_pred == y_test) * 100
        old_ur = np.mean(old_pred[ur] == y_test[ur]) * 100 if ur.any() else float("nan")
    else:
        old_all = old_ur = float("nan")
    print("%-12s %-10.1f %-10.1f %-12.1f %-12.1f" % (factor, old_all, new_all, old_ur, new_ur))

os.makedirs("./models", exist_ok=True)
joblib.dump(model, "./models/fsl_svm_norm.pkl")
joblib.dump(le, "./models/fsl_labels_norm.pkl")
print("\nSaved ./models/fsl_svm_norm.pkl and ./models/fsl_labels_norm.pkl (the current model files were not changed)")