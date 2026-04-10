from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import joblib
import os
import base64
import cv2
import mediapipe as mp

app = FastAPI(title="SafeCheck FSL Mobile Inference API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

MODEL_PATH  = "./models/fsl_svm.pkl"
LABELS_PATH = "./models/fsl_labels.pkl"

model = None
le    = None

mp_hands = mp.solutions.hands
hands    = mp_hands.Hands(
    static_image_mode=True,
    max_num_hands=1,
    min_detection_confidence=0.5
)

@app.on_event("startup")
def load_model():
    global model, le
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        le    = joblib.load(LABELS_PATH)
        print(f"✅ Mobile Model loaded — {len(le.classes_)} classes: {list(le.classes_)}")
    else:
        print("⚠️  No model found. Run train_model.py first.")

class ImageInput(BaseModel):
    image: str  # base64 encoded image

@app.post("/predict-image")
def predict_image(data: ImageInput):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    try:
        img_bytes = base64.b64decode(data.image)
        img_array = np.frombuffer(img_bytes, dtype=np.uint8)
        frame     = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

        if frame is None:
            raise HTTPException(status_code=400, detail="Invalid image")

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results   = hands.process(rgb_frame)

        if not results.multi_hand_landmarks:
            return {"sign": None, "confidence": 0, "detected": False, "message": "No hand detected"}

        hand_landmarks = results.multi_hand_landmarks[0]
        landmarks = []
        for lm in hand_landmarks.landmark:
            landmarks.extend([lm.x, lm.y, lm.z])

        features   = np.array(landmarks).reshape(1, -1)
        prediction = model.predict(features)[0]
        proba      = model.predict_proba(features)[0]
        confidence = float(np.max(proba))
        sign       = le.inverse_transform([prediction])[0]

        return {"sign": sign, "confidence": round(confidence, 4), "detected": True, "message": "Hand detected"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health():
    return {
        "status":       "ok",
        "model_loaded": model is not None,
        "classes":      list(le.classes_) if le else []
    }
