import numpy as np
import joblib
import os
from sklearn.svm import SVC
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import LabelEncoder

def flip_landmarks_horizontal(landmarks: np.ndarray) -> np.ndarray:
    """Mirror hand landmarks horizontally by flipping x = 1 - x."""
    flipped = landmarks.copy()
    # Every 3 values is (x, y, z) — only flip x (index 0, 3, 6, ...)
    flipped[0::3] = 1.0 - flipped[0::3]
    return flipped

print("📂 Loading original landmark data...")
data   = np.load("./data/landmarks.npy")
labels = np.load("./data/labels.npy")
print(f"   Original samples : {len(data)}")

# Create mirrored copies of every sample
mirrored_data   = np.array([flip_landmarks_horizontal(row) for row in data])
mirrored_labels = labels.copy()

# Combine original + mirrored
data_augmented   = np.vstack([data, mirrored_data])
labels_augmented = np.concatenate([labels, mirrored_labels])
print(f"   Augmented samples: {len(data_augmented)} (2x original)\n")

# Load custom samples if they exist
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
                custom_data.append(row)
                custom_labels.append(letter)
                # Also add mirrored version of custom samples
                custom_data.append(flip_landmarks_horizontal(row))
                custom_labels.append(letter)

    if custom_data:
        data_augmented   = np.vstack([data_augmented, np.array(custom_data)])
        labels_augmented = np.concatenate([labels_augmented, np.array(custom_labels)])
        print(f"✅ Added {len(custom_data)} custom samples (with mirrors)")

le             = LabelEncoder()
labels_encoded = le.fit_transform(labels_augmented)

X_train, X_test, y_train, y_test = train_test_split(
    data_augmented, labels_encoded,
    test_size=0.2,
    random_state=42,
    stratify=labels_encoded
)

print(f"📊 Train: {len(X_train)} | Test: {len(X_test)}\n")
print("🤖 Training SVM with augmented data...\n")

model = SVC(kernel='rbf', C=10, gamma='scale', probability=True)
model.fit(X_train, y_train)

y_pred   = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print(f"✅ New Accuracy: {accuracy * 100:.2f}%\n")
print(classification_report(y_test, y_pred, target_names=le.classes_))

os.makedirs("./models", exist_ok=True)
joblib.dump(model, "./models/fsl_svm.pkl")
joblib.dump(le,    "./models/fsl_labels.pkl")
print("✅ Augmented model saved!")
