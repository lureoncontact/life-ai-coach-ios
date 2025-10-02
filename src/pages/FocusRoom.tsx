import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, Loader2, Plus, Check, Settings as SettingsIcon, Share2, Activity, Briefcase, Heart, DollarSign, Sprout, Brain } from "lucide-react";
import nudgeIcon from "@/assets/nudge_icon.png";
import VoiceInterface from "@/components/VoiceInterface";
import { onGoalCompleted } from "@/utils/gamification";
import AchievementsModal from "@/components/AchievementsModal";
import ShareRoomModal from "@/components/ShareRoomModal";
import ActiveUsersIndicator from "@/components/ActiveUsersIndicator";
import CelebrationEffect from "@/components/CelebrationEffect";
import { useRealtimePresence } from "@/hooks/useRealtimePresence";
import { useRealtimeGoals } from "@/hooks/useRealtimeGoals";
import MeditationTimer from "@/components/focus-room-features/MeditationTimer";
import SavingsTracker from "@/components/focus-room-features/SavingsTracker";
import WorkoutLogger from "@/components/focus-room-features/WorkoutLogger";
import SkillTracker from "@/components/focus-room-features/SkillTracker";
import RelationshipLogger from "@/components/focus-room-features/RelationshipLogger";
import BookTracker from "@/components/focus-room-features/BookTracker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface FocusRoom {
  id: string;
  name: string;
  description: string | null;
  area_category: string;
  bot_voice: string;
  bot_tone: string;
  bot_knowledge: string | null;
}

interface Goal {
  id: string;
  title: string;
  description: string | null;
  specific: string | null;
  measurable: string | null;
  achievable: string | null;
  relevant: string | null;
  time_bound: string | null;
  is_completed: boolean;
  is_daily: boolean;
}

const FocusRoom = () => {
  const { roomId } = useParams();
  const [room, setRoom] = useState<FocusRoom | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalIsDaily, setNewGoalIsDaily] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showShareRoom, setShowShareRoom] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [newAchievements, setNewAchievements] = useState<any[]>([]);
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Realtime hooks
  const { activeUsers, activeCount } = useRealtimePresence(
    roomId || "",
    profile?.full_name || "Usuario"
  );
  
  useRealtimeGoals(roomId || "", () => {
    loadGoals();
  });

  useEffect(() => {
    loadProfile();
    loadRoomData();
    loadGoals();
    loadChatHistory();
  }, [roomId]);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    if (data) {
      setProfile(data);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadRoomData = async () => {
    if (!roomId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data, error } = await supabase
      .from("focus_rooms")
      .select("*")
      .eq("id", roomId)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar el Focus Room",
      });
      navigate("/dashboard");
      return;
    }

    setRoom(data);
  };

  const loadGoals = async () => {
    if (!roomId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("goals")
      .select("*")
      .eq("focus_room_id", roomId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      setGoals(data);
    }
  };

  const loadChatHistory = async () => {
    if (!roomId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("user_id", user.id)
      .eq("focus_room_id", roomId)
      .order("created_at", { ascending: true })
      .limit(50);

    if (data && data.length > 0) {
      setMessages(data as Message[]);
    }
  };

  const saveChatMessage = async (role: string, content: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("chat_messages").insert({
      user_id: user.id,
      focus_room_id: roomId,
      role,
      content,
    });
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    
    const newUserMessage: Message = { role: "user", content: userMessage };
    setMessages((prev) => [...prev, newUserMessage]);
    await saveChatMessage("user", userMessage);

    setIsLoading(true);

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
      
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, newUserMessage],
          focusRoomId: roomId,
        }),
      });

      // Handle error responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
        
        if (response.status === 402) {
          throw new Error("Se han agotado los créditos de Lovable AI. Ve a Settings → Workspace → Usage para agregar más créditos.");
        } else if (response.status === 429) {
          throw new Error("Demasiadas solicitudes. Por favor espera un momento antes de intentar de nuevo.");
        }
        
        throw new Error(errorData.error || "Error al conectar con el asistente");
      }

      if (!response.body) {
        throw new Error("No se recibió respuesta del servidor");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      let textBuffer = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            
            if (content) {
              assistantMessage += content;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: assistantMessage,
                };
                return updated;
              });
            }
          } catch (e) {
            console.error("Error parsing JSON:", e);
          }
        }
      }

      if (assistantMessage) {
        await saveChatMessage("assistant", assistantMessage);
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo enviar el mensaje",
      });
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const createGoal = async () => {
    if (!newGoalTitle.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("goals").insert({
      focus_room_id: roomId,
      user_id: user.id,
      title: newGoalTitle,
      is_daily: newGoalIsDaily,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear la meta",
      });
      return;
    }

    toast({
      title: "Meta creada",
      description: "Tu nueva meta ha sido agregada",
    });

    setNewGoalTitle("");
    setNewGoalIsDaily(false);
    setShowNewGoal(false);
    loadGoals();
  };

  const toggleGoalCompletion = async (goalId: string, currentStatus: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Find the goal to know if it's daily
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const { error } = await supabase
      .from("goals")
      .update({
        is_completed: !currentStatus,
        completed_at: !currentStatus ? new Date().toISOString() : null,
      })
      .eq("id", goalId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar la meta",
      });
      return;
    }

    // Award points and check achievements when completing (not uncompleting)
    if (!currentStatus) {
      const achievements = await onGoalCompleted(user.id, goal.is_daily);
      
      if (achievements.length > 0) {
        setNewAchievements(achievements);
        setShowCelebration(true);
        
        // Show achievements modal after celebration
        setTimeout(() => {
          setShowAchievements(true);
        }, 3000);
        
        toast({
          title: "¡Logro desbloqueado!",
          description: `Has desbloqueado ${achievements.length} nuevo${achievements.length > 1 ? 's' : ''} logro${achievements.length > 1 ? 's' : ''}`,
        });
      } else {
        toast({
          title: "¡Meta completada! 🎉",
          description: `+${goal.is_daily ? 15 : 10} puntos`,
        });
      }
    }

    loadGoals();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleVoiceTranscript = async (transcript: string, isUser: boolean) => {
    if (isUser) {
      const newUserMessage: Message = { role: "user", content: transcript };
      setMessages((prev) => [...prev, newUserMessage]);
      await saveChatMessage("user", transcript);
    } else {
      const newAssistantMessage: Message = { role: "assistant", content: transcript };
      setMessages((prev) => [...prev, newAssistantMessage]);
      await saveChatMessage("assistant", transcript);
    }
  };

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary text-xl">Cargando...</div>
      </div>
    );
  }

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

  const renderCategoryFeature = () => {
    if (!roomId) return null;
    
    switch (room.area_category) {
      case "mental":
        return <MeditationTimer roomId={roomId} />;
      case "finance":
        return <SavingsTracker roomId={roomId} />;
      case "health":
        return <WorkoutLogger roomId={roomId} />;
      case "career":
        return <SkillTracker roomId={roomId} />;
      case "relationships":
        return <RelationshipLogger roomId={roomId} />;
      case "personal":
        return <BookTracker roomId={roomId} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              {(() => {
                const IconComponent = getAreaIcon(room.area_category);
                return (
                  <div className="w-8 h-8 bg-primary/10 border border-primary rounded-lg flex items-center justify-center">
                    <IconComponent className="w-4 h-4 text-primary" />
                  </div>
                );
              })()}
              <div>
                <h1 className="text-lg font-bold">{room.name}</h1>
                <p className="text-xs text-muted-foreground">{room.description}</p>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowShareRoom(true)}>
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Active Users Indicator */}
        {activeCount > 0 && (
          <div className="container mx-auto px-4 pb-3">
            <ActiveUsersIndicator activeUsers={activeUsers} activeCount={activeCount} />
          </div>
        )}
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Goals Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Metas</CardTitle>
                  <Dialog open={showNewGoal} onOpenChange={setShowNewGoal}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="ghost">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nueva Meta</DialogTitle>
                        <DialogDescription>
                          Crea una nueva meta para este Focus Room
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="goalTitle">Título de la meta</Label>
                          <Input
                            id="goalTitle"
                            placeholder="Ej: Leer 10 páginas al día"
                            value={newGoalTitle}
                            onChange={(e) => setNewGoalTitle(e.target.value)}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="isDaily"
                            checked={newGoalIsDaily}
                            onCheckedChange={(checked) => setNewGoalIsDaily(checked as boolean)}
                          />
                          <Label htmlFor="isDaily" className="text-sm">
                            Meta diaria
                          </Label>
                        </div>
                        <Button onClick={createGoal} className="w-full">
                          Crear Meta
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {goals.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay metas aún
                  </p>
                ) : (
                  goals.map((goal, index) => (
                    <Card
                      key={goal.id}
                      className={`p-3 cursor-pointer transition-all hover-lift stagger-item ${
                        goal.is_completed ? "bg-success/10 border-success/30" : ""
                      }`}
                      style={{ animationDelay: `${index * 0.05}s` }}
                      onClick={() => toggleGoalCompletion(goal.id, goal.is_completed)}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                            goal.is_completed
                              ? "bg-success border-success scale-110"
                              : "border-muted-foreground hover:border-primary"
                          }`}
                        >
                          {goal.is_completed && <Check className="w-3 h-3 text-white animate-scale-in" />}
                        </div>
                        <div className="flex-1">
                          <p
                            className={`text-sm font-medium transition-all ${
                              goal.is_completed ? "line-through text-muted-foreground" : ""
                            }`}
                          >
                            {goal.title}
                          </p>
                          {goal.is_daily && (
                            <span className="text-xs text-muted-foreground">📅 Diaria</span>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Category-specific features */}
            {renderCategoryFeature()}
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2 flex flex-col h-[calc(100vh-200px)]">
            <Card className="flex-1 flex flex-col">
              <CardContent className="flex-1 overflow-y-auto p-6">
                {messages.length === 0 && (
                  <div className="text-center py-8 animate-scale-in">
                    {(() => {
                      const IconComponent = getAreaIcon(room.area_category);
                      return (
                        <div className="flex justify-center mb-4">
                          <div className="w-14 h-14 bg-primary/10 border-2 border-primary rounded-xl flex items-center justify-center animate-bounce-subtle">
                            <IconComponent className="w-8 h-8 text-primary" />
                          </div>
                        </div>
                      );
                    })()}
                    <h2 className="text-xl font-bold mb-2">Bot de {room.name}</h2>
                    <p className="text-muted-foreground">
                      Soy tu coach especializado en {room.name}. ¿Cómo puedo ayudarte hoy?
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      } animate-fade-in stagger-item`}
                      style={{ animationDelay: `${index * 0.03}s` }}
                    >
                      <Card
                        className={`max-w-[80%] p-4 hover-lift ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-card hover-glow"
                        }`}
                      >
                        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                      </Card>
                    </div>
                  ))}
                </div>
                <div ref={messagesEndRef} />
              </CardContent>

              <CardContent className="border-t p-4">
                <div className="flex gap-2">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribe tu mensaje..."
                    className="resize-none"
                    rows={2}
                    disabled={isLoading}
                  />
                  <div className="flex flex-col gap-2">
                    <VoiceInterface 
                      roomId={roomId!} 
                      onTranscriptUpdate={handleVoiceTranscript}
                    />
                    <Button
                      size="icon"
                      onClick={sendMessage}
                      disabled={!input.trim() || isLoading}
                      className="btn-interactive hover:scale-110 transition-transform"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Share Room Modal */}
      {room && (
        <ShareRoomModal
          open={showShareRoom}
          onOpenChange={setShowShareRoom}
          roomId={room.id}
          roomName={room.name}
        />
      )}

      {/* Achievements Modal */}
      <AchievementsModal
        open={showAchievements}
        onOpenChange={setShowAchievements}
        userAchievements={newAchievements}
      />

      {/* Celebration Effect */}
      <CelebrationEffect
        show={showCelebration}
        type="achievement"
        onComplete={() => setShowCelebration(false)}
      />
    </div>
  );
};

export default FocusRoom;
