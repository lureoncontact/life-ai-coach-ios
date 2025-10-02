import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Flame, Star } from "lucide-react";
import { calculateLevel, getPointsForNextLevel } from "@/utils/gamification";

interface GamificationBadgeProps {
  totalPoints: number;
  level: number;
  currentStreak: number;
  compact?: boolean;
}

const GamificationBadge = ({ 
  totalPoints, 
  level, 
  currentStreak,
  compact = false 
}: GamificationBadgeProps) => {
  const pointsForNextLevel = getPointsForNextLevel(level);
  const currentLevelPoints = level > 1 ? getPointsForNextLevel(level - 1) : 0;
  const pointsInCurrentLevel = totalPoints - currentLevelPoints;
  const pointsNeededForLevel = pointsForNextLevel - currentLevelPoints;
  const progressPercent = (pointsInCurrentLevel / pointsNeededForLevel) * 100;

  if (compact) {
    return (
      <div className="flex items-center gap-2 bg-card px-3 py-2 rounded-lg border">
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-bold">Nv.{level}</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-1">
          <Trophy className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">{totalPoints}</span>
        </div>
        {currentStreak > 0 && (
          <>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-1">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium">{currentStreak}</span>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Star className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nivel</p>
              <p className="text-2xl font-bold">{level}</p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="text-center">
              <div className="flex items-center gap-1 justify-center mb-1">
                <Trophy className="w-4 h-4 text-primary" />
              </div>
              <p className="text-lg font-bold">{totalPoints}</p>
              <p className="text-xs text-muted-foreground">Puntos</p>
            </div>

            {currentStreak > 0 && (
              <div className="text-center">
                <div className="flex items-center gap-1 justify-center mb-1">
                  <Flame className="w-4 h-4 text-orange-500" />
                </div>
                <p className="text-lg font-bold">{currentStreak}</p>
                <p className="text-xs text-muted-foreground">Racha</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progreso al Nivel {level + 1}</span>
            <span className="font-medium">{pointsInCurrentLevel} / {pointsNeededForLevel}</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </div>
    </Card>
  );
};

export default GamificationBadge;
