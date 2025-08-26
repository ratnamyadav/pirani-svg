"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { DraggableLines } from "./draggable-lines";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";

export function PiraniSVG() {
  const [code, setCode] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [size, setSize] = useState<"10oz" | "16oz" | "26oz">("10oz");

  const { data, error, isPending, mutate } = api.pirani.getPiraniData.useMutation();

  const handleGetImages = () => {
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      alert("Please enter a code");
      return;
    }
    console.log("trimmedCode", trimmedCode);
    mutate({ code: trimmedCode }, {
      onSuccess: (data) => {
        if (!data) {
          alert("No data found");
        } 

        if (data.previewUrl.includes('10oz')) {
          setSize('10oz');
        } else if (data.previewUrl.includes('16oz')) {
          setSize('16oz');
        } else if (data.previewUrl.includes('26oz')) {
          setSize('26oz');
        }
      }
    });
  };

  const handleDownloadSVG = async () => {
    if (!data || data === null) return;
    setIsDownloading(true);
    try {
      const response = await fetch(data.svgUrl);
      const svgBlob = await response.blob();
      
      const url = window.URL.createObjectURL(svgBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pirani-${data.sku}-${data.customizationValue}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setIsDownloading(false);
    } catch (err) {
      console.error("Failed to download SVG:", err);
    }
  };

  return (
    <div className="w-full mx-auto p-6 bg-white/10 rounded-xl backdrop-blur-sm">
      <h2 className="text-3xl font-bold text-center mb-6">Pirani SVG Downloader</h2>
      <div className="grid grid-cols-2 gap-4">
      <div>
        <h3 className="font-semibold mb-2">Preview Image:</h3>
        {data ? (
          <DraggableLines                
            size={size}
            imageUrl={data.previewUrl}
            alt={data.title}
            onHeightChange={(height) => console.log('Height:', height)}
            onBaselineChange={(y) => console.log('Baseline Y:', y)}
          />
        ) : (
          <div className="aspect-square w-full bg-white/10 rounded-lg flex items-center justify-center">
            <span className="text-white/60">Preview will appear here</span>
          </div>
        )}
      </div>
      <div className="space-y-4">
        <div>
          <label htmlFor="preselected-codes" className="block text-sm font-medium mb-2">
            Preselected Codes:
          </label>
          <select
            id="preselected-codes"
            className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          >
            <option value="">Select a code...</option>
            <option value="250808/-uImcw6d">250808/-uImcw6d 26oz</option>
            <option value="250815/fmwAgFYq">250815/fmwAgFYq 10oz</option>
            <option value="250825/Xslfyd1k">250825/Xslfyd1k 16oz</option>
          </select>
        </div>
        <div>
          <label htmlFor="code" className="block text-sm font-medium mb-2">
            Enter Code:
          </label>
          <input
            id="code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g., 250808/-uImcw6d"
            className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>
        
        <button
          onClick={handleGetImages}
          disabled={isPending}
          className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
        >
          {isPending ? "Loading..." : "Get Images/SVG"}
        </button>
        
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200">
            {error.message}
          </div>
        )}
        
        {data && (
          <div className="space-y-4 p-4 bg-white/5 rounded-lg">
            <div className="w-full">
                <label htmlFor="code" className="block text-sm font-medium mb-2">
                  Select Size:
                </label>
                <Select
                  value={size}
                  onValueChange={(value) => setSize(value as "10oz" | "16oz" | "26oz")}
                  
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Size" />
                  </SelectTrigger>
                  <SelectContent className="w-full">
                    <SelectItem value="10oz">10oz</SelectItem>
                    <SelectItem value="16oz">16oz</SelectItem>
                    <SelectItem value="26oz">26oz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <h3 className="font-semibold mb-2">SVG:</h3>
                {/* <div className="bg-white/10 p-4 rounded-lg border border-white/20">
                  <img
                    src={data.svgUrl}
                    alt="SVG Preview"
                    className="w-full h-auto"
                  />
                </div> */}
                <button
                  disabled={isDownloading}
                  onClick={handleDownloadSVG}
                  className="w-full mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
                >
                  {isDownloading ? "Downloading..." : "Download SVG"}
                </button>
              </div>
            </div>
            
            <div className="text-sm space-y-1">
              <p><strong>Product:</strong> {data.title}</p>
              <p><strong>Variant:</strong> {data.variantTitle}</p>
              <p><strong>SKU:</strong> {data.sku}</p>
              <p><strong>Customization:</strong> {data.customizationValue} ({data.customizationFont})</p>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
