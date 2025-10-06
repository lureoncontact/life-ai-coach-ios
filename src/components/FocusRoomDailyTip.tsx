import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FocusRoomDailyTipProps {
  roomId: string;
  roomName: string;
  roomCategory: string;
  goals: Array<{ title: string; is_completed: boolean; is_daily: boolean }>;
}

const FocusRoomDailyTip = ({ roomId, roomName, roomCategory, goals }: FocusRoomDailyTipProps) => {
  const [tip, setTip] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDailyTip();
  }, [roomId, goals.length]);

  const fetchDailyTip = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      // Get user stats
      const { data: stats } = await supabase
        .from("user_stats")
        .select("level, total_points, current_streak")
        .eq("user_id", user.id)
        .single();

      // Get recent check-ins for mood
      const { data: checkIns } = await supabase
        .from("daily_check_ins")
        .select("mood, notes")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);

      // Build context specific to this focus room
      const roomContext = {
        roomName,
        roomCategory,
        goals: goals.map(g => ({
          title: g.title,
          completed: g.is_completed,
          daily: g.is_daily
        })),
        completedGoals: goals.filter(g => g.is_completed).length,
        totalGoals: goals.length,
        incompleteGoals: goals.filter(g => !g.is_completed).map(g => g.title)
      };

      const { data, error } = await supabase.functions.invoke("room-daily-tip", {
        body: {
          userName: profile?.full_name || "Usuario",
          currentStreak: stats?.current_streak || 0,
          totalPoints: stats?.total_points || 0,
          level: stats?.level || 1,
          roomContext,
          recentMoods: checkIns || []
        }
      });

      if (error) throw error;

      if (data?.tip) {
        setTip(data.tip);
      } else {
        // Fallback tip if API fails
        setTip(getFallbackTip(roomCategory, goals));
      }
    } catch (error) {
      console.error("Error fetching daily tip:", error);
      setTip(getFallbackTip(roomCategory, goals));
    } finally {
      setLoading(false);
    }
  };

  const getFallbackTip = (category: string, goals: any[]) => {
    const categoryTips: Record<string, string[]> = {
      health: [
        "La constancia en el ejercicio es más importante que la intensidad. Muévete hoy, aunque sea poco.",
        "Tu cuerpo es tu hogar permanente. Cuídalo con pequeñas decisiones diarias."
      ],
      mental: [
        "Unos minutos de meditación pueden transformar tu día. ¿Por qué no empezar ahora?",
        "La paz mental no es la ausencia de problemas, sino la capacidad de lidiar con ellos."
      ],
      career: [
        "Cada pequeño logro te acerca a tu meta profesional. ¿Qué harás hoy para avanzar?",
        "El éxito profesional es la suma de pequeños esfuerzos repetidos día tras día."
      ],
      finance: [
        "Ahorrar no es privarse, es priorizar tu futuro sobre impulsos momentáneos.",
        "Cada peso ahorrado es un voto de confianza en tu futuro."
      ],
      relationships: [
        "Las relaciones se nutren de pequeños gestos consistentes, no de grandes eventos esporádicos.",
        "Escuchar activamente es el regalo más valioso que puedes dar a alguien."
      ],
      personal: [
        "El crecimiento personal no es un destino, es un viaje diario de pequeñas mejoras.",
        "Dedica tiempo a lo que amas. Es una inversión en tu felicidad."
      ]
    };

    const tips = categoryTips[category] || [
      "Cada día es una oportunidad para ser 1% mejor.",
      "El progreso no siempre es visible. Confía en el proceso."
    ];

    // If there are incomplete goals, give a targeted tip
    if (goals.length > 0 && goals.some(g => !g.is_completed)) {
      return `Enfócate en completar tus metas pendientes hoy. ${tips[0]}`;
    }

    return tips[Math.floor(Math.random() * tips.length)];
  };

  return (
    <Card className="bg-gradient-to-br from-accent/20 to-accent/5 border-accent/30 w-full">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-accent" />
          Consejo del Día
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Generando consejo...</span>
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-foreground/90">
            {tip}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default FocusRoomDailyTip;
