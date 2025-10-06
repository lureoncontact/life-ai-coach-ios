import { Lock, CheckCircle2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLevelIcon } from "./utils";
import { NodePosition } from "./utils";

interface LevelNodeProps {
  level: number;
  position: NodePosition;
  isUnlocked: boolean;
  isCurrent: boolean;
  pointsRequired: number;
  title: string;
  onClick?: () => void;
}

const LevelNode = ({
  level,
  position,
  isUnlocked,
  isCurrent,
  pointsRequired,
  title,
  onClick
}: LevelNodeProps) => {
  const Icon = getLevelIcon(level);
  
  return (
    <div
      className={cn(
        "absolute transition-all duration-300",
        isUnlocked && "cursor-pointer hover-scale",
        isCurrent && "animate-gentle-pulse"
      )}
      style={{
        left: `${position.x}%`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -50%)',
        animation: `fade-in 0.4s ease-out ${level * 0.05}s backwards`
      }}
      onClick={isUnlocked ? onClick : undefined}
    >
      {/* Decorative stars for current level */}
      {isCurrent && (
        <>
          <Star className="absolute -top-6 -left-6 w-4 h-4 text-primary animate-pulse" fill="currentColor" />
          <Star className="absolute -top-6 -right-6 w-3 h-3 text-accent animate-pulse" fill="currentColor" style={{ animationDelay: '0.2s' }} />
        </>
      )}
      
      {/* Main Node Circle */}
      <div
        className={cn(
          "relative w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center border-4 transition-all duration-300",
          isUnlocked
            ? "bg-gradient-to-br from-primary to-primary/80 border-primary shadow-2xl shadow-primary/50"
            : "bg-muted border-muted-foreground/30 opacity-60",
          isCurrent && "ring-4 ring-primary/40 scale-110",
          isUnlocked && "hover:scale-105 hover:shadow-3xl hover:shadow-primary/60"
        )}
      >
        {/* Inner glow for unlocked */}
        {isUnlocked && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
        )}
        
        {/* Icon/Content */}
        <div className="relative z-10">
          {isUnlocked ? (
            isCurrent ? (
              <div className="flex flex-col items-center">
                <Icon className="w-8 h-8 md:w-10 md:h-10 text-primary-foreground" />
                <span className="text-xs font-bold text-primary-foreground mt-1">{level}</span>
              </div>
            ) : (
              <CheckCircle2 className="w-10 h-10 md:w-12 md:h-12 text-primary-foreground" />
            )
          ) : (
            <Lock className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground" />
          )}
        </div>
      </div>
      
      {/* Level info badge */}
      {isUnlocked && (
        <div className={cn(
          "absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-center px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap",
          isCurrent 
            ? "bg-primary text-primary-foreground shadow-lg" 
            : "bg-background border text-foreground"
        )}>
          Nivel {level}
        </div>
      )}
    </div>
  );
};

export default LevelNode;
