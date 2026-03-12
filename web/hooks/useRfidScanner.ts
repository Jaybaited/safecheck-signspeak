import { useState, useCallback, useEffect, useRef } from 'react';

interface UseRfidScannerReturn {
  isScanning: boolean;
  scannedRfid: string | null;
  error: string | null;
  startScan: () => void;
  resetScan: () => void;
}

export function useRfidScanner(): UseRfidScannerReturn {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedRfid, setScannedRfid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bufferRef = useRef('');
const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
const scanTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);


  useEffect(() => {
    if (!isScanning) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Always block shortcuts while scanning
      event.preventDefault();
      event.stopPropagation();

      if (event.key === 'Enter') {
        if (bufferRef.current.length > 0) {
          setScannedRfid(bufferRef.current);
          setIsScanning(false);
          bufferRef.current = '';
          clearTimeout(timeoutRef.current);
          clearTimeout(scanTimeoutRef.current);
        }
        return;
      }

      // Only accept printable characters
      if (event.key.length === 1) {
        bufferRef.current += event.key;

        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          if (bufferRef.current.length > 0) {
            setScannedRfid(bufferRef.current);
            setIsScanning(false);
            bufferRef.current = '';
          }
        }, 100);
      }
    };

    // Use only keydown — NOT keypress (keypress is deprecated + causes duplicates)
    document.addEventListener('keydown', handleKeyDown);

    // 10 second scan timeout
    scanTimeoutRef.current = setTimeout(() => {
      setIsScanning(false);
      setError('Scan timeout - please try again');
      bufferRef.current = '';
    }, 10000);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeoutRef.current);
      clearTimeout(scanTimeoutRef.current);
    };
  }, [isScanning]);

  const startScan = useCallback(() => {
    bufferRef.current = '';
    setScannedRfid(null);
    setError(null);
    setIsScanning(true);
  }, []);

  const resetScan = useCallback(() => {
    setScannedRfid(null);
    setError(null);
    setIsScanning(false);
    bufferRef.current = '';
  }, []);

  return {
    isScanning,
    scannedRfid,
    error,
    startScan,
    resetScan,
  };
}
