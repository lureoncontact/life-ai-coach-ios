import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, LogOut, Bell, Crown, Share2, Download, Palette } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { requestNotificationPermission, scheduleReminder, sendNotification } from "@/utils/notifications";
import { Separator } from "@/components/ui/separator";
import PremiumPlansModal from "@/components/PremiumPlansModal";
import IntegrationsModal from "@/components/IntegrationsModal";
import ExportDataModal from "@/components/ExportDataModal";
import ThemeSelector from "@/components/ThemeSelector";

interface Profile {
  full_name: string;
  age: number | null;
  gender: string | null;
  interests: string | null;
  habits: string | null;
  user_story: string | null;
}

const Settings = () => {
  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    age: null,
    gender: null,
    interests: null,
    habits: null,
    user_story: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("09:00");
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showIntegrationsModal, setShowIntegrationsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
    loadNotificationSettings();
  }, []);

  useEffect(() => {
    if (notificationsEnabled) {
      setupDailyReminder();
    }
  }, [notificationsEnabled, reminderTime]);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadNotificationSettings = () => {
    const savedEnabled = localStorage.getItem("notificationsEnabled");
    const savedTime = localStorage.getItem("reminderTime");
    
    if (savedEnabled) {
      setNotificationsEnabled(savedEnabled === "true");
    }
    if (savedTime) {
      setReminderTime(savedTime);
    }
  };

  const setupDailyReminder = async () => {
    const hasPermission = await requestNotificationPermission();
    
    if (!hasPermission) {
      toast({
        variant: "destructive",
        title: "Permisos denegados",
        description: "No se pueden mostrar notificaciones. Habilita los permisos en tu navegador.",
      });
      setNotificationsEnabled(false);
      localStorage.setItem("notificationsEnabled", "false");
      return;
    }

    scheduleReminder(reminderTime, async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: goals } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_daily", true)
        .eq("is_completed", false);

      if (goals && goals.length > 0) {
        sendNotification("¡Hora de trabajar en tus metas! 💪", {
          body: `Tienes ${goals.length} meta${goals.length > 1 ? 's' : ''} diaria${goals.length > 1 ? 's' : ''} pendiente${goals.length > 1 ? 's' : ''}.`,
          tag: "daily-reminder",
        });
      }
    });
  };

  const toggleNotifications = async (enabled: boolean) => {
    if (enabled) {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        toast({
          variant: "destructive",
          title: "Permisos denegados",
          description: "Por favor habilita las notificaciones en la configuración de tu navegador.",
        });
        return;
      }
    }

    setNotificationsEnabled(enabled);
    localStorage.setItem("notificationsEnabled", enabled.toString());
    
    if (enabled) {
      toast({
        title: "Recordatorios activados",
        description: `Recibirás un recordatorio diario a las ${reminderTime}`,
      });
    }
  };

  const updateReminderTime = (time: string) => {
    setReminderTime(time);
    localStorage.setItem("reminderTime", time);
    
    if (notificationsEnabled) {
      toast({
        title: "Hora actualizada",
        description: `Nuevo recordatorio a las ${time}`,
      });
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          age: profile.age,
          gender: profile.gender,
          interests: profile.interests,
          habits: profile.habits,
          user_story: profile.user_story,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Perfil actualizado",
        description: "Tus cambios se han guardado correctamente",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Configuración</h1>
            <p className="text-xs text-muted-foreground">Gestiona tu cuenta y preferencias</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        {/* Profile Section */}
        <Card className="animate-nudge-slide-up">
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
            <CardDescription>
              Actualiza tu información básica
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre completo *</Label>
              <Input
                id="fullName"
                value={profile.full_name}
                onChange={(e) =>
                  setProfile({ ...profile, full_name: e.target.value })
                }
                placeholder="Tu nombre"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Edad</Label>
                <Input
                  id="age"
                  type="number"
                  value={profile.age || ""}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      age: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  placeholder="25"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Género</Label>
                <Input
                  id="gender"
                  value={profile.gender || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, gender: e.target.value })
                  }
                  placeholder="Hombre / Mujer / Otro"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Context Section */}
        <Card className="animate-nudge-slide-up">
          <CardHeader>
            <CardTitle>Contexto Personal</CardTitle>
            <CardDescription>
              Esta información ayuda a personalizar tu experiencia con la IA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="interests">Intereses</Label>
              <Textarea
                id="interests"
                value={profile.interests || ""}
                onChange={(e) =>
                  setProfile({ ...profile, interests: e.target.value })
                }
                placeholder="Deportes, lectura, música, viajes..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="habits">Hábitos Actuales</Label>
              <Textarea
                id="habits"
                value={profile.habits || ""}
                onChange={(e) =>
                  setProfile({ ...profile, habits: e.target.value })
                }
                placeholder="Rutina matutina, ejercicio, meditación..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userStory">Tu Historia</Label>
              <Textarea
                id="userStory"
                value={profile.user_story || ""}
                onChange={(e) =>
                  setProfile({ ...profile, user_story: e.target.value })
                }
                placeholder="Cuéntanos sobre ti, tus miedos, logros, aspiraciones..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Theme Section */}
        <ThemeSelector />

        {/* Notifications Section */}
        <Card className="animate-nudge-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Recordatorios
            </CardTitle>
            <CardDescription>
              Configura recordatorios diarios para tus metas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Activar recordatorios diarios</Label>
                <p className="text-sm text-muted-foreground">
                  Recibe notificaciones para completar tus metas diarias
                </p>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={toggleNotifications}
              />
            </div>

            {notificationsEnabled && (
              <div className="space-y-2">
                <Label htmlFor="reminderTime">Hora del recordatorio</Label>
                <Input
                  id="reminderTime"
                  type="time"
                  value={reminderTime}
                  onChange={(e) => updateReminderTime(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Recibirás una notificación todos los días a esta hora
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Premium & Features Section */}
        <Card className="animate-nudge-slide-up">
          <CardHeader>
            <CardTitle>Funciones Avanzadas</CardTitle>
            <CardDescription>
              Desbloquea todo el potencial de Nudge
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setShowPremiumModal(true)}
            >
              <Crown className="w-4 h-4 mr-2 text-primary" />
              Ver Planes Premium
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setShowIntegrationsModal(true)}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Integraciones
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setShowExportModal(true)}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar Datos
            </Button>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={saveProfile}
            disabled={saving || !profile.full_name.trim()}
            className="w-full"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>

          <Separator />

          <Button
            variant="destructive"
            onClick={handleSignOut}
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>

        {/* App Info */}
        <Card className="bg-muted/50">
          <CardContent className="p-4 text-center text-sm text-muted-foreground">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl">🎯</span>
              <span className="font-bold text-foreground">Nudge</span>
            </div>
            <p>Tu coach de vida personal impulsado por IA</p>
            <p className="mt-2 text-xs">Versión 1.0.0</p>
          </CardContent>
        </Card>
      </main>

      {/* Modals */}
      <PremiumPlansModal open={showPremiumModal} onOpenChange={setShowPremiumModal} />
      <IntegrationsModal open={showIntegrationsModal} onOpenChange={setShowIntegrationsModal} />
      <ExportDataModal open={showExportModal} onOpenChange={setShowExportModal} />
    </div>
  );
};

export default Settings;
