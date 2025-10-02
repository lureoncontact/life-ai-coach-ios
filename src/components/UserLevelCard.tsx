import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Flame } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface UserLevelCardProps {
  level: number;
  totalPoints: number;
  currentStreak: number;
  pointsToNextLevel: number;
}

const UserLevelCard = ({ level, totalPoints, currentStreak, pointsToNextLevel }: UserLevelCardProps) => {
  const currentLevelPoints = totalPoints % pointsToNextLevel;
  const progress = (currentLevelPoints / pointsToNextLevel) * 100;

  return (
    <Card className="hover-lift animate-fade-in bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Nivel */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/20 border border-primary rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Nivel</p>
              <p className="text-2xl font-bold text-primary">{level}</p>
            </div>
          </div>

          {/* Progreso a siguiente nivel */}
          <div className="flex-1 max-w-xs">
            <div className="flex items-center justify-end mb-1">
              <p className="text-xs font-medium">{currentLevelPoints}/{pointsToNextLevel}</p>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Racha */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-500/20 border border-orange-500 rounded-full flex items-center justify-center">
              <Flame className="w-6 h-6 text-orange-500 animate-bounce-subtle" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Racha</p>
              <p className="text-2xl font-bold text-orange-500">{currentStreak}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserLevelCard;
