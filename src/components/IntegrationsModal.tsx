import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Calendar, FileText, CheckSquare, Mail, MessageSquare, Clock, Smartphone, Cloud } from "lucide-react";

interface IntegrationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const IntegrationsModal = ({ open, onOpenChange }: IntegrationsModalProps) => {
  const { toast } = useToast();
  const [enabledIntegrations, setEnabledIntegrations] = useState<Set<string>>(new Set());

  const toggleIntegration = (name: string) => {
    const newEnabled = new Set(enabledIntegrations);
    if (newEnabled.has(name)) {
      newEnabled.delete(name);
      toast({
        title: `${name} desconectado`,
        description: "La integración ha sido deshabilitada",
      });
    } else {
      newEnabled.add(name);
      toast({
        title: `${name} conectado`,
        description: "Próximamente: Esta integración estará disponible pronto",
      });
    }
    setEnabledIntegrations(newEnabled);
  };

  const integrations = [
    {
      name: "Google Calendar",
      description: "Sincroniza tus metas y recordatorios",
      icon: Calendar,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      premium: false,
      category: "Productividad",
    },
    {
      name: "Notion",
      description: "Exporta tus metas y progreso automáticamente",
      icon: FileText,
      color: "text-gray-700 dark:text-gray-300",
      bgColor: "bg-gray-700/10 dark:bg-gray-300/10",
      premium: true,
      category: "Productividad",
    },
    {
      name: "Todoist",
      description: "Sincroniza tareas y metas diarias",
      icon: CheckSquare,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      premium: true,
      category: "Tareas",
    },
    {
      name: "Gmail",
      description: "Recibe resúmenes por email",
      icon: Mail,
      color: "text-red-600",
      bgColor: "bg-red-600/10",
      premium: false,
      category: "Comunicación",
    },
    {
      name: "Slack",
      description: "Notificaciones en tu workspace",
      icon: MessageSquare,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      premium: true,
      category: "Comunicación",
    },
    {
      name: "Zapier",
      description: "Conecta con 5000+ aplicaciones",
      icon: Cloud,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      premium: true,
      category: "Automatización",
    },
    {
      name: "Apple Health",
      description: "Sincroniza hábitos de salud y fitness",
      icon: Smartphone,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
      premium: true,
      category: "Salud",
    },
    {
      name: "RescueTime",
      description: "Analiza tu productividad y tiempo",
      icon: Clock,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
      premium: true,
      category: "Productividad",
    },
  ];

  const categories = Array.from(new Set(integrations.map((i) => i.category)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Cloud className="w-6 h-6 text-primary" />
            Integraciones
          </DialogTitle>
          <DialogDescription>
            Conecta Nudge con tus aplicaciones favoritas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {categories.map((category) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase">
                {category}
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {integrations
                  .filter((i) => i.category === category)
                  .map((integration) => {
                    const Icon = integration.icon;
                    const isEnabled = enabledIntegrations.has(integration.name);
                    return (
                      <Card key={integration.name}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-lg ${integration.bgColor} flex items-center justify-center`}
                              >
                                <Icon className={`w-5 h-5 ${integration.color}`} />
                              </div>
                              <div>
                                <CardTitle className="text-base flex items-center gap-2">
                                  {integration.name}
                                  {integration.premium && (
                                    <Badge variant="secondary" className="text-xs">
                                      Pro
                                    </Badge>
                                  )}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                  {integration.description}
                                </CardDescription>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              {isEnabled ? "Conectado" : "Desconectado"}
                            </span>
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={() => toggleIntegration(integration.name)}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-primary/10 rounded-lg text-center">
          <p className="text-sm">
            🚀 <strong>Próximamente:</strong> Todas estas integraciones estarán disponibles en la versión final
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IntegrationsModal;