import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp } from "lucide-react";
import MobileMenu from "@/components/MobileMenu";
import ProgressMapInteractive from "@/components/progress-map/ProgressMapInteractive";
import { useGamification } from "@/hooks/useGamification";
import LoadingSpinner from "@/components/LoadingSpinner";
import nudgeIcon from "@/assets/nudge_icon.png";

const Progress = () => {
  const navigate = useNavigate();
  const { stats, loading } = useGamification();

  if (loading || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <LoadingSpinner size="lg" text="Cargando tu progreso..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="md:hidden"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <img src={nudgeIcon} alt="Nudge" className="w-9 h-9" />
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Tu Progreso
              </h1>
              <p className="text-xs text-muted-foreground">
                Nivel {stats.level} • {stats.total_points} puntos
              </p>
            </div>
          </div>
          <MobileMenu />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 space-y-2">
            <h2 className="text-2xl font-bold">Mapa de Niveles</h2>
            <p className="text-muted-foreground">
              Visualiza tu camino hacia la maestría. Cada nivel representa tu compromiso con el cambio.
            </p>
          </div>

          <ProgressMapInteractive
            currentLevel={stats.level}
            totalPoints={stats.total_points}
            currentStreak={stats.current_streak}
          />
        </div>
      </main>
    </div>
  );
};

export default Progress;
