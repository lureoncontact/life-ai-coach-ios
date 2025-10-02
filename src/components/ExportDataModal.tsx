import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download, FileJson, FileText, Database, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ExportDataModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ExportDataModal = ({ open, onOpenChange }: ExportDataModalProps) => {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  const exportData = async (format: "json" | "csv") => {
    setExporting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      // Fetch all user data
      const [profileData, roomsData, goalsData, statsData, achievementsData] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("focus_rooms").select("*").eq("user_id", user.id),
        supabase.from("goals").select("*").eq("user_id", user.id),
        supabase.from("user_stats").select("*").eq("user_id", user.id).single(),
        supabase
          .from("user_achievements")
          .select("*, achievements(*)")
          .eq("user_id", user.id),
      ]);

      const exportData = {
        profile: profileData.data,
        focusRooms: roomsData.data || [],
        goals: goalsData.data || [],
        stats: statsData.data,
        achievements: achievementsData.data || [],
        exportedAt: new Date().toISOString(),
      };

      if (format === "json") {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `nudge-data-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === "csv") {
        // Simple CSV export of goals
        const csvContent = [
          ["Título", "Descripción", "Completada", "Fecha Creación", "Fecha Completado"].join(","),
          ...exportData.goals.map((goal: any) =>
            [
              `"${goal.title}"`,
              `"${goal.description || ""}"`,
              goal.is_completed ? "Sí" : "No",
              new Date(goal.created_at).toLocaleDateString(),
              goal.completed_at ? new Date(goal.completed_at).toLocaleDateString() : "-",
            ].join(",")
          ),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `nudge-goals-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }

      toast({
        title: "Datos exportados",
        description: `Tus datos han sido exportados como ${format.toUpperCase()}`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al exportar",
        description: error.message,
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md animate-scale-in">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary animate-bounce-subtle" />
            Exportar Datos
          </DialogTitle>
          <DialogDescription>
            Descarga toda tu información de Nudge
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <Card className="hover-lift">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center animate-pulse-glow">
                  <FileJson className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">Formato JSON</CardTitle>
                  <CardDescription className="text-xs">
                    Todos los datos en formato estructurado
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Button
                className="w-full btn-interactive hover:scale-105"
                onClick={() => exportData("json")}
                disabled={exporting}
              >
                {exporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Descargar JSON
              </Button>
            </CardContent>
          </Card>

          <Card className="hover-lift animate-fade-in" style={{ animationDelay: '200ms' }}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center animate-pulse-glow">
                  <FileText className="w-5 h-5 text-success" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">Formato CSV</CardTitle>
                  <CardDescription className="text-xs">
                    Metas en formato de hoja de cálculo
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Button
                variant="outline"
                className="w-full btn-interactive hover:scale-105"
                onClick={() => exportData("csv")}
                disabled={exporting}
              >
                {exporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Descargar CSV
              </Button>
            </CardContent>
          </Card>

          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-start gap-2 text-sm">
              <Database className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-muted-foreground">
                Los datos exportados incluyen tu perfil, Focus Rooms, metas, estadísticas y logros
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDataModal;