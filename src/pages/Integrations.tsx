import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageSquare, Activity, Briefcase, Check, ExternalLink } from "lucide-react";
import MobileMenu from "@/components/MobileMenu";
import nudgeIcon from "@/assets/nudge_icon.png";
import { useToast } from "@/hooks/use-toast";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "messaging" | "health" | "productivity";
  connected: boolean;
  comingSoon?: boolean;
}

const Integrations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<Integration[]>([
    // Messaging
    {
      id: "whatsapp",
      name: "WhatsApp",
      description: "Conecta Nudge con WhatsApp para recibir mensajes y recordatorios",
      icon: "💬",
      category: "messaging",
      connected: false,
      comingSoon: true,
    },
    {
      id: "telegram",
      name: "Telegram",
      description: "Chatea con Nudge directamente desde Telegram",
      icon: "✈️",
      category: "messaging",
      connected: false,
      comingSoon: true,
    },
    // Health
    {
      id: "whoop",
      name: "Whoop",
      description: "Sincroniza tus métricas de recuperación y sueño",
      icon: "⌚",
      category: "health",
      connected: false,
      comingSoon: true,
    },
    {
      id: "strava",
      name: "Strava",
      description: "Conecta tus entrenamientos y actividades deportivas",
      icon: "🏃",
      category: "health",
      connected: false,
      comingSoon: true,
    },
    {
      id: "apple-health",
      name: "Apple Health",
      description: "Importa datos de salud desde tu iPhone",
      icon: "🍎",
      category: "health",
      connected: false,
      comingSoon: true,
    },
    {
      id: "google-fit",
      name: "Google Fit",
      description: "Sincroniza tu actividad física y datos de salud",
      icon: "🏋️",
      category: "health",
      connected: false,
      comingSoon: true,
    },
    // Productivity
    {
      id: "notion",
      name: "Notion",
      description: "Sincroniza tus tareas y objetivos con Notion",
      icon: "📝",
      category: "productivity",
      connected: false,
      comingSoon: true,
    },
    {
      id: "todoist",
      name: "Todoist",
      description: "Importa y sincroniza tus tareas diarias",
      icon: "✅",
      category: "productivity",
      connected: false,
      comingSoon: true,
    },
    {
      id: "google-calendar",
      name: "Google Calendar",
      description: "Integra tus eventos y recordatorios",
      icon: "📅",
      category: "productivity",
      connected: false,
      comingSoon: true,
    },
    {
      id: "trello",
      name: "Trello",
      description: "Conecta tus tableros y tarjetas de Trello",
      icon: "📊",
      category: "productivity",
      connected: false,
      comingSoon: true,
    },
  ]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "messaging":
        return MessageSquare;
      case "health":
        return Activity;
      case "productivity":
        return Briefcase;
      default:
        return MessageSquare;
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case "messaging":
        return "Mensajería";
      case "health":
        return "Salud y Fitness";
      case "productivity":
        return "Productividad";
      default:
        return category;
    }
  };

  const handleConnect = (id: string) => {
    toast({
      title: "Próximamente",
      description: "Esta integración estará disponible pronto. ¡Estamos trabajando en ella!",
    });
  };

  const categories = ["messaging", "health", "productivity"] as const;

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
              <h1 className="text-xl font-bold">Integraciones</h1>
              <p className="text-xs text-muted-foreground">
                Conecta Nudge con tus apps favoritas
              </p>
            </div>
          </div>
          <MobileMenu />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Intro */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Expande las capacidades de Nudge</h2>
            <p className="text-muted-foreground">
              Conecta tus herramientas favoritas para llevar tu progreso al siguiente nivel
            </p>
          </div>

          {/* Categories */}
          {categories.map((category) => {
            const categoryIntegrations = integrations.filter((i) => i.category === category);
            const Icon = getCategoryIcon(category);

            return (
              <div key={category} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5 text-primary" />
                  <h3 className="text-xl font-semibold">{getCategoryTitle(category)}</h3>
                  <Badge variant="secondary" className="ml-2">
                    {categoryIntegrations.length}
                  </Badge>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {categoryIntegrations.map((integration, index) => (
                    <Card
                      key={integration.id}
                      className="hover-lift stagger-item"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl">
                              {integration.icon}
                            </div>
                            <div>
                              <CardTitle className="text-lg flex items-center gap-2">
                                {integration.name}
                                {integration.comingSoon && (
                                  <Badge variant="outline" className="text-xs">
                                    Próximamente
                                  </Badge>
                                )}
                              </CardTitle>
                              <CardDescription className="text-sm mt-1">
                                {integration.description}
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Button
                          className="w-full"
                          variant={integration.connected ? "secondary" : "default"}
                          onClick={() => handleConnect(integration.id)}
                          disabled={integration.comingSoon}
                        >
                          {integration.connected ? (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Conectado
                            </>
                          ) : (
                            <>
                              <ExternalLink className="w-4 h-4 mr-2" />
                              {integration.comingSoon ? "Próximamente" : "Conectar"}
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Request Integration */}
          <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
            <CardHeader>
              <CardTitle>¿Falta alguna integración?</CardTitle>
              <CardDescription>
                Estamos constantemente agregando nuevas integraciones. Si hay una app que te gustaría conectar con Nudge, háznoslo saber.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => navigate("/settings")}>
                Sugerir Integración
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Integrations;
