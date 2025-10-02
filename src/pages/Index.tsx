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
      <div className="text-center space-y-8 p-8 animate-nudge-slide-up">
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center shadow-lg">
            <span className="text-5xl">🎯</span>
          </div>
        </div>
        <div>
          <h1 className="mb-4 text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Nudge
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Tu coach de vida personal impulsado por IA
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" onClick={() => navigate("/auth")} className="min-w-[200px]">
            Comenzar
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="min-w-[200px]">
            Iniciar sesión
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
