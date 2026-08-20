'use client';

import { useState, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, Trash2 } from 'lucide-react';

interface CropModalProps {
  open: boolean;
  onClose: () => void;
  image: string;
  onCropComplete: (croppedBlob: Blob) => void;
}

export function CropModal({ open, onClose, image, onCropComplete }: CropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const onCropCompleteHandler = useCallback((_: any, croppedPixels: any) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const getCroppedBlob = async (): Promise<Blob | null> => {
    if (!croppedAreaPixels) return null;
    const img = new Image();
    img.src = image;
    await new Promise((resolve) => { img.onload = resolve; });
    const canvas = document.createElement('canvas');
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;
    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(
      img,
      croppedAreaPixels.x * scaleX,
      croppedAreaPixels.y * scaleY,
      croppedAreaPixels.width * scaleX,
      croppedAreaPixels.height * scaleY,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    );
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 0.9));
  };

  const handleSave = async () => {
    setLoading(true);
    const blob = await getCroppedBlob();
    setLoading(false);
    if (blob) onCropComplete(blob);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg border-border">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Upload className="w-4 h-4 text-amber-700" /> Crop Photo
          </DialogTitle>
          <DialogDescription className="text-xs">Drag to position and use the slider to zoom</DialogDescription>
        </DialogHeader>

        <div className="relative h-72 w-full rounded-xl overflow-hidden bg-zinc-900">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropCompleteHandler}
            cropShape="round"
            showGrid={false}
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground flex-shrink-0">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-amber-700"
          />
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={loading} className="bg-amber-800 hover:bg-amber-900 text-white font-medium gap-1.5">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {loading ? 'Processing...' : 'Apply Crop'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
