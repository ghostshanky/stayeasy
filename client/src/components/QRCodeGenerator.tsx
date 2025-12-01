import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRCodeGeneratorProps {
  upiId: string;
  amount: number;
  note?: string;
  size?: number;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  upiId,
  amount,
  note = 'StayEasy Payment',
  size = 200
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const generateQR = async () => {
      if (!canvasRef.current) return;

      // Create UPI payment URL
      const upiUrl = `upi://pay?pa=${upiId}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;

      try {
        await QRCode.toCanvas(canvasRef.current, upiUrl, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    generateQR();
  }, [upiId, amount, note, size]);

  return (
    <div className="flex flex-col items-center space-y-4">
      <canvas
        ref={canvasRef}
        className="border border-gray-300 rounded-lg"
      />
      <div className="text-center">
        <p className="text-sm text-gray-600">Scan QR code to pay</p>
        <p className="text-xs text-gray-500 mt-1">
          Amount: ₹{amount.toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
