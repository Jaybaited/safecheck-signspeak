export interface FSLPrediction {
  sign: string;
  confidence: number;
}

export interface FSLLesson {
  letter: string;
  description: string;
  tip: string;
}

export interface FSLProgress {
  id: string;
  studentId: string;
  signLabel: string;
  attempts: number;
  bestConfidence: number;
  completed: boolean;
  updatedAt: string;
}
