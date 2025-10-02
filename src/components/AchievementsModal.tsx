import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Lock } from "lucide-react";
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

interface AchievementsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userAchievements: UserAchievement[];
}

const AchievementsModal = ({ open, onOpenChange, userAchievements }: AchievementsModalProps) => {
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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Logros
          </DialogTitle>
          <DialogDescription>
            Desbloquea logros completando metas y usando la app
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {allAchievements.map((achievement) => {
            const unlocked = isUnlocked(achievement.id);
            const unlockDate = getUnlockDate(achievement.id);

            return (
              <Card
                key={achievement.id}
                className={`p-4 ${unlocked ? "bg-primary/5 border-primary/20" : "opacity-60"}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`text-3xl ${
                      unlocked ? "grayscale-0" : "grayscale"
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
      </DialogContent>
    </Dialog>
  );
};

export default AchievementsModal;
