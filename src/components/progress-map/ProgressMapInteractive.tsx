import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import LevelNode from "./LevelNode";
import ConnectionPath from "./ConnectionPath";
import LevelModal from "./LevelModal";
import { getNodePositions, getLevelTitle, calculatePointsForLevel, getSectionName } from "./utils";

interface ProgressMapInteractiveProps {
  currentLevel: number;
  totalPoints: number;
  currentStreak: number;
}

interface LevelData {
  level: number;
  pointsRequired: number;
  title: string;
  isUnlocked: boolean;
  isCurrent: boolean;
}

const ProgressMapInteractive = ({ currentLevel, totalPoints, currentStreak }: ProgressMapInteractiveProps) => {
  const [aiRecommendation, setAiRecommendation] = useState<string>("");
  const [loadingRecommendation, setLoadingRecommendation] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  
  const totalLevels = 20;
  const positions = getNodePositions(totalLevels);

  // Generate level data
  const levels: LevelData[] = Array.from({ length: totalLevels }, (_, i) => {
    const level = i + 1;
    return {
      level,
      pointsRequired: calculatePointsForLevel(level),
      title: getLevelTitle(level),
      isUnlocked: level <= currentLevel,
      isCurrent: level === currentLevel,
    };
  });

  useEffect(() => {
    fetchAIRecommendation();
    // Scroll to current level after a short delay
    setTimeout(() => {
      scrollToCurrentLevel();
    }, 500);
  }, [currentLevel]);

  const scrollToCurrentLevel = () => {
    if (mapRef.current) {
      const currentPosition = positions[currentLevel - 1];
      const scrollTarget = currentPosition.y - 200; // Offset for better viewing
      mapRef.current.scrollTo({
        top: scrollTarget,
        behavior: 'smooth'
      });
    }
  };

  const fetchAIRecommendation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: habits } = await supabase
        .from("habits")
        .select("title, streak, completed_today")
        .eq("user_id", user.id);

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

  const mapHeight = positions[positions.length - 1].y + 200;

  return (
    <div className="space-y-6">
      {/* Section Banner */}
      <Card className="bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 border-primary/30">
        <CardContent className="p-4 flex items-center justify-center gap-3">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Nivel {currentLevel}</h2>
            <p className="text-sm text-muted-foreground">{getSectionName(currentLevel)}</p>
          </div>
        </CardContent>
      </Card>

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

      {/* Interactive Map */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div 
            ref={mapRef}
            className="relative bg-gradient-to-b from-background via-primary/5 to-background overflow-y-auto"
            style={{ height: '600px' }}
          >
            <div 
              className="relative w-full" 
              style={{ height: `${mapHeight}px` }}
            >
              {/* Connection Paths */}
              {positions.slice(0, -1).map((pos, index) => (
                <ConnectionPath
                  key={`path-${index}`}
                  from={pos}
                  to={positions[index + 1]}
                  isCompleted={levels[index].isUnlocked}
                />
              ))}

              {/* Level Nodes */}
              {levels.map((level, index) => (
                <LevelNode
                  key={level.level}
                  level={level.level}
                  position={positions[index]}
                  isUnlocked={level.isUnlocked}
                  isCurrent={level.isCurrent}
                  pointsRequired={level.pointsRequired}
                  title={level.title}
                  onClick={() => setSelectedLevel(level.level)}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Level Details Modal */}
      {selectedLevel && (
        <LevelModal
          isOpen={selectedLevel !== null}
          onClose={() => setSelectedLevel(null)}
          level={selectedLevel}
          totalPoints={totalPoints}
          isUnlocked={levels[selectedLevel - 1].isUnlocked}
          isCurrent={levels[selectedLevel - 1].isCurrent}
        />
      )}
    </div>
  );
};

export default ProgressMapInteractive;
