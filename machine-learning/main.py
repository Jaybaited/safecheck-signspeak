from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import joblib
import os

from features import extract_features

app = FastAPI(title="SafeCheck FSL Inference API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "https://safecheck-signspeak.vercel.app/"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

MODEL_PATH       = "./models/fsl_svm.pkl"
LABELS_PATH      = "./models/fsl_labels.pkl"
NORM_MODEL_PATH  = "./models/fsl_svm_norm.pkl"
NORM_LABELS_PATH = "./models/fsl_labels_norm.pkl"

model = None
le    = None
use_norm = False


@app.on_event("startup")
def load_model():
    global model, le, use_norm
    # Default is the scale-proof model. Start with FSL_MODEL=raw to use the old model.
    wanted = os.environ.get("FSL_MODEL", "norm").lower()
    if wanted == "norm" and os.path.exists(NORM_MODEL_PATH) and os.path.exists(NORM_LABELS_PATH):
        model = joblib.load(NORM_MODEL_PATH)
        le    = joblib.load(NORM_LABELS_PATH)
        use_norm = True
        print("Model loaded (normalized) - %d classes: %s" % (len(le.classes_), list(le.classes_)))
    elif os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        le    = joblib.load(LABELS_PATH)
        use_norm = False
        print("Model loaded (current) - %d classes: %s" % (len(le.classes_), list(le.classes_)))
    else:
        print("No model found. Run train_model.py first.")


class LandmarkInput(BaseModel):
    landmarks: list[float]  # 63 floats (21 points x, y, z)


@app.post("/predict")
def predict(data: LandmarkInput):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    if len(data.landmarks) != 63:
        raise HTTPException(status_code=400, detail=f"Expected 63 landmarks, got {len(data.landmarks)}")

    raw = np.array(data.landmarks, dtype=np.float64)
    features   = (extract_features(raw) if use_norm else raw).reshape(1, -1)
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
        "variant":      "norm" if use_norm else "raw",
        "classes":      list(le.classes_) if le else []
    }