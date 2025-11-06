import React from 'react';
import { AlertTriangle, Check } from 'lucide-react';

interface DimensionComparisonProps {
  actualDimensions: string; // e.g., "92\" x 4\" x 4\" (22.86 x 10.16 x 10.16 cm)"
  carrierDimensions: string; // e.g., "231.14 x 12.70 x 12.70 cm"
  productType?: string; // e.g., "Fishing Rod Tube"
}

interface ParsedDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in';
}

function parseDimensions(dimString: string): ParsedDimensions | null {
  // Try to parse dimensions like "92" x 4" x 4"" or "231.14 x 12.70 x 12.70 cm"
  const cmMatch = dimString.match(/([\d.]+)\s*x\s*([\d.]+)\s*x\s*([\d.]+)\s*cm/i);
  const inMatch = dimString.match(/([\d.]+)"\s*x\s*([\d.]+)"\s*x\s*([\d.]+)"/);
  
  if (cmMatch) {
    return {
      length: parseFloat(cmMatch[1]),
      width: parseFloat(cmMatch[2]),
      height: parseFloat(cmMatch[3]),
      unit: 'cm',
    };
  } else if (inMatch) {
    return {
      length: parseFloat(inMatch[1]),
      width: parseFloat(inMatch[2]),
      height: parseFloat(inMatch[3]),
      unit: 'in',
    };
  }
  
  return null;
}

function convertToInches(dim: ParsedDimensions): ParsedDimensions {
  if (dim.unit === 'in') return dim;
  
  return {
    length: dim.length / 2.54,
    width: dim.width / 2.54,
    height: dim.height / 2.54,
    unit: 'in',
  };
}

function calculateDiscrepancy(actual: ParsedDimensions, carrier: ParsedDimensions): {
  lengthDiff: number;
  widthDiff: number;
  heightDiff: number;
  percentDiff: number;
  hasDiscrepancy: boolean;
} {
  const actualIn = convertToInches(actual);
  const carrierIn = convertToInches(carrier);
  
  const lengthDiff = Math.abs(actualIn.length - carrierIn.length);
  const widthDiff = Math.abs(actualIn.width - carrierIn.width);
  const heightDiff = Math.abs(actualIn.height - carrierIn.height);
  
  const totalActual = actualIn.length + actualIn.width + actualIn.height;
  const totalCarrier = carrierIn.length + carrierIn.width + carrierIn.height;
  const percentDiff = Math.abs(((totalCarrier - totalActual) / totalActual) * 100);
  
  return {
    lengthDiff,
    widthDiff,
    heightDiff,
    percentDiff,
    hasDiscrepancy: percentDiff > 5, // 5% threshold
  };
}

export default function DimensionComparison({
  actualDimensions,
  carrierDimensions,
  productType = 'Fishing Rod Tube',
}: DimensionComparisonProps) {
  const actual = parseDimensions(actualDimensions);
  const carrier = parseDimensions(carrierDimensions);

  if (!actual || !carrier) {
    return (
      <div className="text-sm text-gray-500">
        Unable to parse dimensions for comparison
      </div>
    );
  }

  const actualIn = convertToInches(actual);
  const carrierIn = convertToInches(carrier);
  const discrepancy = calculateDiscrepancy(actual, carrier);

  // Scale for visualization (normalize to fit in container)
  const maxDimension = Math.max(
    actualIn.length,
    actualIn.width,
    actualIn.height,
    carrierIn.length,
    carrierIn.width,
    carrierIn.height
  );
  
  const scale = 300 / maxDimension; // Scale to fit in 300px container

  return (
    <div className="space-y-6">
      {/* Discrepancy Alert */}
      {discrepancy.hasDiscrepancy ? (
        <div className="flex items-center gap-2 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          <div>
            <p className="font-semibold text-orange-900">Dimension Discrepancy Detected</p>
            <p className="text-sm text-orange-700">
              {discrepancy.percentDiff.toFixed(1)}% difference from actual dimensions
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
          <Check className="w-5 h-5 text-green-600" />
          <div>
            <p className="font-semibold text-green-900">Dimensions Match</p>
            <p className="text-sm text-green-700">
              Carrier dimensions are within acceptable range
            </p>
          </div>
        </div>
      )}

      {/* Visual Comparison */}
      <div className="grid grid-cols-2 gap-6">
        {/* Actual Dimensions - Tube Blueprint */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Actual Dimensions</h3>
          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 relative">
            {/* Blueprint Grid Background */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `
                  linear-gradient(0deg, #3B82F6 1px, transparent 1px),
                  linear-gradient(90deg, #3B82F6 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px',
              }}
            />
            
            {/* Tube Visualization (Cylindrical) */}
            <div className="relative flex flex-col items-center justify-center h-64">
              {/* Side View - Rectangle representing tube */}
              <div
                className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg shadow-lg relative border-2 border-blue-700"
                style={{
                  width: `${actualIn.length * scale}px`,
                  height: `${actualIn.width * scale}px`,
                  maxWidth: '280px',
                  maxHeight: '200px',
                }}
              >
                {/* Measurement Labels */}
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-mono text-blue-900 whitespace-nowrap">
                  {actualIn.length.toFixed(1)}"
                </div>
                <div className="absolute -right-8 top-1/2 transform -translate-y-1/2 text-xs font-mono text-blue-900 whitespace-nowrap rotate-90">
                  ⌀ {actualIn.width.toFixed(1)}"
                </div>
                
                {/* Product Label */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-white opacity-80">
                    {productType}
                  </span>
                </div>
              </div>
              
              {/* Dimension Details */}
              <div className="mt-4 text-xs text-gray-700 space-y-1">
                <div className="flex justify-between gap-4">
                  <span className="font-medium">Length:</span>
                  <span className="font-mono">{actualIn.length.toFixed(2)}"</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="font-medium">Diameter:</span>
                  <span className="font-mono">{actualIn.width.toFixed(2)}"</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Carrier Claimed Dimensions */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Carrier Claimed Dimensions</h3>
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 relative">
            {/* Blueprint Grid Background */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `
                  linear-gradient(0deg, #EF4444 1px, transparent 1px),
                  linear-gradient(90deg, #EF4444 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px',
              }}
            />
            
            {/* Box Visualization (Rectangular) */}
            <div className="relative flex flex-col items-center justify-center h-64">
              {/* 3D Box View */}
              <div className="relative" style={{ perspective: '600px' }}>
                <div
                  className="bg-gradient-to-br from-red-400 to-red-600 rounded-lg shadow-2xl relative border-2 border-red-700"
                  style={{
                    width: `${carrierIn.length * scale}px`,
                    height: `${carrierIn.width * scale}px`,
                    maxWidth: '280px',
                    maxHeight: '200px',
                    transform: 'rotateY(-15deg) rotateX(10deg)',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* Measurement Labels */}
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-mono text-red-900 whitespace-nowrap">
                    {carrierIn.length.toFixed(1)}"
                  </div>
                  <div className="absolute -right-8 top-1/2 transform -translate-y-1/2 text-xs font-mono text-red-900 whitespace-nowrap rotate-90">
                    {carrierIn.width.toFixed(1)}"
                  </div>
                  
                  {/* Warning Icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {discrepancy.hasDiscrepancy && (
                      <AlertTriangle className="w-8 h-8 text-white opacity-80" />
                    )}
                  </div>
                </div>
              </div>
              
              {/* Dimension Details */}
              <div className="mt-4 text-xs text-gray-700 space-y-1">
                <div className="flex justify-between gap-4">
                  <span className="font-medium">Length:</span>
                  <span className="font-mono">{carrierIn.length.toFixed(2)}"</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="font-medium">Width:</span>
                  <span className="font-mono">{carrierIn.width.toFixed(2)}"</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="font-medium">Height:</span>
                  <span className="font-mono">{carrierIn.height.toFixed(2)}"</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Discrepancy Breakdown */}
      {discrepancy.hasDiscrepancy && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Discrepancy Details</h4>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <p className="text-gray-600">Length Difference</p>
              <p className="font-mono text-lg font-bold text-orange-600">
                +{discrepancy.lengthDiff.toFixed(2)}"
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-600">Width Difference</p>
              <p className="font-mono text-lg font-bold text-orange-600">
                +{discrepancy.widthDiff.toFixed(2)}"
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-600">Total Variance</p>
              <p className="font-mono text-lg font-bold text-orange-600">
                {discrepancy.percentDiff.toFixed(1)}%
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-3">
            The carrier's claimed dimensions result in a significantly larger package size,
            leading to higher dimensional weight charges.
          </p>
        </div>
      )}
    </div>
  );
}
