# augment_and_retrain.py
import numpy as np
import joblib
import os
from sklearn.svm import SVC
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import LabelEncoder

# ─────────────────────────────────────────
# Augmentation Functions
# ─────────────────────────────────────────

def aug_noise(lm, std=0.01):
    """Add Gaussian jitter — simulates sensor noise / shaky hand."""
    return lm + np.random.normal(0, std, lm.shape)

def aug_scale(lm, low=0.9, high=1.1):
    """Random scale — simulates hand closer/farther from camera."""
    return lm * np.random.uniform(low, high)

def aug_translate(lm, limit=0.05):
    """Random translation — simulates hand not centered in frame."""
    return lm + np.random.uniform(-limit, limit, lm.shape)

def aug_flip(lm):
    """Horizontal flip — mirrors X coords, simulates left-hand signer."""
    flipped = lm.copy()
    flipped[0::3] = 1.0 - flipped[0::3]  # flip x only (every 3rd value)
    return flipped

def aug_rotate2d(lm, max_angle_deg=10):
    """
    2D rotation around the wrist (landmark 0).
    Reshapes (63,) → (21,3), rotates x/y, flattens back.
    """
    pts = lm.reshape(21, 3).copy()
    angle = np.radians(np.random.uniform(-max_angle_deg, max_angle_deg))
    cos_a, sin_a = np.cos(angle), np.sin(angle)

    # Rotate around wrist point (landmark 0)
    origin = pts[0, :2].copy()
    xy = pts[:, :2] - origin
    pts[:, 0] = xy[:, 0] * cos_a - xy[:, 1] * sin_a + origin[0]
    pts[:, 1] = xy[:, 0] * sin_a + xy[:, 1] * cos_a + origin[1]

    return pts.flatten()

def augment_sample(lm, n=4):
    """
    Generate n augmented variations of a single landmark sample.
    Each variation randomly combines all techniques.
    """
    results = []
    for _ in range(n):
        aug = lm.copy()
        aug = aug_noise(aug)
        aug = aug_scale(aug)
        aug = aug_translate(aug)
        aug = aug_rotate2d(aug)
        # 50% chance to also flip (adds left-hand variety)
        if np.random.random() < 0.5:
            aug = aug_flip(aug)
        results.append(aug)
    return results


# ─────────────────────────────────────────
# Load Data
# ─────────────────────────────────────────

print("📂 Loading original landmark data...")
data   = np.load("./data/landmarks.npy")
labels = np.load("./data/labels.npy")
print(f"   Original samples : {len(data)}")
print(f"   Classes          : {len(set(labels))}")
print(f"   Shape            : {data.shape}\n")

# ─────────────────────────────────────────
# Apply Augmentation (×5 total)
# ─────────────────────────────────────────

N_AUGMENTS = 4  # 4 new + 1 original = ×5

print(f"🔄 Augmenting data (×{N_AUGMENTS + 1})...\n")

aug_data, aug_labels = [], []

for sample, label in zip(data, labels):
    aug_data.append(sample)       # keep original
    aug_labels.append(label)

    for aug_sample in augment_sample(sample, n=N_AUGMENTS):
        aug_data.append(aug_sample)
        aug_labels.append(label)

aug_data   = np.array(aug_data)
aug_labels = np.array(aug_labels)

print(f"   Augmented samples : {len(aug_data)}")
print(f"   Shape             : {aug_data.shape}\n")

# ─────────────────────────────────────────
# Load Custom Samples (if any)
# ─────────────────────────────────────────

CUSTOM_PATH = "./dataset/custom_samples"
if os.path.exists(CUSTOM_PATH):
    custom_data, custom_labels = [], []
    for letter in sorted(os.listdir(CUSTOM_PATH)):
        folder = os.path.join(CUSTOM_PATH, letter)
        if not os.path.isdir(folder):
            continue
        for f in os.listdir(folder):
            if f.endswith('.npy'):
                row = np.load(os.path.join(folder, f))
                # Add custom sample + augmented versions
                custom_data.append(row)
                custom_labels.append(letter)
                for aug_sample in augment_sample(row, n=N_AUGMENTS):
                    custom_data.append(aug_sample)
                    custom_labels.append(letter)

    if custom_data:
        aug_data   = np.vstack([aug_data, np.array(custom_data)])
        aug_labels = np.concatenate([aug_labels, np.array(custom_labels)])
        print(f"✅ Added {len(custom_data)} custom samples (with augmentation)\n")

# ─────────────────────────────────────────
# Encode + Split
# ─────────────────────────────────────────

le             = LabelEncoder()
labels_encoded = le.fit_transform(aug_labels)

X_train, X_test, y_train, y_test = train_test_split(
    aug_data, labels_encoded,
    test_size=0.2,
    random_state=42,
    stratify=labels_encoded
)

print(f"📊 Train samples : {len(X_train)}")
print(f"📊 Test samples  : {len(X_test)}\n")

# ─────────────────────────────────────────
# Train SVM
# ─────────────────────────────────────────

print("🤖 Training SVM with augmented data...\n")

model = SVC(
    kernel='rbf',
    C=10,
    gamma='scale',
    probability=True,   # required by main.py /predict endpoint
    verbose=True
)
model.fit(X_train, y_train)

# ─────────────────────────────────────────
# Evaluate
# ─────────────────────────────────────────

print("\n📈 Evaluating model...\n")
y_pred   = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print(f"✅ Accuracy: {accuracy * 100:.2f}%\n")
print("📋 Classification Report:")
print(classification_report(y_test, y_pred, target_names=le.classes_))

# ─────────────────────────────────────────
# Save — compatible with main.py
# ─────────────────────────────────────────

os.makedirs("./models", exist_ok=True)
joblib.dump(model, "./models/fsl_svm.pkl")
joblib.dump(le,    "./models/fsl_labels.pkl")

print("✅ Model saved to ./models/fsl_svm.pkl")
print("✅ Labels saved to ./models/fsl_labels.pkl")
