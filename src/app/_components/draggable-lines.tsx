"use client";

import { useState, useRef, useEffect } from "react";

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
  const [baselineY, setBaselineY] = useState(200);
  const [isDraggingHeight, setIsDraggingHeight] = useState(false);
  const [isDraggingBaseline, setIsDraggingBaseline] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
          Height: {Math.round(height)}px
        </div>
        
        {/* Baseline position display */}
        <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
          Baseline Y: {Math.round(baselineY)}px
        </div>
      </div>
    </div>
  );
}
