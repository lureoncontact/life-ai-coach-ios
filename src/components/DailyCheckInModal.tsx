import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Smile, Meh, Frown, Heart } from "lucide-react";

interface DailyCheckInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCheckInComplete: () => void;
}

const DailyCheckInModal = ({ open, onOpenChange, onCheckInComplete }: DailyCheckInModalProps) => {
  const { toast } = useToast();
  const [mood, setMood] = useState<string>("good");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const moods = [
    { value: "excellent", label: "Excelente", icon: Heart, color: "text-success" },
    { value: "good", label: "Bien", icon: Smile, color: "text-primary" },
    { value: "okay", label: "Regular", icon: Meh, color: "text-warning" },
    { value: "bad", label: "Mal", icon: Frown, color: "text-destructive" },
  ];

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      // Save daily check-in
      const { error: checkInError } = await supabase
        .from("daily_check_ins")
        .insert({
          user_id: user.id,
          mood,
          notes: notes || null,
          check_in_date: new Date().toISOString().split('T')[0],
        });

      if (checkInError) throw checkInError;

      // Award points for daily check-in
      const { data: stats } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (stats) {
        const newPoints = stats.total_points + 5; // 5 points for daily check-in
        const newLevel = Math.floor(newPoints / 100) + 1;

        await supabase
          .from("user_stats")
          .update({
            total_points: newPoints,
            level: newLevel,
            last_activity_date: new Date().toISOString().split('T')[0],
          })
          .eq("user_id", user.id);
      }

      toast({
        title: "¡Check-in completado! +5 pts",
        description: "Tu estado diario ha sido registrado",
      });

      localStorage.setItem("last-check-in", new Date().toISOString().split('T')[0]);
      setNotes("");
      setMood("good");
      onCheckInComplete();
      onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md animate-scale-in">
        <DialogHeader>
          <DialogTitle className="text-2xl animate-fade-in">Check-in Diario</DialogTitle>
          <DialogDescription className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            ¿Cómo te sientes hoy? Gana 5 puntos por registrar tu estado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="space-y-3">
            <Label>¿Cómo te sientes?</Label>
            <RadioGroup value={mood} onValueChange={setMood}>
              <div className="grid grid-cols-2 gap-3">
                {moods.map((moodOption) => {
                  const Icon = moodOption.icon;
                  return (
                    <Label
                      key={moodOption.value}
                      htmlFor={moodOption.value}
                      className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all hover-lift ${
                        mood === moodOption.value
                          ? "border-primary bg-primary/5 animate-bounce-subtle"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <RadioGroupItem value={moodOption.value} id={moodOption.value} />
                      <Icon className={`w-6 h-6 ${moodOption.color} ${mood === moodOption.value ? 'animate-pulse' : ''}`} />
                      <span className="font-medium">{moodOption.label}</span>
                    </Label>
                  );
                })}
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="¿Qué tienes planeado para hoy? ¿Cómo te sientes?"
              rows={4}
            />
          </div>

          <Button
            className="w-full btn-interactive hover:scale-105"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "Guardando..." : "Completar Check-in (+5 pts)"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DailyCheckInModal;