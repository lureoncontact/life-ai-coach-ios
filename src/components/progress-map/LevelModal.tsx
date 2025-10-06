import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { getLevelIcon, getLevelTitle, calculatePointsForLevel } from "./utils";
import { Trophy, Target, Star } from "lucide-react";

interface LevelModalProps {
  isOpen: boolean;
  onClose: () => void;
  level: number;
  totalPoints: number;
  isUnlocked: boolean;
  isCurrent: boolean;
}

const LevelModal = ({
  isOpen,
  onClose,
  level,
  totalPoints,
  isUnlocked,
  isCurrent
}: LevelModalProps) => {
  const Icon = getLevelIcon(level);
  const title = getLevelTitle(level);
  const pointsRequired = calculatePointsForLevel(level);
  const nextLevelPoints = calculatePointsForLevel(level + 1);
  const currentLevelPoints = totalPoints - calculatePointsForLevel(level - 1);
  const pointsForNextLevel = nextLevelPoints - pointsRequired;
  const progress = isCurrent ? (currentLevelPoints / pointsForNextLevel) * 100 : isUnlocked ? 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Icon className="w-6 h-6 text-primary" />
            Nivel {level} - {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Status Badge */}
          <div className="flex justify-center">
            <Badge 
              variant={isCurrent ? "default" : isUnlocked ? "secondary" : "outline"}
              className="text-sm px-4 py-2"
            >
              {isCurrent ? "Nivel Actual" : isUnlocked ? "Completado" : "Bloqueado"}
            </Badge>
          </div>

          {/* Points Info */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Target className="w-4 h-4" />
                Puntos requeridos
              </span>
              <span className="font-bold">{pointsRequired}</span>
            </div>
            
            {isCurrent && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tus puntos actuales</span>
                  <span className="font-bold text-primary">{totalPoints}</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progreso al nivel {level + 1}</span>
                    <span className="font-semibold">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </>
            )}
          </div>

          {/* Rewards Section */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Recompensas desbloqueadas
            </h4>
            <div className="space-y-2">
              {[
                { icon: Star, text: "Acceso a nuevas integraciones", unlocked: level >= 3 },
                { icon: Trophy, text: "Estadísticas avanzadas", unlocked: level >= 5 },
                { icon: Target, text: "Focus Rooms ilimitadas", unlocked: level >= 10 }
              ].map((reward, i) => (
                <div 
                  key={i}
                  className={`flex items-center gap-3 p-2 rounded-lg ${
                    reward.unlocked && isUnlocked ? 'bg-primary/10' : 'opacity-50'
                  }`}
                >
                  <reward.icon className={`w-4 h-4 ${reward.unlocked && isUnlocked ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="text-sm">{reward.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Motivational Message */}
          {isCurrent && (
            <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-4">
              <p className="text-sm text-center">
                ¡Sigue así! Solo necesitas <span className="font-bold text-primary">{nextLevelPoints - totalPoints}</span> puntos más para alcanzar el nivel {level + 1}.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LevelModal;
