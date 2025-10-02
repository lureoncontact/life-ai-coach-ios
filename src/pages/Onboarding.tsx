import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const COMMON_AREAS = [
  { id: "health", name: "Salud y Fitness", icon: "💪" },
  { id: "career", name: "Carrera Profesional", icon: "💼" },
  { id: "relationships", name: "Relaciones", icon: "❤️" },
  { id: "finance", name: "Finanzas", icon: "💰" },
  { id: "personal", name: "Desarrollo Personal", icon: "🌱" },
  { id: "mental", name: "Salud Mental", icon: "🧠" },
];

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Step 1: Personal Data
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");

  // Step 2: Deep Context
  const [interests, setInterests] = useState("");
  const [habits, setHabits] = useState("");
  const [userStory, setUserStory] = useState("");

  // Step 3: Focus Areas
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [customArea, setCustomArea] = useState("");

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const toggleArea = (areaId: string) => {
    setSelectedAreas((prev) =>
      prev.includes(areaId)
        ? prev.filter((id) => id !== areaId)
        : [...prev, areaId]
    );
  };

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      await handleComplete();
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          age: age ? parseInt(age) : null,
          gender: gender || null,
          interests: interests || null,
          habits: habits || null,
          user_story: userStory || null,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Create focus rooms for selected areas
      const areasToCreate = customArea
        ? [...selectedAreas, customArea]
        : selectedAreas;

      const focusRoomsData = areasToCreate.map((area) => {
        const commonArea = COMMON_AREAS.find((a) => a.id === area);
        return {
          user_id: user.id,
          name: commonArea ? commonArea.name : area,
          area_category: area,
          description: `Focus room para mejorar en ${
            commonArea ? commonArea.name : area
          }`,
        };
      });

      if (focusRoomsData.length > 0) {
        const { error: roomsError } = await supabase
          .from("focus_rooms")
          .insert(focusRoomsData);

        if (roomsError) throw roomsError;
      }

      toast({
        title: "¡Perfil completado!",
        description: "Bienvenido a Nudge",
      });

      navigate("/dashboard");
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

  const canProceed = () => {
    if (step === 1) return true; // Age and gender are optional
    if (step === 2) return true; // All fields optional
    if (step === 3) return selectedAreas.length > 0 || customArea.length > 0;
    return false;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-2xl animate-nudge-slide-up">
        <CardHeader>
          <div className="space-y-4">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Paso {step} de {totalSteps}</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-6 animate-nudge-slide-up">
              <div className="text-center mb-6">
                <CardTitle className="text-2xl mb-2">Datos Personales</CardTitle>
                <CardDescription>
                  Cuéntanos un poco sobre ti (opcional)
                </CardDescription>
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Edad</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="25"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Género</Label>
                <Input
                  id="gender"
                  type="text"
                  placeholder="Hombre / Mujer / Otro"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-nudge-slide-up">
              <div className="text-center mb-6">
                <CardTitle className="text-2xl mb-2">Contexto Profundo</CardTitle>
                <CardDescription>
                  Ayúdanos a conocerte mejor para personalizar tu experiencia
                </CardDescription>
              </div>
              <div className="space-y-2">
                <Label htmlFor="interests">Intereses</Label>
                <Textarea
                  id="interests"
                  placeholder="Deportes, lectura, música, viajes..."
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="habits">Hábitos Actuales</Label>
                <Textarea
                  id="habits"
                  placeholder="Rutina matutina, ejercicio, meditación..."
                  value={habits}
                  onChange={(e) => setHabits(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userStory">Tu Historia</Label>
                <Textarea
                  id="userStory"
                  placeholder="Cuéntanos sobre ti, tus miedos, logros, aspiraciones..."
                  value={userStory}
                  onChange={(e) => setUserStory(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-nudge-slide-up">
              <div className="text-center mb-6">
                <CardTitle className="text-2xl mb-2">Áreas de Mejora</CardTitle>
                <CardDescription>
                  Selecciona las áreas en las que quieres trabajar
                </CardDescription>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {COMMON_AREAS.map((area) => (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => toggleArea(area.id)}
                    className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                      selectedAreas.includes(area.id)
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="text-3xl mb-2">{area.icon}</div>
                    <div className="text-sm font-medium">{area.name}</div>
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <Label htmlFor="customArea">Área Personalizada</Label>
                <Input
                  id="customArea"
                  type="text"
                  placeholder="Ej: Espiritualidad, Creatividad..."
                  value={customArea}
                  onChange={(e) => setCustomArea(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="flex-1"
              >
                Atrás
              </Button>
            )}
            <Button
              type="button"
              onClick={handleNext}
              disabled={!canProceed() || loading}
              className="flex-1"
            >
              {loading
                ? "Guardando..."
                : step === totalSteps
                ? "Completar"
                : "Continuar"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
