import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Smile, Meh, Frown, Heart } from "lucide-react";

interface DailyCheckInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCheckInComplete?: () => void;
}

const moods = [
  { value: "great", label: "Excelente", icon: Smile, color: "text-green-500" },
  { value: "good", label: "Bien", icon: Heart, color: "text-blue-500" },
  { value: "okay", label: "Normal", icon: Meh, color: "text-yellow-500" },
  { value: "bad", label: "Mal", icon: Frown, color: "text-red-500" },
];

const DailyCheckInModal = ({ open, onOpenChange, onCheckInComplete }: DailyCheckInModalProps) => {
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [deepReflection, setDeepReflection] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const deepQuestions = [
    "¿Qué te detuvo de hacer ejercicio esta semana?",
    "¿Cuál fue tu mayor distracción ayer?",
    "¿Qué excusa te diste para no avanzar hoy?",
    "¿Qué hábito rompiste y por qué?",
    "¿Qué decisión evitaste tomar hoy?",
    "¿En qué momento del día perdiste el enfoque?",
    "¿Qué compromiso contigo no cumpliste?"
  ];
  
  const todayQuestion = deepQuestions[new Date().getDay() % deepQuestions.length];

  const handleSubmit = async () => {
    if (!selectedMood) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor selecciona cómo te sientes",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const today = new Date().toISOString().split('T')[0];

      const { error } = await supabase
        .from("daily_check_ins")
        .insert({
          user_id: user.id,
          check_in_date: today,
          mood: selectedMood,
          notes: notes.trim() || null,
        });

      if (error) throw error;

      toast({
        title: "¡Check-in completado! 🎉",
        description: "Tu estado de ánimo ha sido registrado",
      });

      // Reset form
      setSelectedMood("");
      setNotes("");
      setDeepReflection("");
      
      onCheckInComplete?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving check-in:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo guardar el check-in",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto animate-scale-in">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">Check-in Diario</DialogTitle>
          <DialogDescription className="text-sm">
            Comparte cómo te sientes hoy. Esto ayudará a Nudge a darte un mejor soporte.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Mood Selection */}
          <div className="space-y-2">
            <Label className="text-sm sm:text-base font-semibold">¿Cómo te sientes hoy?</Label>
            <div className="grid grid-cols-2 gap-2">
              {moods.map((mood) => {
                const Icon = mood.icon;
                return (
                  <Button
                    key={mood.value}
                    variant={selectedMood === mood.value ? "default" : "outline"}
                    className={`h-16 sm:h-20 flex flex-col gap-1 sm:gap-2 hover-lift ${
                      selectedMood === mood.value ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => setSelectedMood(mood.value)}
                  >
                    <Icon className={`w-6 h-6 sm:w-8 sm:h-8 ${selectedMood === mood.value ? "" : mood.color}`} />
                    <span className="text-xs sm:text-sm">{mood.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm sm:text-base font-semibold">
              Notas (opcional)
            </Label>
            <Textarea
              id="notes"
              placeholder="¿Hay algo que quieras compartir?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[60px] sm:min-h-[80px] resize-none text-sm"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {notes.length}/500
            </p>
          </div>

          {/* Deep Reflection Question */}
          <div className="space-y-2">
            <Label htmlFor="deepReflection" className="text-sm sm:text-base font-semibold">
              {todayQuestion}
            </Label>
            <Textarea
              id="deepReflection"
              placeholder="Sé honesto contigo mismo..."
              value={deepReflection}
              onChange={(e) => setDeepReflection(e.target.value)}
              className="min-h-[60px] sm:min-h-[80px] resize-none text-sm"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {deepReflection.length}/500
            </p>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedMood}
            className="w-full h-10 sm:h-12 text-sm sm:text-base btn-interactive"
          >
            {isSubmitting ? "Guardando..." : "Completar Check-in"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DailyCheckInModal;
