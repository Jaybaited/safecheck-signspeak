import numpy as np
import joblib
import os
from sklearn.svm import SVC
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from sklearn.preprocessing import LabelEncoder

print("📂 Loading landmark data...\n")

data   = np.load("./data/landmarks.npy")
labels = np.load("./data/labels.npy")

print(f"   Samples : {len(data)}")
print(f"   Classes : {len(set(labels))}")
print(f"   Shape   : {data.shape}\n")

# Encode string labels (A,B,C...) to integers
le = LabelEncoder()
labels_encoded = le.fit_transform(labels)

# Split into train/test (80/20)
X_train, X_test, y_train, y_test = train_test_split(
    data, labels_encoded,
    test_size=0.2,
    random_state=42,
    stratify=labels_encoded
)

print(f"📊 Train samples : {len(X_train)}")
print(f"📊 Test samples  : {len(X_test)}\n")

# Train SVM
print("🤖 Training SVM model... (this may take 2–5 minutes)\n")
model = SVC(
    kernel='rbf',
    C=10,
    gamma='scale',
    probability=True,  # needed for confidence scores
    verbose=True
)
model.fit(X_train, y_train)

# Evaluate
print("\n📈 Evaluating model...\n")
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print(f"✅ Accuracy: {accuracy * 100:.2f}%\n")
print("📋 Classification Report:")
print(classification_report(y_test, y_pred, target_names=le.classes_))

# Save model + label encoder
os.makedirs("./models", exist_ok=True)
joblib.dump(model, "./models/fsl_svm.pkl")
joblib.dump(le,    "./models/fsl_labels.pkl")

print("\n✅ Model saved to ./models/fsl_svm.pkl")
print("✅ Labels saved to ./models/fsl_labels.pkl")
