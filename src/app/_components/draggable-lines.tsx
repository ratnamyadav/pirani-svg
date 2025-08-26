"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";

// Constants moved to top for better maintainability
const CUP_SIZES = {
  '10oz': {
    topLineYPX: 195,
    baselineYPX: 500,
    cupHeight: 94, // in mm
    cupHeightPX: 458,
  },
  '16oz': {
    topLineYPX: 120,
    baselineYPX: 500,
    cupHeight: 110, // in mm
    cupHeightPX: 548,
  },
  '26oz': {
    topLineYPX: 72,
    baselineYPX: 500,
    cupHeight: 130, // in mm
    cupHeightPX: 607,
  },
} as const;

const TOP_LINE_Y = 58; // in mm
const HEIGHT_OF_IMAGE_PX = 720;

interface DraggableLinesProps {
  size: '10oz' | '16oz' | '26oz';
  imageUrl: string;
  alt: string;
  onHeightChange?: (height: number) => void;
  onBaselineChange?: (y: number) => void;
}

// Extracted calculation utilities
const useCupCalculations = (size: keyof typeof CUP_SIZES, actualContainerHeight: number) => {
  return useMemo(() => {
    const cupData = CUP_SIZES[size];
    const centerOfCupInPx = cupData.topLineYPX + TOP_LINE_Y * cupData.cupHeightPX / cupData.cupHeight;
    
    const pixelsToMm = (pixels: number) => {
      const cupHeightRatioToPX = cupData.cupHeightPX / cupData.cupHeight;
      return pixels / (cupHeightRatioToPX / HEIGHT_OF_IMAGE_PX * actualContainerHeight);
    };

    const baselineYToMm = (baselineYPx: number) => {
      const cupHeightRatioToPX = cupData.cupHeightPX / cupData.cupHeight;
      const heightOfImageRatio = actualContainerHeight / HEIGHT_OF_IMAGE_PX;
      const centerOfImageForYAxis = cupData.topLineYPX * heightOfImageRatio + TOP_LINE_Y * cupHeightRatioToPX;
      const distanceFromCenter = baselineYPx - centerOfImageForYAxis / HEIGHT_OF_IMAGE_PX * actualContainerHeight;
      return pixelsToMm(distanceFromCenter);
    };

    return {
      centerOfCupInPx,
      pixelsToMm,
      baselineYToMm,
      topLineYPX: cupData.topLineYPX,
    };
  }, [size, actualContainerHeight]);
};

// Extracted copy button component
const CopyButton = ({ 
  value, 
  label 
}: { 
  value: string; 
  label: string; 
}) => {
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success('Copied to clipboard');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, [value]);

  return (
    <button
      type="button"
      title={`Copy ${label} to clipboard`}
      onClick={handleCopy}
      className="ml-2 inline-flex items-center px-1 py-0.5 rounded bg-white/10 hover:bg-white/20 transition-colors"
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
  );
};

// Extracted measurement display component
const MeasurementDisplay = ({ 
  label, 
  pixelValue, 
  mmValue, 
  position 
}: { 
  label: string; 
  pixelValue: number; 
  mmValue: number; 
  position: 'top-2 right-2' | 'bottom-2 right-2' | 'top-2 left-2' | 'bottom-2 left-2'; 
}) => (
  <div className={`absolute ${position} bg-black/70 text-white px-2 py-1 rounded text-sm`}>
    {label}: {Math.round(pixelValue)}px ({mmValue.toFixed(1)}mm)
    <CopyButton value={mmValue.toFixed(1)} label="mm" />
  </div>
);

// Extracted draggable line component
const DraggableLine = ({ 
  y, 
  onMouseDown, 
  lineType 
}: { 
  y: number; 
  onMouseDown: () => void; 
  lineType: 'height' | 'baseline'; 
}) => (
  <div
    className="absolute w-full cursor-ns-resize"
    style={{ top: `${y - 8}px`, height: '16px' }}
    onMouseDown={onMouseDown}
  >
    <div
      className="w-full h-0.5 bg-red-500 pointer-events-none"
      style={{ position: 'absolute', top: '50%', left: 0, transform: 'translateY(-50%)' }}
    />
  </div>
);

export function DraggableLines({ 
  size,
  imageUrl, 
  alt, 
  onHeightChange, 
  onBaselineChange 
}: DraggableLinesProps) {
  const [isDraggingHeight, setIsDraggingHeight] = useState(false);
  const [isDraggingBaseline, setIsDraggingBaseline] = useState(false);
  const [actualContainerHeight, setActualContainerHeight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const { centerOfCupInPx, pixelsToMm, baselineYToMm, topLineYPX } = useCupCalculations(size, actualContainerHeight);

  const [heightLineY, setHeightLineY] = useState<number>(topLineYPX);
  const [baselineY, setBaselineY] = useState<number>(centerOfCupInPx);

  // Update container height on mount and resize
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const height = containerRef.current.getBoundingClientRect().height;
        setActualContainerHeight(height);
      }
    };
    
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Update initial positions when size changes
  useEffect(() => {
    setHeightLineY(topLineYPX);
    setBaselineY(centerOfCupInPx);
  }, [topLineYPX, centerOfCupInPx]);

  const handleMouseDown = useCallback((lineType: 'height' | 'baseline') => {
    if (lineType === 'height') {
      setIsDraggingHeight(true);
    } else {
      setIsDraggingBaseline(true);
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
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
  }, [isDraggingHeight, isDraggingBaseline, baselineY, heightLineY, onHeightChange, onBaselineChange]);

  const handleMouseUp = useCallback(() => {
    setIsDraggingHeight(false);
    setIsDraggingBaseline(false);
  }, []);

  // Mouse event listeners
  useEffect(() => {
    if (isDraggingHeight || isDraggingBaseline) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingHeight, isDraggingBaseline, handleMouseMove, handleMouseUp]);

  const height = baselineY - heightLineY;
  const centerY = baselineY - height / 2;

  return (
    <div className="relative">
      <div 
        ref={containerRef}
        className="relative cursor-crosshair select-none"
      >
        <img
          src={imageUrl}
          alt={alt}
          className="w-full aspect-square rounded-lg border border-white/20"
        />
        
        <DraggableLine 
          y={heightLineY} 
          onMouseDown={() => handleMouseDown('height')} 
          lineType="height"
        />
        
        <DraggableLine 
          y={baselineY} 
          onMouseDown={() => handleMouseDown('baseline')} 
          lineType="baseline"
        />
        
        <MeasurementDisplay
          label="Height"
          pixelValue={height}
          mmValue={pixelsToMm(height)}
          position="top-2 right-2"
        />
        
        <MeasurementDisplay
          label="Center Y"
          pixelValue={centerY}
          mmValue={baselineYToMm(centerY)}
          position="bottom-2 right-2"
        />

        <MeasurementDisplay
          label="Container"
          pixelValue={actualContainerHeight}
          mmValue={0}
          position="top-2 left-2"
        />

        {/* <MeasurementDisplay
          label="Container bottom mm"
          pixelValue={0}
          mmValue={baselineYToMm(baselineY)}
          position="bottom-2 left-2"
        /> */}
      </div>
    </div>
  );
}
