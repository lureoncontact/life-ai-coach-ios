import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, LogOut, Bell, Crown, Share2, Download, Palette, Languages } from "lucide-react";
import nudgeIcon from "@/assets/nudge_icon.png";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Switch } from "@/components/ui/switch";
import { requestNotificationPermission, scheduleReminder, sendNotification } from "@/utils/notifications";
import { Separator } from "@/components/ui/separator";
import PremiumPlansModal from "@/components/PremiumPlansModal";
import IntegrationsModal from "@/components/IntegrationsModal";
import ExportDataModal from "@/components/ExportDataModal";
import ThemeSelector from "@/components/ThemeSelector";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Profile {
  full_name: string;
  age: number | null;
  gender: string | null;
  interests: string | null;
  habits: string | null;
  user_story: string | null;
}

const Settings = () => {
  const { t, i18n } = useTranslation();
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

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
    toast({
      title: lng === 'es' ? 'Idioma actualizado' : 'Language updated',
      description: lng === 'es' ? 'La aplicación ahora está en español' : 'The app is now in English',
    });
  };

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
        title: t('notifications.permissionsDenied'),
        description: t('notifications.permissionsDeniedDescription'),
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
        sendNotification(t('notifications.workOnGoals'), {
          body: t('notifications.pendingGoals', { 
            count: goals.length, 
            plural: goals.length > 1 ? 's' : '' 
          }),
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
          title: t('notifications.permissionsDenied'),
          description: t('notifications.permissionsDeniedDescription'),
        });
        return;
      }
    }

    setNotificationsEnabled(enabled);
    localStorage.setItem("notificationsEnabled", enabled.toString());
    
    if (enabled) {
      toast({
        title: t('notifications.remindersActivated'),
        description: `${t('notifications.remindersActivatedDescription')} ${reminderTime}`,
      });
    }
  };

  const updateReminderTime = (time: string) => {
    setReminderTime(time);
    localStorage.setItem("reminderTime", time);
    
    if (notificationsEnabled) {
      toast({
        title: t('notifications.timeUpdated'),
        description: `${t('notifications.timeUpdatedDescription')} ${time}`,
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
        title: t('settings.profileUpdated'),
        description: t('settings.profileUpdatedDescription'),
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
    return <LoadingSpinner />;
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
            <h1 className="text-lg font-bold">{t('settings.title')}</h1>
            <p className="text-xs text-muted-foreground">{t('settings.subtitle')}</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        {/* Profile Section */}
        <Card className="hover-lift stagger-item animate-fade-in" style={{ animationDelay: '0ms' }}>
          <CardHeader>
            <CardTitle>{t('settings.personalInfo')}</CardTitle>
            <CardDescription>
              {t('settings.personalInfoDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">{t('settings.fullName')} *</Label>
              <Input
                id="fullName"
                value={profile.full_name}
                onChange={(e) =>
                  setProfile({ ...profile, full_name: e.target.value })
                }
                placeholder={t('settings.fullName')}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">{t('settings.age')}</Label>
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
                <Label htmlFor="gender">{t('settings.gender')}</Label>
                <Input
                  id="gender"
                  value={profile.gender || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, gender: e.target.value })
                  }
                  placeholder={t('settings.genderPlaceholder')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Context Section */}
        <Card className="hover-lift stagger-item animate-fade-in" style={{ animationDelay: '100ms' }}>
          <CardHeader>
            <CardTitle>{t('settings.personalContext')}</CardTitle>
            <CardDescription>
              {t('settings.personalContextDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="interests">{t('settings.interests')}</Label>
              <Textarea
                id="interests"
                value={profile.interests || ""}
                onChange={(e) =>
                  setProfile({ ...profile, interests: e.target.value })
                }
                placeholder={t('settings.interestsPlaceholder')}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="habits">{t('settings.currentHabits')}</Label>
              <Textarea
                id="habits"
                value={profile.habits || ""}
                onChange={(e) =>
                  setProfile({ ...profile, habits: e.target.value })
                }
                placeholder={t('settings.habitsPlaceholder')}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userStory">{t('settings.yourStory')}</Label>
              <Textarea
                id="userStory"
                value={profile.user_story || ""}
                onChange={(e) =>
                  setProfile({ ...profile, user_story: e.target.value })
                }
                placeholder={t('settings.storyPlaceholder')}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Language Section */}
        <Card className="hover-lift stagger-item animate-fade-in" style={{ animationDelay: '150ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="w-5 h-5" />
              {t('settings.language')}
            </CardTitle>
            <CardDescription>
              {t('settings.languageDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={i18n.language} onValueChange={changeLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es">{t('settings.spanish')}</SelectItem>
                <SelectItem value="en">{t('settings.english')}</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Theme Section */}
        <ThemeSelector />

        {/* Notifications Section */}
        <Card className="hover-lift stagger-item animate-fade-in" style={{ animationDelay: '200ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              {t('settings.reminders')}
            </CardTitle>
            <CardDescription>
              {t('settings.remindersDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('settings.enableReminders')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.enableRemindersDescription')}
                </p>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={toggleNotifications}
              />
            </div>

            {notificationsEnabled && (
              <div className="space-y-2">
                <Label htmlFor="reminderTime">{t('settings.reminderTime')}</Label>
                <Input
                  id="reminderTime"
                  type="time"
                  value={reminderTime}
                  onChange={(e) => updateReminderTime(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {t('settings.reminderTimeDescription')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Premium & Features Section */}
        <Card className="hover-lift stagger-item animate-fade-in" style={{ animationDelay: '300ms' }}>
          <CardHeader>
            <CardTitle>{t('settings.advancedFeatures')}</CardTitle>
            <CardDescription>
              {t('settings.advancedFeaturesDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start btn-interactive hover:scale-105"
              onClick={() => setShowPremiumModal(true)}
            >
              <Crown className="w-4 h-4 mr-2 text-primary animate-pulse" />
              {t('settings.premiumPlans')}
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start btn-interactive hover:scale-105"
              onClick={() => setShowIntegrationsModal(true)}
            >
              <Share2 className="w-4 h-4 mr-2" />
              {t('settings.integrations')}
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start btn-interactive hover:scale-105"
              onClick={() => setShowExportModal(true)}
            >
              <Download className="w-4 h-4 mr-2" />
              {t('settings.exportData')}
            </Button>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={saveProfile}
            disabled={saving || !profile.full_name.trim()}
            className="w-full btn-interactive hover:scale-105"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? t('settings.saving') : t('settings.saveChanges')}
          </Button>

          <Separator />

          <Button
            variant="destructive"
            onClick={handleSignOut}
            className="w-full btn-interactive hover:scale-105"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t('common.signOut')}
          </Button>
        </div>

        {/* App Info */}
        <Card className="bg-muted/50">
          <CardContent className="p-4 text-center text-sm text-muted-foreground">
            <div className="flex items-center justify-center gap-2 mb-2">
              <img src={nudgeIcon} alt="Nudge" className="w-8 h-8" />
              <span className="font-semibold text-foreground text-base">Nudge</span>
            </div>
            <p>{t('landing.title')}</p>
            <p className="mt-2 text-xs">{t('settings.appVersion')}</p>
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
