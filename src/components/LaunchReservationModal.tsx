import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles } from "lucide-react";

interface LaunchReservationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LaunchReservationModal = ({ open, onOpenChange }: LaunchReservationModalProps) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim() || !email.trim()) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("launch_reservations")
        .insert({
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
        });

      if (error) throw error;

      toast({
        title: "¡Reserva confirmada! 🎉",
        description: "Te contactaremos pronto con la oferta exclusiva de lanzamiento",
      });

      setFullName("");
      setEmail("");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving reservation:", error);
      toast({
        title: "Error",
        description: "Hubo un problema al guardar tu reserva. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Reserva tu lugar - Oferta de Lanzamiento
          </DialogTitle>
          <DialogDescription>
            Sé de los primeros en acceder a Nudge con beneficios exclusivos
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nombre completo</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Juan Pérez"
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              disabled={loading}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reservar mi lugar
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center">
          Al reservar, aceptas recibir información sobre Nudge
        </p>
      </DialogContent>
    </Dialog>
  );
};
