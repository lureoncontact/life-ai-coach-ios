import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Heart, Users } from "lucide-react";

interface RelationshipLoggerProps {
  roomId: string;
}

const INTERACTION_TYPES = [
  "Llamada",
  "Video llamada",
  "Café/Comida",
  "Mensaje",
  "Reunión",
  "Actividad",
  "Otro",
];

const RelationshipLogger = ({ roomId }: RelationshipLoggerProps) => {
  const [personName, setPersonName] = useState("");
  const [interactionType, setInteractionType] = useState("");
  const [qualityRating, setQualityRating] = useState(5);
  const [notes, setNotes] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  const [weeklyInteractions, setWeeklyInteractions] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadLogs();
  }, [roomId]);

  const loadLogs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("relationship_logs")
      .select("*")
      .eq("focus_room_id", roomId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      setLogs(data);
      
      // Calculate weekly interactions
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const weeklyCount = data.filter(
        log => new Date(log.date) >= oneWeekAgo
      ).length;
      
      setWeeklyInteractions(weeklyCount);
    }
  };

  const addInteraction = async () => {
    if (!personName || !interactionType) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Completa los campos requeridos",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("relationship_logs").insert({
      user_id: user.id,
      focus_room_id: roomId,
      person_name: personName,
      interaction_type: interactionType,
      quality_rating: qualityRating,
      notes: notes || null,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar la interacción",
      });
      return;
    }

    toast({
      title: "¡Interacción registrada! ❤️",
      description: `${interactionType} con ${personName}`,
    });

    setPersonName("");
    setInteractionType("");
    setQualityRating(5);
    setNotes("");
    loadLogs();
  };

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 border-pink-500/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              ❤️ Esta Semana
            </span>
            <Users className="w-5 h-5 text-pink-500" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-pink-600">
            {weeklyInteractions}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Interacciones significativas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Registrar Interacción
          </CardTitle>
          <CardDescription>
            Documenta tus conexiones significativas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="person-name">Persona *</Label>
            <Input
              id="person-name"
              placeholder="Nombre"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="interaction-type">Tipo de Interacción *</Label>
            <Select value={interactionType} onValueChange={setInteractionType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo" />
              </SelectTrigger>
              <SelectContent>
                {INTERACTION_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quality">Calidad (1-10)</Label>
            <div className="flex items-center gap-4">
              <Input
                id="quality"
                type="range"
                min="1"
                max="10"
                value={qualityRating}
                onChange={(e) => setQualityRating(parseInt(e.target.value))}
                className="flex-1"
              />
              <div className="text-2xl font-bold text-primary w-12 text-center">
                {qualityRating}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="¿De qué hablaron? ¿Cómo fue?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <Button onClick={addInteraction} className="w-full btn-interactive">
            <Plus className="w-4 h-4 mr-2" />
            Registrar Interacción
          </Button>
        </CardContent>
      </Card>

      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Interacciones Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {logs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="flex justify-between items-center p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <div className="font-medium">{log.person_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {log.interaction_type} · ⭐ {log.quality_rating}/10
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

export default RelationshipLogger;
