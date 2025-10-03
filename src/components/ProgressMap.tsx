import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Lock, CheckCircle2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProgressMapProps {
  currentLevel: number;
  totalPoints: number;
  currentStreak: number;
}

interface LevelNode {
  level: number;
  pointsRequired: number;
  title: string;
  isUnlocked: boolean;
  isCurrent: boolean;
}

const ProgressMap = ({ currentLevel, totalPoints, currentStreak }: ProgressMapProps) => {
  const [aiRecommendation, setAiRecommendation] = useState<string>("");
  const [loadingRecommendation, setLoadingRecommendation] = useState(true);
  const { toast } = useToast();

  // Generate level nodes
  const levels: LevelNode[] = Array.from({ length: 20 }, (_, i) => {
    const level = i + 1;
    const pointsRequired = level * 100; // Simple formula
    return {
      level,
      pointsRequired,
      title: getLevelTitle(level),
      isUnlocked: level <= currentLevel,
      isCurrent: level === currentLevel,
    };
  });

  useEffect(() => {
    fetchAIRecommendation();
  }, [currentLevel]);

  const fetchAIRecommendation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user habits
      const { data: habits } = await supabase
        .from("habits")
        .select("title, streak, completed_today")
        .eq("user_id", user.id);

      // Get recent check-ins
      const { data: checkIns } = await supabase
        .from("daily_check_ins")
        .select("mood")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);

      const { data, error } = await supabase.functions.invoke("level-recommendations", {
        body: {
          currentLevel,
          totalPoints,
          currentStreak,
          habits: habits || [],
          recentMoods: checkIns || []
        }
      });

      if (error) throw error;

      if (data?.recommendation) {
        setAiRecommendation(data.recommendation);
      }
    } catch (error: any) {
      console.error("Error fetching recommendation:", error);
      setAiRecommendation("Sigue completando tus hábitos diarios y mantén tu racha para alcanzar el siguiente nivel.");
    } finally {
      setLoadingRecommendation(false);
    }
  };

  function getLevelTitle(level: number): string {
    if (level <= 5) return "Principiante";
    if (level <= 10) return "Comprometido";
    if (level <= 15) return "Dedicado";
    if (level <= 20) return "Maestro";
    return "Leyenda";
  }

  return (
    <div className="space-y-6">
      {/* AI Recommendation Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Recomendación para Nivel {currentLevel + 1}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">
            {loadingRecommendation ? "Generando recomendación..." : aiRecommendation}
          </p>
        </CardContent>
      </Card>

      {/* Progress Map */}
      <div className="relative">
        {/* Connection Lines */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-muted" 
          style={{ height: `${levels.length * 120}px` }}
        />

        {/* Level Nodes */}
        <div className="space-y-4">
          {levels.map((node, index) => (
            <div
              key={node.level}
              className={cn(
                "relative flex items-center gap-4 animate-fade-in",
                node.isCurrent && "scale-105"
              )}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Node Circle */}
              <div
                className={cn(
                  "relative z-10 w-16 h-16 rounded-full flex items-center justify-center border-4 transition-all",
                  node.isUnlocked
                    ? "bg-primary border-primary shadow-lg shadow-primary/50"
                    : "bg-muted border-muted-foreground/30",
                  node.isCurrent && "ring-4 ring-primary/30 animate-pulse"
                )}
              >
                {node.isUnlocked ? (
                  node.isCurrent ? (
                    <span className="text-xl font-bold text-primary-foreground">{node.level}</span>
                  ) : (
                    <CheckCircle2 className="w-8 h-8 text-primary-foreground" />
                  )
                ) : (
                  <Lock className="w-6 h-6 text-muted-foreground" />
                )}
              </div>

              {/* Level Info Card */}
              <Card
                className={cn(
                  "flex-1 transition-all",
                  node.isUnlocked ? "hover-lift" : "opacity-60",
                  node.isCurrent && "border-primary shadow-lg"
                )}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      Nivel {node.level}
                      {node.isCurrent && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                          Actual
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">{node.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {node.pointsRequired} puntos requeridos
                    </p>
                  </div>
                  {node.isCurrent && (
                    <ChevronRight className="w-5 h-5 text-primary animate-pulse" />
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProgressMap;
