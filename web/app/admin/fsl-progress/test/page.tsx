'use client';
import FSLCamera from '@/components/fsl/FSLCamera';

export default function FSLTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-bold text-purple-600 text-center mb-2">
          FSL Recognition Test
        </h1>
        <p className="text-center text-gray-500 text-sm mb-6">
          Show your hand and sign the letter shown
        </p>
        <FSLCamera
          targetLetter="A"
          onCorrect={(result) => console.log('✅ Correct sign detected!', result)}
        />
      </div>
    </div>
  );
}

