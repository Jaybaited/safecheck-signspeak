import type { FSLPrediction } from '@/types/fsl';

const FSL_API_URL = process.env.NEXT_PUBLIC_FSL_API_URL ?? 'http://localhost:8000';

function flipLandmarksHorizontal(landmarks: number[]): number[] {
  return landmarks.map((val, i) => (i % 3 === 0 ? 1 - val : val));
}

async function callPredict(landmarks: number[]): Promise<FSLPrediction> {
  const res = await fetch(`${FSL_API_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ landmarks }),
  });
  if (!res.ok) throw new Error('FSL prediction failed');
  return res.json();
}

export async function predictSign(landmarks: number[]): Promise<FSLPrediction> {
  const [original, mirrored] = await Promise.all([
    callPredict(landmarks),
    callPredict(flipLandmarksHorizontal(landmarks)),
  ]);
  return original.confidence >= mirrored.confidence ? original : mirrored;
}
