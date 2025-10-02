import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PhoneOff } from "lucide-react";
import nudgeIcon from "@/assets/nudge_icon.png";

interface PhoneCallInterfaceProps {
  onHangup: () => void;
}

const PhoneCallInterface = ({ onHangup }: PhoneCallInterfaceProps) => {
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-primary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center space-y-8 animate-scale-in">
        <div className="space-y-4">
          <div className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
            <img src={nudgeIcon} alt="Nudge" className="w-16 h-16" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Nudge</h2>
            <p className="text-muted-foreground">En llamada...</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-4xl font-mono font-bold text-primary">
            {formatDuration(duration)}
          </div>
          <p className="text-sm text-muted-foreground">Duración de la llamada</p>
        </div>

        <div className="flex justify-center gap-4 pt-4">
          <Button
            size="lg"
            variant="destructive"
            className="w-16 h-16 rounded-full"
            onClick={onHangup}
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Conectado con tu coach personal
        </p>
      </Card>
    </div>
  );
};

export default PhoneCallInterface;
