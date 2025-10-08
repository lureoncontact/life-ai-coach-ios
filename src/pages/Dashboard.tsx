import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Plus, Settings, BarChart3, Share2, Heart, Activity, Briefcase, DollarSign, Sprout, Brain, Users } from "lucide-react";
import nudgeIcon from "@/assets/nudge_icon.png";
import { useGamification } from "@/hooks/useGamification";
import MobileMenu from "@/components/MobileMenu";
import UserLevelCard from "@/components/UserLevelCard";
import { getPointsForNextLevel } from "@/utils/gamification";
import CreateFocusRoomModal from "@/components/CreateFocusRoomModal";
import ShareRoomModal from "@/components/ShareRoomModal";
import AIInsightsModal from "@/components/AIInsightsModal";
import HabitsTracker from "@/components/HabitsTracker";
import LoadingSpinner from "@/components/LoadingSpinner";
import DailyCheckInModal from "@/components/DailyCheckInModal";
import DailyTipCard from "@/components/DailyTipCard";
import { useTranslation } from "react-i18next";

interface Profile {
  full_name: string;
}

interface FocusRoom {
  id: string;
  name: string;
  area_category: string;
  description: string | null;
}

interface Goal {
  id: string;
  title: string;
  is_completed: boolean;
  is_daily: boolean;
}

const Dashboard = () => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [focusRooms, setFocusRooms] = useState<FocusRoom[]>([]);
  const [todaysGoals, setTodaysGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showShareRoom, setShowShareRoom] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<{ id: string; name: string } | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { stats, loading: statsLoading, refreshStats } = useGamification();

  useEffect(() => {
    loadDashboardData();
    checkDailyCheckIn();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      setProfile(profileData);

      // Load focus rooms
      const { data: roomsData } = await supabase
        .from("focus_rooms")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      setFocusRooms(roomsData || []);

      // Load today's goals
      const { data: goalsData } = await supabase
        .from("goals")
        .select("id, title, is_completed, is_daily")
        .eq("user_id", user.id)
        .eq("is_daily", true)
        .order("created_at", { ascending: true });

      setTodaysGoals(goalsData || []);
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

  const checkDailyCheckIn = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

      // Check if user has done check-in today
      const { data: checkInData, error } = await supabase
        .from("daily_check_ins")
        .select("*")
        .eq("user_id", user.id)
        .eq("check_in_date", today)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error("Error checking daily check-in:", error);
        return;
      }

      const hasCheckedIn = !!checkInData;
      setHasCheckedInToday(hasCheckedIn);

      // Check if this is first time user
      const { count } = await supabase
        .from("daily_check_ins")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user.id);

      const isFirst = count === 0;
      setIsFirstLogin(isFirst);

      // Show modal if first login or hasn't checked in today
      if (isFirst || !hasCheckedIn) {
        // Small delay for better UX
        setTimeout(() => setShowCheckIn(true), 1000);
      }
    } catch (error) {
      console.error("Error in checkDailyCheckIn:", error);
    }
  };

  const handleCheckInComplete = async () => {
    setHasCheckedInToday(true);
    setIsFirstLogin(false);
    setShowCheckIn(false);
    // Recheck to ensure state is updated
    await checkDailyCheckIn();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleShareRoom = (e: React.MouseEvent, roomId: string, roomName: string) => {
    e.stopPropagation();
    setSelectedRoom({ id: roomId, name: roomName });
    setShowShareRoom(true);
  };

  const getAreaIcon = (category: string) => {
    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
      health: Activity,
      career: Briefcase,
      relationships: Heart,
      finance: DollarSign,
      personal: Sprout,
      mental: Brain,
    };
    return icons[category] || Activity;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <LoadingSpinner size="lg" text={t('dashboard.loadingDashboard')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={nudgeIcon} alt="Nudge" className="w-9 h-9" />
            <div>
              <h1 className="text-xl font-bold">{t('dashboard.title')}</h1>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.greeting')}, {profile?.full_name || "Usuario"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {/* Desktop icons */}
            <div className="hidden md:flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate("/stats")}>
                <BarChart3 className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
                <Settings className="w-5 h-5" />
              </Button>
            </div>
            {/* Mobile menu */}
            <MobileMenu />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Daily Tip Card */}
        {stats && profile && (
          <DailyTipCard
            userName={profile.full_name}
            currentStreak={stats.current_streak}
            totalPoints={stats.total_points}
            level={stats.level}
          />
        )}

        {/* User Level & Streak Card */}
        {stats && (
          <div className="animate-nudge-slide-up">
            <UserLevelCard
              level={stats.level}
              totalPoints={stats.total_points}
              currentStreak={stats.current_streak}
              pointsToNextLevel={getPointsForNextLevel(stats.level)}
            />
          </div>
        )}

        {/* Main Chat Button */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 animate-nudge-slide-up hover-glow">
          <CardContent className="p-6">
            <Button
              size="lg"
              className="w-full h-20 text-lg btn-interactive hover:scale-105 transition-transform"
              onClick={() => navigate("/chat")}
            >
              <MessageCircle className="w-6 h-6 mr-2" />
              {t('dashboard.chatButton')}
            </Button>
            <p className="text-center text-sm text-muted-foreground mt-3">
              {t('dashboard.chatDescription')}
            </p>
          </CardContent>
        </Card>

        {/* Habits Tracker */}
        <div className="animate-nudge-slide-up">
          <HabitsTracker onStatsUpdate={refreshStats} />
        </div>

        {/* Today's Goals */}
        {todaysGoals.length > 0 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-2xl font-bold">{t('dashboard.todaysGoals')}</h2>
            <div className="grid gap-3">
              {todaysGoals.map((goal, index) => (
                <Card 
                  key={goal.id} 
                  className="hover-lift stagger-item"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <span className={goal.is_completed ? "line-through text-muted-foreground" : ""}>
                      {goal.title}
                    </span>
                    <Button
                      size="sm"
                      variant={goal.is_completed ? "secondary" : "default"}
                      className="btn-interactive"
                    >
                      {goal.is_completed ? "✓" : t('focusRoom.mark')}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Focus Rooms */}
        <div className="space-y-4 animate-nudge-slide-up">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{t('dashboard.focusRooms')}</h2>
            <Button size="sm" variant="outline" onClick={() => setShowCreateRoom(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t('dashboard.newRoom')}
            </Button>
          </div>
          
          {focusRooms.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  {t('dashboard.noRooms')}
                </p>
                <Button onClick={() => navigate("/onboarding")}>
                  {t('dashboard.createFirstRoom')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {focusRooms.map((room, index) => (
                <Card
                  key={room.id}
                  className="hover-lift cursor-pointer group stagger-item"
                  style={{ animationDelay: `${index * 0.05}s` }}
                  onClick={() => navigate(`/focus-room/${room.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      {(() => {
                        const IconComponent = getAreaIcon(room.area_category);
                        return (
                          <div className="w-10 h-10 bg-primary/10 border border-primary rounded-lg flex items-center justify-center mb-2 transition-transform group-hover:scale-110">
                            <IconComponent className="w-6 h-6 text-primary" />
                          </div>
                        );
                      })()}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-all btn-interactive"
                        onClick={(e) => handleShareRoom(e, room.id, room.name)}
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                     <CardTitle className="text-lg">{room.name}</CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
         </div>

        {/* Daily Check-in Card (if not done today) */}
        {!hasCheckedInToday && (
          <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                {t('dashboard.dailyCheckIn')}
              </CardTitle>
              <CardDescription>
                {t('dashboard.dailyCheckInDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setShowCheckIn(true)}
                className="w-full btn-interactive"
              >
                {t('dashboard.doCheckIn')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Social Media Analysis Card */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 animate-fade-in hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              {t('dashboard.socialMediaAnalysis')}
            </CardTitle>
            <CardDescription>
              {t('dashboard.socialMediaDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate("/social-media")}
              className="w-full btn-interactive"
              variant="outline"
            >
              <Brain className="w-4 h-4 mr-2" />
              {t('dashboard.setupAnalysis')}
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Daily Check-in Modal */}
      <DailyCheckInModal
        open={showCheckIn}
        onOpenChange={setShowCheckIn}
        onCheckInComplete={handleCheckInComplete}
      />

      {/* Create Focus Room Modal */}
      <CreateFocusRoomModal
        open={showCreateRoom}
        onOpenChange={setShowCreateRoom}
        onRoomCreated={loadDashboardData}
      />

      {/* Share Room Modal */}
      {selectedRoom && (
        <ShareRoomModal
          open={showShareRoom}
          onOpenChange={setShowShareRoom}
          roomId={selectedRoom.id}
          roomName={selectedRoom.name}
        />
      )}

      {/* AI Insights Modal */}
      <AIInsightsModal
        open={showAIInsights}
        onOpenChange={setShowAIInsights}
      />
    </div>
  );
};

export default Dashboard;
