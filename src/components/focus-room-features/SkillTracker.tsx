import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, TrendingUp } from "lucide-react";

interface SkillTrackerProps {
  roomId: string;
}

const SkillTracker = ({ roomId }: SkillTrackerProps) => {
  const [skillName, setSkillName] = useState("");
  const [hoursToAdd, setHoursToAdd] = useState("");
  const [notes, setNotes] = useState("");
  const [skills, setSkills] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSkills();
  }, [roomId]);

  const loadSkills = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("skill_progress")
      .select("*")
      .eq("focus_room_id", roomId)
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (data) setSkills(data);
  };

  const addSkill = async () => {
    if (!skillName.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ingresa el nombre de la habilidad",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("skill_progress").insert({
      user_id: user.id,
      focus_room_id: roomId,
      skill_name: skillName,
      progress_percentage: 0,
      hours_invested: 0,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo agregar la habilidad",
      });
      return;
    }

    toast({
      title: "¡Habilidad agregada! 🎯",
      description: skillName,
    });

    setSkillName("");
    setShowAddForm(false);
    loadSkills();
  };

  const updateProgress = async (skillId: string, currentHours: number) => {
    if (!hoursToAdd || parseFloat(hoursToAdd) <= 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ingresa horas válidas",
      });
      return;
    }

    const newHours = currentHours + parseFloat(hoursToAdd);
    const newProgress = Math.min(100, Math.floor(newHours * 2)); // 50 horas = 100%

    const { error } = await supabase
      .from("skill_progress")
      .update({
        hours_invested: newHours,
        progress_percentage: newProgress,
        notes: notes || null,
      })
      .eq("id", skillId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar",
      });
      return;
    }

    toast({
      title: "¡Progreso actualizado! 📈",
      description: `+${hoursToAdd} horas`,
    });

    setHoursToAdd("");
    setNotes("");
    loadSkills();
  };

  return (
    <div className="space-y-4 w-full max-w-full">
      <Card className="w-full">
        <CardHeader className="p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="flex items-center gap-2 text-base">
                🎯 Habilidades en Desarrollo
              </CardTitle>
              <CardDescription className="text-sm">
                Rastrea tu progreso en diferentes skills
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn-interactive"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva
            </Button>
          </div>
        </CardHeader>
        {showAddForm && (
          <CardContent className="border-t pt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="skill-name">Nombre de la Habilidad</Label>
              <Input
                id="skill-name"
                placeholder="Ej: Python, Marketing Digital, Diseño UX..."
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={addSkill} className="btn-interactive">
                Agregar
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {skills.map((skill) => (
        <Card key={skill.id}>
          <CardHeader>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{skill.skill_name}</CardTitle>
                <div className="text-sm font-medium text-primary">
                  {skill.progress_percentage}%
                </div>
              </div>
              <Progress value={skill.progress_percentage} className="h-2" />
              <div className="text-sm text-muted-foreground">
                {parseFloat(skill.hours_invested).toFixed(1)} horas invertidas
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Agregar Horas</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="2.5"
                  value={hoursToAdd}
                  onChange={(e) => setHoursToAdd(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => updateProgress(skill.id, parseFloat(skill.hours_invested))}
                  className="w-full btn-interactive"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Actualizar
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                placeholder="¿Qué aprendiste hoy?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      ))}

      {skills.length === 0 && !showAddForm && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-muted-foreground">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No has agregado habilidades aún</p>
            <p className="text-sm">Haz clic en "Nueva" para comenzar</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SkillTracker;
