import os
import cv2
import numpy as np
import mediapipe as mp

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=True,
    max_num_hands=1,
    min_detection_confidence=0.5
)

DATASET_PATH = "./dataset/FSL_images"
data, labels = [], []
skipped = 0
total = 0

print("🔍 Starting landmark extraction...\n")

for label in sorted(os.listdir(DATASET_PATH)):
    folder = os.path.join(DATASET_PATH, label)
    if not os.path.isdir(folder):
        continue

    count = 0
    for img_file in os.listdir(folder):
        img = cv2.imread(os.path.join(folder, img_file))
        if img is None:
            skipped += 1
            continue

        result = hands.process(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))

        if result.multi_hand_landmarks:
            lm = result.multi_hand_landmarks[0].landmark
            row = np.array([[p.x, p.y, p.z] for p in lm]).flatten()
            data.append(row)
            labels.append(label)
            count += 1
        else:
            skipped += 1

        total += 1

    print(f"  ✅ {label}: {count} samples extracted")

os.makedirs("./data", exist_ok=True)
np.save("./data/landmarks.npy", np.array(data))
np.save("./data/labels.npy", np.array(labels))

print(f"\n📊 Summary:")
print(f"   Total images processed : {total}")
print(f"   Landmarks saved        : {len(data)}")
print(f"   Classes found          : {len(set(labels))}")
print(f"   Skipped (no hand found): {skipped}")
print(f"\n✅ Saved to ./data/landmarks.npy and ./data/labels.npy")
