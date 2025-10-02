import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, X } from "lucide-react";
import { showInstallPrompt, isPWAInstalled } from "@/utils/pwa";
import { useToast } from "@/hooks/use-toast";

const InstallPWAPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Don't show if already installed or dismissed
    const dismissed = localStorage.getItem("pwa-prompt-dismissed");
    const installed = isPWAInstalled();
    
    if (!dismissed && !installed) {
      // Show prompt after 10 seconds
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleInstall = async () => {
    const accepted = await showInstallPrompt();
    if (accepted) {
      toast({
        title: "¡Instalación iniciada!",
        description: "Nudge se está instalando en tu dispositivo",
      });
    }
    setShowPrompt(false);
    localStorage.setItem("pwa-prompt-dismissed", "true");
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-prompt-dismissed", "true");
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-nudge-slide-up">
      <Card className="border-primary shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-xl">🎯</span>
              </div>
              <div>
                <CardTitle className="text-base">Instalar Nudge</CardTitle>
                <CardDescription className="text-xs">
                  Accede más rápido desde tu dispositivo
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleDismiss}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          <ul className="text-xs text-muted-foreground space-y-1 mb-3">
            <li>✓ Funciona sin conexión</li>
            <li>✓ Notificaciones push</li>
            <li>✓ Acceso instantáneo</li>
          </ul>
          <Button className="w-full" onClick={handleInstall}>
            <Download className="w-4 h-4 mr-2" />
            Instalar App
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstallPWAPrompt;