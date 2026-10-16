'use client';

import { useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';

interface PhotoFieldProps {
  /** A new photo chosen in this form (a data URL), or null. */
  value: string | null;
  /** The saved photo (a short-lived signed link), if there is one. */
  currentUrl?: string | null;
  onChange: (dataUrl: string | null) => void;
}

const MAX_SIDE = 512;
const MAX_BYTES = 350 * 1024;

// Shrinks any picture to a small JPEG in the browser before it is uploaded.
function resizeToJpeg(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('This file is not a picture the browser can read. Please use a JPG or PNG.'));
      img.onload = () => {
        const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Could not process the picture.')); return; }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        let quality = 0.85;
        let out = canvas.toDataURL('image/jpeg', quality);
        while (out.length * 0.75 > MAX_BYTES && quality > 0.4) {
          quality -= 0.1;
          out = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(out);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function PhotoField({ value, currentUrl, onChange }: PhotoFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const shown = value ?? currentUrl ?? null;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith('image/')) { setError('Please choose a picture file.'); return; }
    if (file.size > 15 * 1024 * 1024) { setError('That picture is too large. Please choose one under 15 MB.'); return; }
    setBusy(true);
    try {
      onChange(await resizeToJpeg(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not use that picture.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <p className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
        Student photo <span className="normal-case font-normal text-gray-400">optional</span>
      </p>
      <div className="flex items-center gap-4">
        <div className="w-24 h-28 rounded-xl overflow-hidden bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 flex items-center justify-center shrink-0">
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt="Student" className="w-full h-full object-cover" />
          ) : (
            <Camera className="w-8 h-8 text-slate-300 dark:text-gray-600" />
          )}
        </div>
        <div className="min-w-0 space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            The guard sees this photo when the card is tapped. Use a clear picture of the face with a plain background.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#7B1113] hover:bg-[#9B2020] text-white disabled:opacity-50"
            >
              {busy ? 'Preparing...' : shown ? 'Change photo' : 'Choose photo'}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => { onChange(null); setError(null); }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <X className="w-3 h-3" /> Undo
              </button>
            )}
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
    </div>
  );
}