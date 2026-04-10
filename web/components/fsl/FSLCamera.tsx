'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { predictSign } from '@/lib/fsl/predict';
import type { FSLPrediction } from '@/types/fsl';

interface HandLandmark { x: number; y: number; z: number; }
interface HandsResults { multiHandLandmarks?: HandLandmark[][]; }
interface MediaPipeCamera { start: () => Promise<void>; stop: () => void; }

interface FSLCameraProps {
  targetLetter?: string;
  onCorrect?: (prediction: FSLPrediction) => void;
  isActive?: boolean;
}

// ─── Tuning constants ───────────────────────────────────────────
const CONFIDENCE_THRESHOLD = 0.75;  // minimum to count as a match
const INSTANT_THRESHOLD    = 0.85;  // fires immediately, no lock needed
const POLL_INTERVAL_MS     = 150;   // how often to poll MediaPipe (ms)
const LOCK_DURATION_MS     = 800;   // hold duration for 75–85% confidence
const MAX_MISS_TOLERANCE   = 2;     // bad frames allowed before lock resets
// ────────────────────────────────────────────────────────────────

export default function FSLCamera({ targetLetter, onCorrect, isActive = true }: FSLCameraProps) {
  const videoRef        = useRef<HTMLVideoElement>(null);
  const cameraRef       = useRef<MediaPipeCamera | null>(null);
  const lastPredictTime = useRef(0);

  // ── Stable refs — prevents MediaPipe from restarting on parent re-renders ──
  const onCorrectRef    = useRef(onCorrect);
  const targetLetterRef = useRef(targetLetter);
  useEffect(() => { onCorrectRef.current    = onCorrect;     }, [onCorrect]);
  useEffect(() => { targetLetterRef.current = targetLetter;  }, [targetLetter]);
  // ──────────────────────────────────────────────────────────────────────────

  // Lock tracking (only used for 75–85% range)
  const lockStartTime = useRef<number | null>(null);
  const lockLetter    = useRef<string | null>(null);
  const firedRef      = useRef(false);
  const missCountRef  = useRef(0);

  const [prediction, setPrediction]     = useState<FSLPrediction | null>(null);
  const [handVisible, setHandVisible]   = useState(false);
  const [isLoading, setIsLoading]       = useState(true);
  const [lockProgress, setLockProgress] = useState(0);

  const isCorrect = !!(
    prediction &&
    targetLetter &&
    prediction.sign === targetLetter &&
    prediction.confidence >= CONFIDENCE_THRESHOLD
  );

  // Reset lock when target letter changes
  useEffect(() => {
    lockStartTime.current = null;
    lockLetter.current    = null;
    firedRef.current      = false;
    missCountRef.current  = 0;
    setLockProgress(0);
  }, [targetLetter]);

  // Stable callback — reads props via refs, never recreated
  const onResults = useCallback(async (results: HandsResults) => {
    if (!results.multiHandLandmarks?.length) {
      setHandVisible(false);
      lockStartTime.current = null;
      lockLetter.current    = null;
      firedRef.current      = false;
      missCountRef.current  = 0;
      setLockProgress(0);
      return;
    }
    setHandVisible(true);

    const now = Date.now();
    if (now - lastPredictTime.current < POLL_INTERVAL_MS) return;
    lastPredictTime.current = now;

    const landmarks = results.multiHandLandmarks[0]
      .flatMap(({ x, y, z }) => [x, y, z]);

    const currentTarget  = targetLetterRef.current;
    const currentCorrect = onCorrectRef.current;

    try {
      const result = await predictSign(landmarks);
      setPrediction(result);

      const isMatch = currentTarget &&
        result.sign === currentTarget &&
        result.confidence >= CONFIDENCE_THRESHOLD;

      if (isMatch) {
        missCountRef.current = 0;

        // ── Instant recognition for high confidence ──
        if (result.confidence >= INSTANT_THRESHOLD && !firedRef.current) {
          firedRef.current = true;
          setLockProgress(100);
          currentCorrect?.(result);
          return;
        }

        // ── Lock/hold for 75–85% confidence range ──
        if (lockLetter.current !== currentTarget) {
          lockStartTime.current = now;
          lockLetter.current    = currentTarget!;
          firedRef.current      = false;
        }

        const elapsed  = now - (lockStartTime.current ?? now);
        const progress = Math.min((elapsed / LOCK_DURATION_MS) * 100, 100);
        setLockProgress(progress);

        if (elapsed >= LOCK_DURATION_MS && !firedRef.current) {
          firedRef.current = true;
          setLockProgress(100);
          currentCorrect?.(result);
        }
      } else {
        missCountRef.current += 1;
        if (missCountRef.current >= MAX_MISS_TOLERANCE) {
          lockStartTime.current = null;
          lockLetter.current    = null;
          firedRef.current      = false;
          missCountRef.current  = 0;
          setLockProgress(0);
        }
      }
    } catch (err) {
      console.error('FSL prediction error:', err);
    }
  }, []); // ← empty deps — stable forever, reads props via refs

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
    return () => { cameraRef.current?.stop(); };
  }, [isActive, onResults]); // onResults is stable — runs only once

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

        {/* Lock Progress Bar — only shown for 75–85% range */}
        {lockProgress > 0 && lockProgress < 100 && (
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-black/30">
            <div
              className="h-2 bg-green-400 transition-all duration-150"
              style={{ width: `${lockProgress}%` }}
            />
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
                ${prediction.confidence >= CONFIDENCE_THRESHOLD ? 'text-green-600' : 'text-orange-500'}`}>
                {(prediction.confidence * 100).toFixed(1)}%
              </p>
            </div>
            {isCorrect && lockProgress === 100 && <span className="text-3xl">✅</span>}
          </div>

          {/* Hold it — only shown for 75–85% range */}
          {isCorrect && lockProgress > 0 && lockProgress < 100 && (
            <p className="text-xs text-green-600 mt-2 font-medium animate-pulse">
              Hold it... {Math.round(lockProgress)}%
            </p>
          )}

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