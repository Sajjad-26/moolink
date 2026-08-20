'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { Download, Copy, Check, QrCode, ExternalLink } from 'lucide-react';

interface QRCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

export function QRCodeModal({
  open,
  onOpenChange,
  username,
  displayName,
  avatarUrl,
}: QRCodeModalProps) {
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const profileUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${username}`
    : `https://moolink.xyz/${username}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownloadPNG = () => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) return;

    const downloadCanvas = document.createElement('canvas');
    const size = canvas.width;
    downloadCanvas.width = size;
    downloadCanvas.height = size;
    const ctx = downloadCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(canvas, 0, 0);

    const link = document.createElement('a');
    link.download = `${username}-moolink-qr.png`;
    link.href = downloadCanvas.toDataURL('image/png');
    link.click();
  };

  const handleDownloadSVG = () => {
    const svg = canvasRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `${username}-moolink-qr.svg`;
    downloadLink.click();
    URL.revokeObjectURL(svgUrl);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 flex items-center justify-center mb-2">
            <QrCode className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-bold">
            {displayName || username}&apos;s QR Code
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Point any phone camera at this QR code to open your MooLink profile instantly.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center my-4 space-y-4">
          <div
            ref={canvasRef}
            className="p-5 bg-white rounded-2xl shadow-md border border-amber-200/60 flex items-center justify-center"
          >
            <QRCodeSVG
              value={profileUrl}
              size={220}
              bgColor="#FFFFFF"
              fgColor="#1C1917"
              level="H"
              imageSettings={
                avatarUrl
                  ? {
                      src: avatarUrl,
                      x: undefined,
                      y: undefined,
                      height: 44,
                      width: 44,
                      excavate: true,
                    }
                  : undefined
              }
            />

            {open && (
              <div className="hidden">
                <QRCodeCanvas
                  value={profileUrl}
                  size={512}
                  bgColor="#FFFFFF"
                  fgColor="#1C1917"
                  level="H"
                  imageSettings={
                    avatarUrl
                      ? {
                          src: avatarUrl,
                          x: undefined,
                          y: undefined,
                          height: 100,
                          width: 100,
                          excavate: true,
                        }
                      : undefined
                  }
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 bg-muted/60 px-3.5 py-1.5 rounded-full border border-border/60 text-xs text-muted-foreground max-w-full truncate">
            <span className="truncate font-mono">{profileUrl}</span>
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-700 hover:text-amber-800 flex-shrink-0"
              title="Open Link"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-2 text-xs font-semibold"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-600" /> Copied Link!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Copy Link
              </>
            )}
          </Button>

          <Button
            size="sm"
            onClick={handleDownloadPNG}
            className="gap-2 text-xs font-semibold bg-amber-800 hover:bg-amber-900 text-white"
          >
            <Download className="w-4 h-4" /> Download PNG
          </Button>
        </div>

        <div className="text-center mt-1">
          <button
            onClick={handleDownloadSVG}
            className="text-[11px] text-muted-foreground hover:text-foreground underline transition-colors"
          >
            Download SVG (for Designers)
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
