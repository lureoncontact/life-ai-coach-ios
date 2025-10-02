import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Plus, Settings, BarChart3, Share2, Heart, Activity, Briefcase, DollarSign, Sprout, Brain } from "lucide-react";
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [focusRooms, setFocusRooms] = useState<FocusRoom[]>([]);
  const [todaysGoals, setTodaysGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showShareRoom, setShowShareRoom] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<{ id: string; name: string } | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { stats, loading: statsLoading, refreshStats } = useGamification();

  useEffect(() => {
    loadDashboardData();
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
        <LoadingSpinner size="lg" text="Cargando tu dashboard..." />
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
              <h1 className="text-xl font-bold">Nudge</h1>
              <p className="text-xs text-muted-foreground">
                Hola, {profile?.full_name || "Usuario"}
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
              Hablar con Nudge
            </Button>
            <p className="text-center text-sm text-muted-foreground mt-3">
              Tu coach personal está listo para ayudarte
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
            <h2 className="text-2xl font-bold">Metas de Hoy</h2>
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
                      {goal.is_completed ? "✓" : "Marcar"}
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
            <h2 className="text-2xl font-bold">Focus Rooms</h2>
            <Button size="sm" variant="outline" onClick={() => setShowCreateRoom(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Sala
            </Button>
          </div>
          
          {focusRooms.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  No tienes Focus Rooms aún
                </p>
                <Button onClick={() => navigate("/onboarding")}>
                  Crear tu primera sala
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
      </main>

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
