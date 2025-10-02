import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Flame, Activity } from "lucide-react";

interface WorkoutLoggerProps {
  roomId: string;
}

const EXERCISE_TYPES = [
  "Cardio",
  "Fuerza",
  "Yoga",
  "Pilates",
  "Natación",
  "Ciclismo",
  "Running",
  "Caminata",
  "HIIT",
  "Otro",
];

const WorkoutLogger = ({ roomId }: WorkoutLoggerProps) => {
  const [exerciseType, setExerciseType] = useState("");
  const [duration, setDuration] = useState("");
  const [calories, setCalories] = useState("");
  const [notes, setNotes] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  const [weeklyMinutes, setWeeklyMinutes] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadLogs();
  }, [roomId]);

  const loadLogs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("workout_logs")
      .select("*")
      .eq("focus_room_id", roomId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      setLogs(data);
      
      // Calculate weekly minutes
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const weeklyTotal = data
        .filter(log => new Date(log.date) >= oneWeekAgo)
        .reduce((sum, log) => sum + log.duration_minutes, 0);
      
      setWeeklyMinutes(weeklyTotal);
    }
  };

  const addWorkout = async () => {
    if (!exerciseType || !duration || parseInt(duration) <= 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Completa los campos requeridos",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("workout_logs").insert({
      user_id: user.id,
      focus_room_id: roomId,
      exercise_type: exerciseType,
      duration_minutes: parseInt(duration),
      calories: calories ? parseInt(calories) : null,
      notes: notes || null,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar el ejercicio",
      });
      return;
    }

    toast({
      title: "¡Ejercicio registrado! 💪",
      description: `${duration} minutos de ${exerciseType}`,
    });

    setExerciseType("");
    setDuration("");
    setCalories("");
    setNotes("");
    loadLogs();
  };

  return (
    <div className="space-y-4 w-full max-w-full">
      <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20 w-full">
        <CardHeader className="p-4">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              💪 Esta Semana
            </span>
            <Activity className="w-5 h-5 text-orange-500" />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-3xl font-bold text-orange-600">
            {weeklyMinutes} min
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Últimos 7 días
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Registrar Ejercicio
          </CardTitle>
          <CardDescription>
            Agrega tu sesión de ejercicio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="exercise-type">Tipo de Ejercicio *</Label>
            <Select value={exerciseType} onValueChange={setExerciseType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo" />
              </SelectTrigger>
              <SelectContent>
                {EXERCISE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duración (min) *</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                placeholder="30"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="calories">Calorías</Label>
              <Input
                id="calories"
                type="number"
                min="0"
                placeholder="200"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="¿Cómo te sentiste?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <Button onClick={addWorkout} className="w-full btn-interactive">
            <Plus className="w-4 h-4 mr-2" />
            Agregar Ejercicio
          </Button>
        </CardContent>
      </Card>

      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ejercicios Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {logs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="flex justify-between items-center p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <div className="font-medium">{log.exercise_type}</div>
                    <div className="text-sm text-muted-foreground">
                      {log.duration_minutes} min
                      {log.calories && ` · ${log.calories} cal`}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(log.date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WorkoutLogger;
