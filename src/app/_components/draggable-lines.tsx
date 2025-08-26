"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";


interface DraggableLinesProps {
  size: '10oz' | '16oz' | '26oz';
  imageUrl: string;
  alt: string;
  onHeightChange?: (height: number) => void;
  onBaselineChange?: (y: number) => void;
}

export function DraggableLines({ 
  size,
  imageUrl, 
  alt, 
  onHeightChange, 
  onBaselineChange 
}: DraggableLinesProps) {
  const [isDraggingHeight, setIsDraggingHeight] = useState(false);
  const [isDraggingBaseline, setIsDraggingBaseline] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const topLineY = 58;
  const topLineYPX = {
    '10oz': 195,
    '16oz': 120,
    '26oz': 72,
  };
  const baselineYPX = {
    '10oz': 500,
    '16oz': 500,
    '26oz': 500,
  };
  const cupHeight = {
    '10oz': 94, // in mm 10oz
    '16oz': 110, // in mm 16oz
    '26oz': 130, // in mm 26oz
  };
  const cupHeightPX = {
    '10oz': 458,
    '16oz': 548,
    '26oz': 607,
  };
  // Get actual container height for calculations
  const [actualContainerHeight, setActualContainerHeight] = useState(0);

  const heightOfImagePX = 720;
  const [heightLineY, setHeightLineY] = useState(topLineYPX[size]);
  const [baselineY, setBaselineY] = useState(baselineYPX[size]);

  useEffect(() => {
    if (containerRef.current) {
      const updateHeight = () => {
        const height = containerRef.current?.getBoundingClientRect().height ?? 0;
        setActualContainerHeight(height);
        console.log('Actual container height:', height);
      };
      
      updateHeight();
      
      // Update height on window resize
      window.addEventListener('resize', updateHeight);
      return () => window.removeEventListener('resize', updateHeight);
    }
  }, []);

  const handleMouseDown = (lineType: 'height' | 'baseline') => {
    if (lineType === 'height') {
      setIsDraggingHeight(true);
    } else {
      setIsDraggingBaseline(true);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;

    if (isDraggingHeight) {
      const newHeightY = Math.max(0, Math.min(y, rect.height));
      setHeightLineY(newHeightY);
      const height = baselineY - newHeightY;
      onHeightChange?.(height);
    } else if (isDraggingBaseline) {
      const newBaselineY = Math.max(heightLineY, Math.min(y, rect.height));
      setBaselineY(newBaselineY);
      const height = newBaselineY - heightLineY;
      onHeightChange?.(height);
      onBaselineChange?.(newBaselineY);
    }
  };

  const handleMouseUp = () => {
    setIsDraggingHeight(false);
    setIsDraggingBaseline(false);
  };

  useEffect(() => {
    if (isDraggingHeight || isDraggingBaseline) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingHeight, isDraggingBaseline]);

  const height = baselineY - heightLineY;

  // Convert pixels to millimeters
  const pixelsToMm = (pixels: number) => {
    const cupHeightRatioToPX = cupHeightPX[size] / cupHeight[size]
    // Using the ratio: cupHeight mm / cupHeightPX px
    return (pixels) / (cupHeightRatioToPX / heightOfImagePX * actualContainerHeight);
  };

  // Convert baseline Y from image coordinates to millimeters
  const baselineYToMm = (baselineYPx: number) => {
    const cupHeightRatioToPX = cupHeightPX[size] / cupHeight[size]
    const heightOfImageRatio = actualContainerHeight / heightOfImagePX;
    const centerOfImageForYAxis = topLineYPX[size] * heightOfImageRatio + topLineY * cupHeightRatioToPX;
    // Calculate the distance from the center of the image
    const distanceFromCenter = baselineYPx - centerOfImageForYAxis / heightOfImagePX * actualContainerHeight;
    // Convert to millimeters
    return pixelsToMm(distanceFromCenter);
  };

  return (
    <div className="relative">
      <div 
        ref={containerRef}
        className="relative cursor-crosshair"
        style={{ userSelect: 'none' }}
      >
        <img
          src={imageUrl}
          alt={alt}
          className="w-full aspect-square rounded-lg border border-white/20"
        />
        
        {/* Height measurement line (top) */}
        <div
          className="absolute w-full"
          style={{ top: `${heightLineY - 8}px`, height: '16px', cursor: 'ns-resize' }}
          onMouseDown={() => handleMouseDown('height')}
        >
          <div
            className="w-full h-0.5 bg-red-500 pointer-events-none"
            style={{ position: 'absolute', top: '50%', left: 0, transform: 'translateY(-50%)' }}
          />
        </div>
        
        {/* Baseline measurement line (bottom) */}
        <div
          className="absolute w-full"
          style={{ top: `${baselineY - 8}px`, height: '16px', cursor: 'ns-resize' }}
          onMouseDown={() => handleMouseDown('baseline')}
        >
          <div
            className="w-full h-0.5 bg-red-500 pointer-events-none"
            style={{ position: 'absolute', top: '50%', left: 0, transform: 'translateY(-50%)' }}
          />
        </div>
        
        {/* Height measurement display */}
        <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
          Height: {Math.round(height)}px ({pixelsToMm(height).toFixed(1)}mm)
          <button
            type="button"
            title="Copy mm to clipboard"
            onClick={() => {
              void navigator.clipboard.writeText(pixelsToMm(height).toFixed(1));
              try {
                toast.success('Copied to clipboard');
              } catch {
                console.log('Copied to clipboard');
              }
            }}
            className="ml-2 inline-flex items-center px-1 py-0.5 rounded bg-white/10 hover:bg-white/20 transition-colors"
            style={{ verticalAlign: 'middle' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 20 20"
              className="inline-block"
            >
              <rect x="7" y="3" width="10" height="14" rx="2" fill="currentColor" className="text-white/80"/>
              <rect x="3" y="7" width="10" height="10" rx="2" fill="currentColor" className="text-white/40"/>
            </svg>
          </button>
        </div>
        
        {/* Baseline position display */}
        <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
          Center Y: {Math.round(baselineY - height / 2)}px ({baselineYToMm(baselineY - height / 2).toFixed(1)}mm)
          <button
            type="button"
            title="Copy mm to clipboard"
            onClick={() => {
              void navigator.clipboard.writeText(baselineYToMm(baselineY - height / 2).toFixed(1));
              try {
                toast.success('Copied to clipboard');
              } catch {
                console.log('Copied to clipboard');
              }
            }}
            className="ml-2 inline-flex items-center px-1 py-0.5 rounded bg-white/10 hover:bg-white/20 transition-colors"
            style={{ verticalAlign: 'middle' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 20 20"
              className="inline-block"
            >
              <rect x="7" y="3" width="10" height="14" rx="2" fill="currentColor" className="text-white/80"/>
              <rect x="3" y="7" width="10" height="10" rx="2" fill="currentColor" className="text-white/40"/>
            </svg>
          </button>
        </div>

        {/* Debug info - container height */}
        <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
          Container: {Math.round(actualContainerHeight)}px
        </div>

        {/* Debug info - container bottom mm */}
        <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
          Container bottom mm: {baselineYToMm(baselineY).toFixed(1)}mm
        </div>
      </div>
    </div>
  );
}
