import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, CheckCircle2, Clock, TrendingUp, ArrowLeft, Settings } from "lucide-react";
import { toast } from "sonner";
import nudgeIcon from "@/assets/nudge_icon.png";
import MobileMenu from "@/components/MobileMenu";

interface SocialPlatform {
  id: string;
  name: string;
  logoUrl: string;
  placeholder: string;
  connected: boolean;
  username?: string;
  lastAnalysis?: string;
  insights?: number;
}

const SocialMedia = () => {
  const navigate = useNavigate();
  const [platforms, setPlatforms] = useState<SocialPlatform[]>([
    {
      id: "instagram",
      name: "Instagram",
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png",
      placeholder: "@usuario",
      connected: false,
    },
    {
      id: "facebook",
      name: "Facebook",
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg",
      placeholder: "Perfil de Facebook",
      connected: false,
    },
    {
      id: "x",
      name: "X (Twitter)",
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/5/57/X_logo_2023_%28white%29.png",
      placeholder: "@usuario",
      connected: false,
    },
    {
      id: "snapchat",
      name: "Snapchat",
      logoUrl: "https://upload.wikimedia.org/wikipedia/en/c/c4/Snapchat_logo.svg",
      placeholder: "Usuario de Snapchat",
      connected: false,
    },
  ]);

  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  const handleConnect = (platformId: string) => {
    const username = inputValues[platformId];
    if (!username || username.trim() === "") {
      toast.error("Por favor ingresa un nombre de usuario");
      return;
    }

    setPlatforms(prev => prev.map(p => 
      p.id === platformId 
        ? { 
            ...p, 
            connected: true, 
            username,
            lastAnalysis: "Hace 2 min",
            insights: Math.floor(Math.random() * 50) + 10
          }
        : p
    ));
    
    toast.success(`${platforms.find(p => p.id === platformId)?.name} conectado exitosamente`);
  };

  const handleDisconnect = (platformId: string) => {
    setPlatforms(prev => prev.map(p => 
      p.id === platformId 
        ? { ...p, connected: false, username: undefined, lastAnalysis: undefined, insights: undefined }
        : p
    ));
    setInputValues(prev => ({ ...prev, [platformId]: "" }));
    toast.info(`${platforms.find(p => p.id === platformId)?.name} desconectado`);
  };

  const connectedCount = platforms.filter(p => p.connected).length;
  const totalInsights = platforms.reduce((sum, p) => sum + (p.insights || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <img src={nudgeIcon} alt="Nudge" className="w-9 h-9" />
            <div>
              <h1 className="text-xl font-bold">Análisis de Redes Sociales</h1>
              <p className="text-xs text-muted-foreground">
                Conecta tus perfiles para análisis personalizado
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {/* Desktop icons */}
            <div className="hidden md:flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
                <Settings className="w-5 h-5" />
              </Button>
            </div>
            {/* Mobile menu */}
            <MobileMenu />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          {/* Info Section */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Brain className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-sm">¿Cómo funciona el análisis?</p>
                  <p className="text-sm text-muted-foreground">
                    La IA analizará tus publicaciones, interacciones y patrones de uso para comprender mejor tus intereses, 
                    hábitos y contexto social. Esto permite recomendaciones más personalizadas y un seguimiento más completo 
                    de tus objetivos. Tus datos están protegidos y solo se usan para mejorar tu experiencia.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Redes Conectadas</p>
                    <p className="text-2xl font-bold">{connectedCount}/4</p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Insights Totales</p>
                    <p className="text-2xl font-bold">{totalInsights}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Último Análisis</p>
                    <p className="text-2xl font-bold">
                      {connectedCount > 0 ? "Activo" : "—"}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Platforms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {platforms.map((platform) => (
              <Card key={platform.id} className="hover-lift">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center p-2">
                        <img
                          src={platform.logoUrl}
                          alt={`${platform.name} logo`}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg";
                          }}
                        />
                      </div>
                      <div>
                        <CardTitle className="text-base">{platform.name}</CardTitle>
                        {platform.connected && platform.username && (
                          <CardDescription className="text-xs">
                            {platform.username}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    {platform.connected ? (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Conectado
                      </Badge>
                    ) : (
                      <Badge variant="outline">No conectado</Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  {platform.connected ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Insights generados</p>
                          <p className="font-semibold">{platform.insights}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Último análisis</p>
                          <p className="font-semibold">{platform.lastAnalysis}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleDisconnect(platform.id)}
                      >
                        Desconectar
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Input
                        placeholder={platform.placeholder}
                        value={inputValues[platform.id] || ""}
                        onChange={(e) => setInputValues(prev => ({ ...prev, [platform.id]: e.target.value }))}
                      />
                      <Button
                        className="w-full"
                        onClick={() => handleConnect(platform.id)}
                      >
                        Conectar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SocialMedia;