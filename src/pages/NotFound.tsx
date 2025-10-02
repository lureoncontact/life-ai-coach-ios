import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, SearchX } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="text-center space-y-8 max-w-md animate-scale-in">
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-muted rounded-3xl flex items-center justify-center animate-bounce-subtle hover-glow">
            <SearchX className="w-12 h-12 text-muted-foreground animate-pulse" />
          </div>
        </div>
        
        <div className="space-y-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <h1 className="text-6xl font-bold text-foreground">404</h1>
          <h2 className="text-2xl font-semibold text-foreground">Página no encontrada</h2>
          <p className="text-muted-foreground">
            Lo sentimos, la página que estás buscando no existe o ha sido movida.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-in" style={{ animationDelay: '400ms' }}>
          <Button 
            onClick={() => navigate(-1)}
            variant="outline"
            className="btn-interactive hover:scale-105"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver atrás
          </Button>
          <Button 
            onClick={() => navigate("/")}
            className="btn-interactive hover:scale-105"
          >
            <Home className="w-4 h-4 mr-2" />
            Ir al inicio
          </Button>
        </div>

        <div className="pt-6 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '600ms' }}>
          <p>Ruta intentada: <code className="px-2 py-1 bg-muted rounded text-xs">{location.pathname}</code></p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
