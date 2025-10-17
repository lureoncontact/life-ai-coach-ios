import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Crown, Sparkles, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface PremiumPlansModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PremiumPlansModal = ({ open, onOpenChange }: PremiumPlansModalProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const handleSubscribe = (plan: string) => {
    toast({
      title: "Próximamente disponible",
      description: `El plan ${plan} estará disponible pronto. ¡Gracias por tu interés!`,
    });
  };

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "/mes",
      icon: Sparkles,
      color: "text-muted-foreground",
      bgColor: "bg-muted/50",
      features: [
        "3 Focus Rooms",
        "10 metas por sala",
        "Chat básico con IA",
        "Estadísticas básicas",
        "1 voz de IA",
      ],
      cta: "Plan actual",
      disabled: true,
    },
    {
      name: "Pro",
      price: "$9.99",
      period: "/mes",
      icon: Zap,
      color: "text-primary",
      bgColor: "bg-primary/10",
      popular: true,
      features: [
        "Focus Rooms ilimitadas",
        "Metas ilimitadas",
        "Chat avanzado con IA",
        "Todas las voces de IA",
        "Integraciones premium",
        "Analytics avanzados",
        "Exportar datos",
        "Soporte prioritario",
      ],
      cta: "Actualizar a Pro",
      disabled: false,
    },
    {
      name: "Enterprise",
      price: "$29.99",
      period: "/mes",
      icon: Crown,
      color: "text-accent",
      bgColor: "bg-accent/10",
      features: [
        "Todo de Pro",
        "Equipos colaborativos",
        "Salas compartidas",
        "Personalización avanzada",
        "API access",
        "Onboarding personalizado",
        "SLA garantizado",
        "Soporte 24/7",
      ],
      cta: "Contactar ventas",
      disabled: false,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto animate-scale-in">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Crown className="w-6 h-6 text-primary animate-pulse" />
            Planes Premium
          </DialogTitle>
          <DialogDescription>
            Elige el plan perfecto para alcanzar tus metas
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-6 mt-4">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.name}
                className={`relative hover-lift animate-fade-in ${plan.popular ? "border-primary shadow-lg hover-glow" : ""}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 animate-bounce-subtle">
                    Más Popular
                  </Badge>
                )}
                <CardHeader>
                  <div className={`w-12 h-12 rounded-full ${plan.bgColor} flex items-center justify-center mb-2 transition-transform hover:scale-110`}>
                    <Icon className={`w-6 h-6 ${plan.color} ${plan.popular ? 'animate-pulse' : ''}`} />
                  </div>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold text-foreground">
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full btn-interactive hover:scale-105"
                    variant={plan.popular ? "default" : "outline"}
                    disabled={plan.disabled}
                    onClick={() => handleSubscribe(plan.name)}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg text-center">
          <p className="text-sm text-muted-foreground">
            💳 Todos los planes incluyen 14 días de prueba gratis • Cancela en cualquier momento
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumPlansModal;