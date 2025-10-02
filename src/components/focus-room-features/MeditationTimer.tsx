import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Play, Pause, RotateCcw, Save } from "lucide-react";

interface MeditationTimerProps {
  roomId: string;
}

const MeditationTimer = ({ roomId }: MeditationTimerProps) => {
  const [duration, setDuration] = useState(10);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [notes, setNotes] = useState("");
  const [sessions, setSessions] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadSessions();
  }, [roomId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      handleSessionComplete();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const loadSessions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("meditation_sessions")
      .select("*")
      .eq("focus_room_id", roomId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (data) setSessions(data);
  };

  const startTimer = () => {
    setTimeLeft(duration * 60);
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(0);
  };

  const handleSessionComplete = async () => {
    setIsRunning(false);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("meditation_sessions").insert({
      user_id: user.id,
      focus_room_id: roomId,
      duration_minutes: duration,
      notes: notes || null,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar la sesión",
      });
      return;
    }

    toast({
      title: "¡Sesión completada! 🧘",
      description: `Meditaste ${duration} minutos`,
    });

    setNotes("");
    loadSessions();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4 w-full max-w-full">
      <Card className="w-full">
        <CardHeader className="p-4">
          <CardTitle className="flex items-center gap-2 text-base">
            🧘 Temporizador de Meditación
          </CardTitle>
          <CardDescription className="text-sm">
            Registra tus sesiones de meditación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <div className="space-y-2">
            <Label htmlFor="duration">Duración (minutos)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              max="60"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 10)}
              disabled={isRunning}
            />
          </div>

          <div className="text-center p-6 bg-primary/5 rounded-lg">
            <div className="text-5xl font-mono font-bold text-primary mb-4">
              {formatTime(timeLeft || duration * 60)}
            </div>
            <div className="flex justify-center gap-2 flex-wrap">
              {!isRunning && timeLeft === 0 ? (
                <Button onClick={startTimer} className="btn-interactive">
                  <Play className="w-4 h-4 mr-2" />
                  Iniciar
                </Button>
              ) : (
                <>
                  <Button
                    onClick={isRunning ? pauseTimer : () => setIsRunning(true)}
                    variant={isRunning ? "secondary" : "default"}
                    className="btn-interactive"
                  >
                    {isRunning ? (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Pausar
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Continuar
                      </>
                    )}
                  </Button>
                  <Button onClick={resetTimer} variant="outline">
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="¿Cómo te sentiste durante la meditación?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {sessions.length > 0 && (
        <Card className="w-full">
          <CardHeader className="p-4">
            <CardTitle className="text-sm">Sesiones Recientes</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex justify-between items-center p-2 bg-muted/50 rounded text-sm"
                >
                  <div>
                    <div className="font-medium">{session.duration_minutes} min</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(session.date).toLocaleDateString()}
                    </div>
                  </div>
                  {session.notes && (
                    <div className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {session.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MeditationTimer;
