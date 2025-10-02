import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, DollarSign, TrendingUp } from "lucide-react";

interface SavingsTrackerProps {
  roomId: string;
}

const SavingsTracker = ({ roomId }: SavingsTrackerProps) => {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [records, setRecords] = useState<any[]>([]);
  const [totalSavings, setTotalSavings] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadRecords();
  }, [roomId]);

  const loadRecords = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("savings_records")
      .select("*")
      .eq("focus_room_id", roomId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      setRecords(data);
      const total = data.reduce((sum, record) => sum + parseFloat(record.amount.toString()), 0);
      setTotalSavings(total);
    }
  };

  const addSaving = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ingresa una cantidad válida",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("savings_records").insert({
      user_id: user.id,
      focus_room_id: roomId,
      amount: parseFloat(amount),
      description: description || null,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar el ahorro",
      });
      return;
    }

    toast({
      title: "¡Ahorro registrado! 💰",
      description: `Has ahorrado $${amount}`,
    });

    setAmount("");
    setDescription("");
    loadRecords();
  };

  return (
    <div className="space-y-4 w-full max-w-full">
      <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20 w-full">
        <CardHeader className="p-4">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              💰 Total Ahorrado
            </span>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-3xl font-bold text-green-600">
            ${totalSavings.toFixed(2)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {records.length} registro{records.length !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader className="p-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="w-5 h-5" />
            Registrar Ahorro
          </CardTitle>
          <CardDescription className="text-sm">
            Agrega un nuevo ahorro a tu registro
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0">
          <div className="space-y-2">
            <Label htmlFor="amount">Cantidad</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Input
              id="description"
              placeholder="Ej: Ahorro mensual, propina, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <Button onClick={addSaving} className="w-full btn-interactive">
            <Plus className="w-4 h-4 mr-2" />
            Agregar Ahorro
          </Button>
        </CardContent>
      </Card>

      {records.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Historial de Ahorros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {records.slice(0, 5).map((record) => (
                <div
                  key={record.id}
                  className="flex justify-between items-center p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <div className="font-bold text-green-600">
                      ${parseFloat(record.amount).toFixed(2)}
                    </div>
                    {record.description && (
                      <div className="text-sm text-muted-foreground">
                        {record.description}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    {new Date(record.date).toLocaleDateString()}
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

export default SavingsTracker;
