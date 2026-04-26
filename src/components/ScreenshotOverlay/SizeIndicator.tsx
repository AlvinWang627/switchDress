// Size indicator showing real-time dimensions during selection

interface SizeIndicatorProps {
  width: number;
  height: number;
}

export function SizeIndicator({ width, height }: SizeIndicatorProps) {
  return (
    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/70 text-white px-3 py-1.5 rounded-md pointer-events-none select-none">
      <span className="font-mono text-sm whitespace-nowrap">
        {Math.round(width)} × {Math.round(height)}
      </span>
    </div>
  );
}

export default SizeIndicator;