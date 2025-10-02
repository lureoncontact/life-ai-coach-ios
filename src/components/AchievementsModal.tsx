import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Lock, TrendingUp, Flame, Award } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points_reward: number;
  requirement_type: string;
  requirement_value: number;
}

interface UserAchievement extends Achievement {
  unlocked_at?: string;
}

interface UserStats {
  total_points: number;
  level: number;
  current_streak: number;
  longest_streak: number;
}

interface AchievementsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userAchievements: UserAchievement[];
  userStats?: UserStats;
}

const AchievementsModal = ({ open, onOpenChange, userAchievements, userStats }: AchievementsModalProps) => {
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    if (open) {
      loadAllAchievements();
    }
  }, [open]);

  const loadAllAchievements = async () => {
    const { data } = await supabase
      .from("achievements")
      .select("*")
      .order("points_reward", { ascending: true });

    if (data) {
      setAllAchievements(data);
    }
  };

  const isUnlocked = (achievementId: string) => {
    return userAchievements.some(ua => ua.id === achievementId);
  };

  const getUnlockDate = (achievementId: string) => {
    const achievement = userAchievements.find(ua => ua.id === achievementId);
    return achievement?.unlocked_at;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto animate-scale-in">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary animate-pulse" />
            Logros y Estadísticas
          </DialogTitle>
          <DialogDescription>
            Tu progreso, logros y estadísticas
          </DialogDescription>
        </DialogHeader>

        {/* User Statistics Cards */}
        {userStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <Card className="hover-lift">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Nivel
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <p className="text-2xl font-bold text-primary">{userStats.level}</p>
              </CardContent>
            </Card>

            <Card className="hover-lift">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  Puntos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <p className="text-2xl font-bold text-primary">{userStats.total_points}</p>
              </CardContent>
            </Card>

            <Card className="hover-lift">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  Racha Actual
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <p className="text-2xl font-bold text-primary">{userStats.current_streak}</p>
              </CardContent>
            </Card>

            <Card className="hover-lift">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                  <Trophy className="w-3 h-3" />
                  Mayor Racha
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <p className="text-2xl font-bold text-primary">{userStats.longest_streak}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Achievements Section */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Logros Desbloqueados
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            {allAchievements.map((achievement, index) => {
            const unlocked = isUnlocked(achievement.id);
            const unlockDate = getUnlockDate(achievement.id);

            return (
              <Card
                key={achievement.id}
                className={`p-4 hover-lift stagger-item animate-fade-in ${
                  unlocked 
                    ? "bg-primary/5 border-primary/20 hover-glow" 
                    : "opacity-60"
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`text-3xl transition-all ${
                      unlocked ? "grayscale-0 animate-bounce-subtle" : "grayscale"
                    }`}
                  >
                    {achievement.icon}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold">{achievement.name}</h3>
                      {!unlocked && <Lock className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {achievement.description}
                    </p>
                    <div className="flex items-center justify-between pt-2">
                      <Badge variant={unlocked ? "default" : "secondary"} className="text-xs">
                        +{achievement.points_reward} puntos
                      </Badge>
                      {unlocked && unlockDate && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(unlockDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AchievementsModal;
