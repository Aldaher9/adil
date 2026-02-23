import { Scanner } from '@yudiel/react-qr-scanner';
import { useState } from 'react';
import { X } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/40 p-2 rounded-full text-white backdrop-blur-sm transition-colors"
        >
          <X size={24} />
        </button>
        
        <div className="aspect-square relative bg-black">
            <Scanner
                onScan={(result) => {
                    if (result && result.length > 0) {
                        onScan(result[0].rawValue);
                    }
                }}
                onError={(error) => {
                    console.error(error);
                    setError("Camera access denied or error occurred.");
                }}
                components={{
                    onOff: true,
                    torch: true,
                    zoom: true,
                    finder: true,
                }}
                styles={{
                    container: { width: '100%', height: '100%' }
                }}
            />
        </div>
        
        <div className="p-6 text-center bg-white">
          <p className="text-gray-600 font-medium">Point camera at student QR code</p>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
}
