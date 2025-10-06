import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LaunchReservationModal } from "@/components/LaunchReservationModal";

import nudgeIcon from "@/assets/nudge_icon.png";
import nudgeLogo from "@/assets/nudge_logo.png";

const Index = () => {
  const navigate = useNavigate();
  const [showReservationModal, setShowReservationModal] = useState(false);

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
          <img src={nudgeIcon} alt="Nudge Icon" className="w-24 h-24" />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <img src={nudgeLogo} alt="Nudge" className="h-16 mx-auto mb-6" />
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
        
        <div className="mt-8 animate-fade-in" style={{ animationDelay: '800ms' }}>
          <Button 
            size="lg" 
            variant="default"
            onClick={() => setShowReservationModal(true)} 
            className="min-w-[250px] btn-interactive hover:scale-110 bg-gradient-to-r from-primary to-primary/80"
          >
            🚀 Reservar oferta de lanzamiento
          </Button>
        </div>
      </div>
      
      <LaunchReservationModal 
        open={showReservationModal} 
        onOpenChange={setShowReservationModal}
      />
    </div>
  );
};

export default Index;
