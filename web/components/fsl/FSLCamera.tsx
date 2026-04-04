'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { predictSign } from '@/lib/fsl/predict';
import type { FSLPrediction } from '@/types/fsl';

// MediaPipe types (avoids any)
interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

interface HandsResults {
  multiHandLandmarks?: HandLandmark[][];
}

interface MediaPipeCamera {
  start: () => Promise<void>;
  stop: () => void;
}

interface FSLCameraProps {
  targetLetter?: string;
  onCorrect?: (prediction: FSLPrediction) => void;
  isActive?: boolean;
}

export default function FSLCamera({ targetLetter, onCorrect, isActive = true }: FSLCameraProps) {
  const videoRef        = useRef<HTMLVideoElement>(null);
  const cameraRef       = useRef<MediaPipeCamera | null>(null);
  const lastPredictTime = useRef(0);

  const [prediction, setPrediction]   = useState<FSLPrediction | null>(null);
  const [handVisible, setHandVisible] = useState(false);
  const [isLoading, setIsLoading]     = useState(true);

  const isCorrect = !!(
    prediction &&
    targetLetter &&
    prediction.sign === targetLetter &&
    prediction.confidence >= 0.65
  );

  const onResults = useCallback(async (results: HandsResults) => {
    if (!results.multiHandLandmarks?.length) {
      setHandVisible(false);
      return;
    }
    setHandVisible(true);

    const now = Date.now();
    if (now - lastPredictTime.current < 500) return;
    lastPredictTime.current = now;

    const landmarks = results.multiHandLandmarks[0]
      .flatMap(({ x, y, z }) => [x, y, z]);

    try {
      const result = await predictSign(landmarks);
      setPrediction(result);
      if (targetLetter && result.sign === targetLetter && result.confidence >= 0.65) {
        onCorrect?.(result);
      }
    } catch (err) {
      console.error('FSL prediction error:', err);
    }
  }, [targetLetter, onCorrect]);

  useEffect(() => {
    if (!videoRef.current || !isActive) return;

    const initMediaPipe = async () => {
      const { Hands }  = await import('@mediapipe/hands');
      const { Camera } = await import('@mediapipe/camera_utils');

      const hands = new Hands({
        locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
      });

      hands.setOptions({
        maxNumHands:            1,
        modelComplexity:        1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence:  0.5,
      });

      hands.onResults(onResults);

      const camera = new Camera(videoRef.current!, {
        onFrame: async () => {
          if (videoRef.current) await hands.send({ image: videoRef.current });
        },
        width: 640,
        height: 480,
      }) as MediaPipeCamera;

      await camera.start();
      cameraRef.current = camera;
      setIsLoading(false);
    };

    initMediaPipe();

    return () => {
      cameraRef.current?.stop();
    };
  }, [isActive, onResults]);

  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Camera Feed */}
      <div className="relative rounded-2xl overflow-hidden bg-gray-900 aspect-video">
        <video
          ref={videoRef}
          className="w-full h-full object-cover scale-x-[-1]"
          autoPlay
          muted
          playsInline
        />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm">Loading camera...</p>
            </div>
          </div>
        )}

        {/* Hand Detection Indicator */}
        <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
          ${handVisible ? 'bg-green-500/80 text-white' : 'bg-gray-700/80 text-gray-300'}`}>
          <div className={`w-2 h-2 rounded-full ${handVisible ? 'bg-white animate-pulse' : 'bg-gray-400'}`} />
          {handVisible ? 'Hand Detected' : 'No Hand'}
        </div>

        {/* Target Letter Badge */}
        {targetLetter && (
          <div className="absolute top-3 left-3 bg-purple-600/80 text-white px-3 py-1 rounded-full text-sm font-bold">
            Sign: {targetLetter}
          </div>
        )}
      </div>

      {/* Prediction Result */}
      {prediction && (
        <div className={`mt-3 p-4 rounded-xl text-center transition-all border-2
          ${isCorrect ? 'bg-green-50 border-green-400' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl font-bold text-purple-600">
              {prediction.sign}
            </span>
            <div className="text-left">
              <p className="text-sm text-gray-500">Confidence</p>
              <p className={`text-lg font-semibold
                ${prediction.confidence >= 0.65 ? 'text-green-600' : 'text-orange-500'}`}>
                {(prediction.confidence * 100).toFixed(1)}%
              </p>
            </div>
            {isCorrect && <span className="text-3xl">✅</span>}
          </div>
          {targetLetter && !isCorrect && (
            <p className="text-xs text-gray-400 mt-2">
              Keep trying! Target:{' '}
              <span className="font-bold text-purple-500">{targetLetter}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
