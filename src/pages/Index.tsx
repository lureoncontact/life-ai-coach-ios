import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Check if profile is complete
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        navigate("/dashboard");
      } else {
        navigate("/onboarding");
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
      <div className="text-center space-y-8 p-8 animate-scale-in">
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center shadow-lg hover-glow animate-bounce-subtle">
            <span className="text-5xl">🎯</span>
          </div>
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <h1 className="mb-4 text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent animate-shimmer">
            Nudge
          </h1>
          <p className="text-xl text-muted-foreground mb-8 animate-fade-in" style={{ animationDelay: '400ms' }}>
            Tu coach de vida personal impulsado por IA
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '600ms' }}>
          <Button size="lg" onClick={() => navigate("/auth")} className="min-w-[200px] btn-interactive hover:scale-110">
            Comenzar
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="min-w-[200px] btn-interactive hover:scale-110">
            Iniciar sesión
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
