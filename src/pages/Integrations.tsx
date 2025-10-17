import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageSquare, Activity, Briefcase, Check, ExternalLink } from "lucide-react";
import MobileMenu from "@/components/MobileMenu";
import nudgeIcon from "@/assets/nudge_icon.png";
import whoopLogo from "@/assets/whoop_logo_new.png";
import googleFitLogo from "@/assets/googlefit_logo.png";
import stravaLogo from "@/assets/strava_logo.png";
import todoistLogo from "@/assets/todoist_logo.png";
import trelloLogo from "@/assets/trello_logo.png";
import whatsappLogo from "@/assets/whatsapp_logo.png";
import { useToast } from "@/hooks/use-toast";

interface Integration {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  category: "messaging" | "health" | "productivity";
  connected: boolean;
}

const Integrations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [integrations, setIntegrations] = useState<Integration[]>([
    // Messaging
    {
      id: "whatsapp",
      name: t('integrations.whatsapp'),
      description: t('integrations.whatsappDescription'),
      logoUrl: whatsappLogo,
      category: "messaging",
      connected: false,
    },
    {
      id: "telegram",
      name: t('integrations.telegram'),
      description: t('integrations.telegramDescription'),
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg",
      category: "messaging",
      connected: false,
    },
    // Health
    {
      id: "whoop",
      name: t('integrations.whoop'),
      description: t('integrations.whoopDescription'),
      logoUrl: whoopLogo,
      category: "health",
      connected: false,
    },
    {
      id: "strava",
      name: t('integrations.strava'),
      description: t('integrations.stravaDescription'),
      logoUrl: stravaLogo,
      category: "health",
      connected: false,
    },
    {
      id: "apple-health",
      name: t('integrations.appleHealth'),
      description: t('integrations.appleHealthDescription'),
      logoUrl: "https://developer.apple.com/assets/elements/icons/healthkit/healthkit-96x96_2x.png",
      category: "health",
      connected: false,
    },
    {
      id: "google-fit",
      name: t('integrations.googleFit'),
      description: t('integrations.googleFitDescription'),
      logoUrl: googleFitLogo,
      category: "health",
      connected: false,
    },
    // Productivity
    {
      id: "notion",
      name: t('integrations.notion'),
      description: t('integrations.notionDescription'),
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png",
      category: "productivity",
      connected: false,
    },
    {
      id: "todoist",
      name: t('integrations.todoist'),
      description: t('integrations.todoistDescription'),
      logoUrl: todoistLogo,
      category: "productivity",
      connected: false,
    },
    {
      id: "google-calendar",
      name: t('integrations.googleCalendar'),
      description: t('integrations.googleCalendarDescription'),
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg",
      category: "productivity",
      connected: false,
    },
    {
      id: "trello",
      name: t('integrations.trello'),
      description: t('integrations.trelloDescription'),
      logoUrl: trelloLogo,
      category: "productivity",
      connected: false,
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
    return t(`integrations.category${category.charAt(0).toUpperCase()}${category.slice(1)}`);
  };

  const handleConnect = (id: string) => {
    toast({
      title: t('integrations.comingSoon'),
      description: t('integrations.comingSoonDescription'),
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
              <h1 className="text-xl font-bold">{t('integrations.title')}</h1>
              <p className="text-xs text-muted-foreground">
                {t('integrations.description')}
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
            <h2 className="text-2xl font-bold">{t('integrations.expandCapabilities')}</h2>
            <p className="text-muted-foreground">
              {t('integrations.expandDescription')}
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
                            <div className="w-14 h-14 rounded-xl bg-background border flex items-center justify-center overflow-hidden p-2">
                              <img 
                                src={integration.logoUrl} 
                                alt={integration.name}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%2348B8A9'/%3E%3C/svg%3E";
                                }}
                              />
                            </div>
                            <div>
                              <CardTitle className="text-lg">
                                {integration.name}
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
                        >
                          {integration.connected ? (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              {t('integrations.connected')}
                            </>
                          ) : (
                            <>
                              <ExternalLink className="w-4 h-4 mr-2" />
                              {t('integrations.connect')}
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
              <CardTitle>{t('integrations.missingIntegration')}</CardTitle>
              <CardDescription>
                {t('integrations.missingIntegrationDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => navigate("/settings")}>
                {t('integrations.suggestIntegration')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Integrations;
