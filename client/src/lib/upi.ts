import QRCode from 'qrcode';

export function buildUpiUri({ pa, pn, am, tn = "StayEasy payment", cu = "INR" }: {
  pa: string;
  pn: string;
  am: number;
  tn?: string;
  cu?: string;
}) {
  const params = new URLSearchParams({
    pa, pn, am: String(am), tn, cu
  });
  return `upi://pay?${params.toString()}`;
}

export async function generateUpiQrCode(upiUri: string): Promise<string> {
  try {
    // Generate QR code data URL
    const dataUrl = await QRCode.toDataURL(upiUri, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    return dataUrl;
  } catch (error) {
    throw new Error('Failed to generate QR code');
  }
}