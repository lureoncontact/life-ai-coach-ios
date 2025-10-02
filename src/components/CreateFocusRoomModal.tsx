import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { onFocusRoomCreated } from "@/utils/gamification";

interface CreateFocusRoomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoomCreated: () => void;
}

const categories = [
  { value: "health", label: "Salud y Fitness", icon: "💪" },
  { value: "career", label: "Carrera Profesional", icon: "💼" },
  { value: "relationships", label: "Relaciones", icon: "❤️" },
  { value: "finance", label: "Finanzas", icon: "💰" },
  { value: "personal", label: "Desarrollo Personal", icon: "🌱" },
  { value: "mental", label: "Salud Mental", icon: "🧠" },
];

const tones = [
  { value: "motivational", label: "Motivacional" },
  { value: "supportive", label: "Empático" },
  { value: "direct", label: "Directo" },
  { value: "analytical", label: "Analítico" },
  { value: "humorous", label: "Con humor" },
];

const voices = [
  { value: "alloy", label: "Alloy (Neutral)" },
  { value: "echo", label: "Echo (Masculina)" },
  { value: "fable", label: "Fable (Británica)" },
  { value: "onyx", label: "Onyx (Grave)" },
  { value: "nova", label: "Nova (Femenina)" },
  { value: "shimmer", label: "Shimmer (Suave)" },
];

const CreateFocusRoomModal = ({ open, onOpenChange, onRoomCreated }: CreateFocusRoomModalProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tone, setTone] = useState("motivational");
  const [voice, setVoice] = useState("alloy");
  const [knowledge, setKnowledge] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!name || !category) {
      toast({
        variant: "destructive",
        title: "Campos requeridos",
        description: "Por favor completa el nombre y la categoría",
      });
      return;
    }

    setIsCreating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("focus_rooms").insert({
        user_id: user.id,
        name,
        description: description || null,
        area_category: category,
        bot_tone: tone,
        bot_voice: voice,
        bot_knowledge: knowledge || null,
      });

      if (error) throw error;

      // Award points for creating a focus room
      const achievements = await onFocusRoomCreated(user.id);

      toast({
        title: "Focus Room creado",
        description: achievements.length > 0 
          ? `¡Logro desbloqueado! ${achievements.map(a => a.name).join(", ")}`
          : "Tu nuevo espacio está listo",
      });

      // Reset form
      setName("");
      setDescription("");
      setCategory("");
      setTone("motivational");
      setVoice("alloy");
      setKnowledge("");

      onRoomCreated();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
        <DialogHeader>
          <DialogTitle className="animate-fade-in">Crear Focus Room</DialogTitle>
          <DialogDescription className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            Configura tu nuevo espacio de enfoque con un bot especializado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Focus Room *</Label>
            <Input
              id="name"
              placeholder="Ej: Mi rutina fitness, Crecimiento profesional..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoría *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <span className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Describe brevemente tu objetivo en este espacio..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tone">Tono del bot</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tones.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="voice">Voz para chat por voz</Label>
              <Select value={voice} onValueChange={setVoice}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {voices.map((v) => (
                    <SelectItem key={v.value} value={v.value}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="knowledge">Conocimiento específico (opcional)</Label>
            <Textarea
              id="knowledge"
              placeholder="Información específica que quieres que el bot conozca sobre ti o tus objetivos..."
              value={knowledge}
              onChange={(e) => setKnowledge(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating} className="btn-interactive hover:scale-105">
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={isCreating} className="btn-interactive hover:scale-105">
              {isCreating ? "Creando..." : "Crear Focus Room"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateFocusRoomModal;
