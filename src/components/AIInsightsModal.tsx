import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface AIInsightsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AIInsightsModal = ({ open, onOpenChange }: AIInsightsModalProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<string>("");

  const generateInsights = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      // Load user data
      const [profileData, goalsData, statsData] = await Promise.all([
        supabase.from("profiles").select("user_story").eq("id", user.id).single(),
        supabase.from("goals").select("*").eq("user_id", user.id),
        supabase.from("user_stats").select("*").eq("user_id", user.id).single(),
      ]);

      const totalGoals = goalsData.data?.length || 0;
      const completedGoals = goalsData.data?.filter((g) => g.is_completed).length || 0;
      const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

      // Call AI insights function
      const { data, error } = await supabase.functions.invoke('ai-insights', {
        body: {
          goals: goalsData.data || [],
          completionRate,
          currentStreak: statsData.data?.current_streak || 0,
          userStory: profileData.data?.user_story || '',
        },
      });

      if (error) throw error;

      setInsights(data.analysis);
    } catch (error: any) {
      console.error('Error generating insights:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: t('aiInsights.generate'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (isOpen && !insights) {
      generateInsights();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto animate-scale-in">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
            Análisis de Progreso con IA
          </DialogTitle>
          <DialogDescription>
            Insights personalizados basados en tus metas y progreso
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
            <Loader2 className="w-12 h-12 text-primary animate-spin animate-pulse-glow mb-4" />
            <p className="text-muted-foreground animate-pulse">Analizando tu progreso...</p>
          </div>
        ) : insights ? (
          <Card className="animate-fade-in hover-lift">
            <CardContent className="pt-6">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{insights}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <Sparkles className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Genera un análisis personalizado de tu progreso
            </p>
            <Button onClick={generateInsights}>
              <Sparkles className="w-4 h-4 mr-2" />
              Generar Análisis
            </Button>
          </div>
        )}

        {insights && !loading && (
          <div className="flex justify-end animate-fade-in">
            <Button variant="outline" onClick={generateInsights} className="btn-interactive hover:scale-105">
              <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
              Generar Nuevo Análisis
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AIInsightsModal;