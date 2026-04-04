import mediapipe as mp
import cv2
import tensorflow as tf
import sklearn
import numpy as np
import fastapi
import joblib

print(f"MediaPipe:    {mp.__version__}")
print(f"OpenCV:       {cv2.__version__}")
print(f"TensorFlow:   {tf.__version__}")
print(f"Scikit-learn: {sklearn.__version__}")
print(f"NumPy:        {np.__version__}")
print(f"FastAPI:      {fastapi.__version__}")
print(f"Joblib:       {joblib.__version__}")
print("\n✅ All packages verified — ready to build FSL!")
