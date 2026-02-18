import { useState, useCallback, useEffect } from 'react';

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

  useEffect(() => {
    if (!isScanning) return;

    let buffer = '';
    let timeoutId: NodeJS.Timeout;

    const handleKeyPress = (event: KeyboardEvent) => {
      // Prevent default behavior to avoid typing in background
      if (isScanning) {
        event.preventDefault();
        event.stopPropagation();
      }

      // Check if Enter key (RFID readers usually end with Enter)
      if (event.key === 'Enter') {
        if (buffer.length > 0) {
          // Successfully scanned RFID
          setScannedRfid(buffer);
          setIsScanning(false);
          buffer = '';
        }
      } else if (event.key.length === 1) {
        // Add character to buffer (ignore special keys)
        buffer += event.key;
        
        // Reset timeout on each keypress
        clearTimeout(timeoutId);
        
        // Auto-finish scan if no more input for 100ms
        timeoutId = setTimeout(() => {
          if (buffer.length > 0) {
            setScannedRfid(buffer);
            setIsScanning(false);
            buffer = '';
          }
        }, 100);
      }
    };

    // Add keyboard event listener
    document.addEventListener('keypress', handleKeyPress);
    document.addEventListener('keydown', handleKeyPress);

    // Set scan timeout (10 seconds)
    const scanTimeout = setTimeout(() => {
      setIsScanning(false);
      setError('Scan timeout - please try again');
    }, 10000);

    // Cleanup
    return () => {
      document.removeEventListener('keypress', handleKeyPress);
      document.removeEventListener('keydown', handleKeyPress);
      clearTimeout(timeoutId);
      clearTimeout(scanTimeout);
    };
  }, [isScanning]);

  const startScan = useCallback(() => {
    setIsScanning(true);
    setError(null);
  }, []);

  const resetScan = useCallback(() => {
    setScannedRfid(null);
    setError(null);
    setIsScanning(false);
  }, []);

  return {
    isScanning,
    scannedRfid,
    error,
    startScan,
    resetScan,
  };
}
