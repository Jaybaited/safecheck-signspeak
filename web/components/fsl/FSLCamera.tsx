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
  onPrediction?: (prediction: FSLPrediction | null) => void;
  onHandVisible?: (visible: boolean) => void;
  isActive?: boolean;
}

const CONFIDENCE_THRESHOLD = 0.75;
const INSTANT_THRESHOLD    = 0.85;
const POLL_INTERVAL_MS     = 150;
const LOCK_DURATION_MS     = 800;
const MAX_MISS_TOLERANCE   = 2;

export default function FSLCamera({
  targetLetter,
  onCorrect,
  onPrediction,
  onHandVisible,
  isActive = true,
}: FSLCameraProps) {
  const videoRef        = useRef<HTMLVideoElement>(null);
  const cameraRef       = useRef<MediaPipeCamera | null>(null);
  const lastPredictTime = useRef(0);

  const onCorrectRef     = useRef(onCorrect);
  const onPredictionRef  = useRef(onPrediction);
  const onHandVisibleRef = useRef(onHandVisible);
  const targetLetterRef  = useRef(targetLetter);
  useEffect(() => { onCorrectRef.current     = onCorrect;     }, [onCorrect]);
  useEffect(() => { onPredictionRef.current  = onPrediction;  }, [onPrediction]);
  useEffect(() => { onHandVisibleRef.current = onHandVisible; }, [onHandVisible]);
  useEffect(() => { targetLetterRef.current  = targetLetter;  }, [targetLetter]);

  const lockStartTime = useRef<number | null>(null);
  const lockLetter    = useRef<string | null>(null);
  const firedRef      = useRef(false);
  const missCountRef  = useRef(0);

  const [handVisible,   setHandVisible]   = useState(false);
  const [isLoading,     setIsLoading]     = useState(true);
  const [lockProgress,  setLockProgress]  = useState(0);

  // Reset lock state on letter/active change
  useEffect(() => {
    lockStartTime.current = null;
    lockLetter.current    = null;
    firedRef.current      = false;
    missCountRef.current  = 0;
    setLockProgress(0);
    onPredictionRef.current?.(null);
  }, [targetLetter, isActive]);

  const onResults = useCallback(async (results: HandsResults) => {
    if (!results.multiHandLandmarks?.length) {
      setHandVisible(false);
      onHandVisibleRef.current?.(false);
      lockStartTime.current = null;
      lockLetter.current    = null;
      firedRef.current      = false;
      missCountRef.current  = 0;
      setLockProgress(0);
      onPredictionRef.current?.(null);
      return;
    }

    setHandVisible(true);
    onHandVisibleRef.current?.(true);

    const now = Date.now();
    if (now - lastPredictTime.current < POLL_INTERVAL_MS) return;
    lastPredictTime.current = now;

    const landmarks = results.multiHandLandmarks[0]
      .flatMap(({ x, y, z }) => [x, y, z]);

    const currentTarget  = targetLetterRef.current;
    const currentCorrect = onCorrectRef.current;

    try {
      const result = await predictSign(landmarks);
      onPredictionRef.current?.(result);

      const isMatch =
        currentTarget &&
        result.sign === currentTarget &&
        result.confidence >= CONFIDENCE_THRESHOLD;

      if (isMatch) {
        missCountRef.current = 0;

        // Instant fire on very high confidence
        if (result.confidence >= INSTANT_THRESHOLD && !firedRef.current) {
          firedRef.current = true;
          setLockProgress(100);
          currentCorrect?.(result);
          return;
        }

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
  }, []);

  // ── Camera init — guarded against race conditions ──
  useEffect(() => {
    if (!isActive) return;

    let stopped = false;

    const initMediaPipe = async () => {
      // Wait for videoRef to be attached to the DOM
      if (!videoRef.current) {
        await new Promise<void>((resolve) => {
          const interval = setInterval(() => {
            if (videoRef.current || stopped) {
              clearInterval(interval);
              resolve();
            }
          }, 50);
        });
      }

      if (stopped || !videoRef.current) return;

      const { Hands }  = await import('@mediapipe/hands');
      const { Camera } = await import('@mediapipe/camera_utils');

      if (stopped || !videoRef.current) return;

      const hands = new Hands({
        locateFile: (f: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${f}`,
      });

      hands.setOptions({
        maxNumHands:            1,
        modelComplexity:        1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence:  0.5,
      });

      hands.onResults(onResults);

      if (stopped || !videoRef.current) return;

      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current && !stopped) {
            await hands.send({ image: videoRef.current });
          }
        },
        width:  640,
        height: 480,
      }) as MediaPipeCamera;

      await camera.start();

      if (stopped) {
        camera.stop();
        return;
      }

      cameraRef.current = camera;
      setIsLoading(false);
    };

    initMediaPipe().catch((err) => {
      if (!stopped) console.error('FSLCamera init error:', err);
    });

    return () => {
      stopped = true;
      cameraRef.current?.stop();
      cameraRef.current = null;
      setIsLoading(true);
      setHandVisible(false);
      setLockProgress(0);
    };
  }, [isActive, onResults]);

  return (
    <div className="relative w-full h-full min-h-[480px] bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
        autoPlay
        muted
        playsInline
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-950">
          <div className="text-center text-white">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent
              rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-400">Initializing camera...</p>
          </div>
        </div>
      )}

      {/* Top bar — Sign badge LEFT, Hand indicator RIGHT */}
      <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between
        pointer-events-none">

        {/* Sign badge */}
        {targetLetter ? (
          <div className="bg-purple-600 text-white px-4 py-1.5 rounded-full text-sm
            font-bold shadow-lg">
            Sign: {targetLetter}
          </div>
        ) : <div />}

        {/* Hand indicator */}
        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold
          shadow-lg border-2 transition-all duration-300 ${
          handVisible
            ? 'bg-emerald-500 border-emerald-400 text-white'
            : 'bg-gray-800 border-gray-600 text-gray-300'
        }`}>
          <div className={`w-2 h-2 rounded-full shrink-0 ${
            handVisible ? 'bg-white animate-pulse' : 'bg-gray-500'
          }`} />
          {handVisible ? 'Hand Detected' : 'No Hand'}
        </div>
      </div>

      {/* Lock progress bar */}
      {lockProgress > 0 && lockProgress < 100 && (
        <div className="absolute bottom-0 left-0 right-0 z-30 h-1.5 bg-black/40">
          <div
            className="h-1.5 bg-emerald-400 transition-all duration-100"
            style={{ width: `${lockProgress}%` }}
          />
        </div>
      )}

      {/* Correct flash border */}
      {lockProgress === 100 && (
        <div className="absolute inset-0 z-30 border-4 border-emerald-400
          pointer-events-none rounded-lg" />
      )}
    </div>
  );
}