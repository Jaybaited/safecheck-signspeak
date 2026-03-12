from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import joblib
import os

app = FastAPI(title="SafeCheck FSL Inference API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

MODEL_PATH  = "./models/fsl_svm.pkl"
LABELS_PATH = "./models/fsl_labels.pkl"

model = None
le    = None

@app.on_event("startup")
def load_model():
    global model, le
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        le    = joblib.load(LABELS_PATH)
        print(f"✅ Model loaded — {len(le.classes_)} classes: {list(le.classes_)}")
    else:
        print("⚠️  No model found. Run train_model.py first.")

class LandmarkInput(BaseModel):
    landmarks: list[float]  # 63 floats (21 points × x, y, z)

@app.post("/predict")
def predict(data: LandmarkInput):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    if len(data.landmarks) != 63:
        raise HTTPException(status_code=400, detail=f"Expected 63 landmarks, got {len(data.landmarks)}")

    features   = np.array(data.landmarks).reshape(1, -1)
    prediction = model.predict(features)[0]
    proba      = model.predict_proba(features)[0]
    confidence = float(np.max(proba))
    sign       = le.inverse_transform([prediction])[0]

    return {
        "sign":       sign,
        "confidence": round(confidence, 4)
    }

@app.get("/health")
def health():
    return {
        "status":       "ok",
        "model_loaded": model is not None,
        "classes":      list(le.classes_) if le else []
    }
