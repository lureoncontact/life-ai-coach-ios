import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { X, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DailyTipCardProps {
  userName: string;
  currentStreak: number;
  totalPoints: number;
  level: number;
}

const DailyTipCard = ({ userName, currentStreak, totalPoints, level }: DailyTipCardProps) => {
  const [tip, setTip] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isClosed, setIsClosed] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const closedToday = localStorage.getItem(`tip-closed-${today}`);
    
    if (closedToday) {
      setIsClosed(true);
      setLoading(false);
      return;
    }

    const cachedTip = localStorage.getItem(`tip-${today}`);
    if (cachedTip) {
      setTip(cachedTip);
      setLoading(false);
      return;
    }

    generateDailyTip();
  }, []);

  const generateDailyTip = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Fallback to generic tip
        setTip(getGenericTip());
        return;
      }

      // Get user's habits
      const { data: habits } = await supabase
        .from("habits")
        .select("title, streak, completed_today")
        .eq("user_id", user.id)
        .order("streak", { ascending: false })
        .limit(5);

      // Get recent check-ins
      const { data: checkIns } = await supabase
        .from("daily_check_ins")
        .select("mood, notes")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);

      // Get focus rooms
      const { data: rooms } = await supabase
        .from("focus_rooms")
        .select("name, area_category")
        .eq("user_id", user.id);

      const { data, error } = await supabase.functions.invoke("daily-tip", {
        body: {
          userName,
          currentStreak,
          totalPoints,
          level,
          habits: habits || [],
          recentMoods: checkIns || [],
          focusRooms: rooms || []
        }
      });

      if (error) {
        console.error("Error from edge function:", error);
        setTip(getGenericTip());
        return;
      }

      if (data?.tip) {
        setTip(data.tip);
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem(`tip-${today}`, data.tip);
      } else {
        setTip(getGenericTip());
      }
    } catch (error: any) {
      console.error("Error generating tip:", error);
      // Always show a generic tip instead of error toast
      setTip(getGenericTip());
    } finally {
      setLoading(false);
    }
  };

  const getGenericTip = () => {
    const genericTips = [
      "Empieza el día con una meta pequeña y alcanzable. El momentum es tu mejor aliado.",
      "La constancia vence al talento. Haz una cosa bien hoy, aunque sea pequeña.",
      "Tu racha actual es tu compromiso contigo mismo. Protégela.",
      "Los hábitos se construyen con decisiones diarias. ¿Qué decides hoy?",
      "El progreso no siempre es visible. Confía en el proceso.",
      "Cada día es una oportunidad para ser 1% mejor que ayer.",
      "No rompas la cadena. Tu yo del futuro te lo agradecerá.",
      "La disciplina es elegir entre lo que quieres ahora y lo que quieres más."
    ];
    return genericTips[Math.floor(Math.random() * genericTips.length)];
  };

  const handleClose = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`tip-closed-${today}`, "true");
    setIsClosed(true);
  };

  if (isClosed || loading) return null;

  return (
    <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border-primary/20 animate-fade-in">
      <CardContent className="p-4 relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6 opacity-70 hover:opacity-100"
          onClick={handleClose}
        >
          <X className="w-4 h-4" />
        </Button>
        <div className="flex items-start gap-3 pr-8">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
            <Lightbulb className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-1">Tip del Día</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {tip || "Generando tu tip personalizado..."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyTipCard;
