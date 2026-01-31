import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface QRCodeGeneratorProps {
  restaurantSlug: string;
  tableNumber?: number;
  restaurantName: string;
  className?: string;
}

export function QRCodeGenerator({
  restaurantSlug,
  tableNumber,
  restaurantName,
  className
}: QRCodeGeneratorProps) {
  const [copied, setCopied] = useState(false);
  
  const baseUrl = window.location.origin;
  const menuUrl = tableNumber 
    ? `${baseUrl}/r/${restaurantSlug}?t=${tableNumber}`
    : `${baseUrl}/r/${restaurantSlug}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(menuUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const svg = document.getElementById(`qr-${restaurantSlug}-${tableNumber || 'main'}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = 512;
      canvas.height = 512;
      if (ctx) {
        ctx.fillStyle = '#0d0f14';
        ctx.fillRect(0, 0, 512, 512);
        ctx.drawImage(img, 56, 56, 400, 400);
      }
      
      const link = document.createElement('a');
      link.download = `qr-${restaurantSlug}${tableNumber ? `-table-${tableNumber}` : ''}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <Card variant="glass" className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">
          {tableNumber ? `Table ${tableNumber}` : restaurantName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-foreground p-4 rounded-xl flex items-center justify-center">
          <QRCodeSVG
            id={`qr-${restaurantSlug}-${tableNumber || 'main'}`}
            value={menuUrl}
            size={180}
            bgColor="#f5f0e8"
            fgColor="#0d0f14"
            level="H"
            includeMargin={false}
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1" />
                Copy URL
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4 mr-1" />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
