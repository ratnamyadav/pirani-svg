"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";


interface DraggableLinesProps {
  imageUrl: string;
  alt: string;
  onHeightChange?: (height: number) => void;
  onBaselineChange?: (y: number) => void;
}

export function DraggableLines({ 
  imageUrl, 
  alt, 
  onHeightChange, 
  onBaselineChange 
}: DraggableLinesProps) {
  const [heightLineY, setHeightLineY] = useState(50);
  const [baselineY, setBaselineY] = useState(377);
  const [isDraggingHeight, setIsDraggingHeight] = useState(false);
  const [isDraggingBaseline, setIsDraggingBaseline] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const cupHeight = 94; // in mm
  const heightCupPX = 375;
  const heightOfImagePX = 592;
  const centerOfImageForYAxis = 377;

  console.log(heightOfImagePX);

  // Get actual container height for calculations
  const [actualContainerHeight, setActualContainerHeight] = useState(0);

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
    // Using the ratio: cupHeight mm / heightCupPX px
    return (pixels * cupHeight) / (heightCupPX / heightOfImagePX * actualContainerHeight);
  };

  // Convert baseline Y from image coordinates to millimeters
  const baselineYToMm = (baselineYPx: number) => {
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
          className="w-full h-auto rounded-lg border border-white/20"
        />
        
        {/* Height measurement line (top) */}
        <div
          className="absolute w-full h-0.5 bg-red-500 cursor-ns-resize"
          style={{ top: `${heightLineY}px` }}
          onMouseDown={() => handleMouseDown('height')}
        />
        
        {/* Baseline measurement line (bottom) */}
        <div
          className="absolute w-full h-0.5 bg-red-500 cursor-ns-resize"
          style={{ top: `${baselineY}px` }}
          onMouseDown={() => handleMouseDown('baseline')}
        />
        
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
          Baseline Y: {Math.round(baselineY)}px ({baselineYToMm(baselineY).toFixed(1)}mm)
          <button
            type="button"
            title="Copy mm to clipboard"
            onClick={() => {
              void navigator.clipboard.writeText(baselineYToMm(baselineY).toFixed(1));
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
      </div>
    </div>
  );
}
