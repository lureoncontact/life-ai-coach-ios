import { NodePosition } from "./utils";

interface ConnectionPathProps {
  from: NodePosition;
  to: NodePosition;
  isCompleted: boolean;
}

const ConnectionPath = ({ from, to, isCompleted }: ConnectionPathProps) => {
  // Calculate control points for bezier curve
  const fromX = from.x;
  const fromY = from.y;
  const toX = to.x;
  const toY = to.y;
  
  // Control points for smooth S-curve
  const controlY = (fromY + toY) / 2;
  const controlX1 = fromX;
  const controlX2 = toX;
  
  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    >
      <defs>
        <linearGradient id={`gradient-${from.y}-${to.y}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={isCompleted ? "hsl(var(--primary))" : "hsl(var(--muted))"} stopOpacity="0.8" />
          <stop offset="100%" stopColor={isCompleted ? "hsl(var(--primary))" : "hsl(var(--muted))"} stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <path
        d={`M ${fromX}% ${fromY}px 
            C ${controlX1}% ${controlY}px, 
              ${controlX2}% ${controlY}px, 
              ${toX}% ${toY}px`}
        stroke={`url(#gradient-${from.y}-${to.y})`}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        className="transition-all duration-500"
      />
    </svg>
  );
};

export default ConnectionPath;
