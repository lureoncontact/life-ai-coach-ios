import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Share2, Copy, Check, Mail, MessageSquare } from "lucide-react";

interface ShareRoomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  roomName: string;
}

const ShareRoomModal = ({ open, onOpenChange, roomId, roomName }: ShareRoomModalProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  const shareUrl = `${window.location.origin}/focus-room/${roomId}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({
      title: "Enlace copiado",
      description: "El enlace ha sido copiado al portapapeles",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Te invito a mi Focus Room: ${roomName}`);
    const body = encodeURIComponent(
      `Hola,\n\nQuiero compartir contigo mi Focus Room "${roomName}" en Nudge.\n\nAccede aquí: ${shareUrl}\n\n¡Espero que te sea útil!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(
      `¡Mira mi Focus Room "${roomName}" en Nudge! ${shareUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Compartir Focus Room
          </DialogTitle>
          <DialogDescription>
            Comparte "{roomName}" con otros usuarios
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Enlace de la sala</Label>
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly className="flex-1" />
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
                className="flex-shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Cualquier persona con este enlace podrá ver la sala (próximamente)
            </p>
          </div>

          <div className="space-y-2">
            <Label>Compartir vía</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={shareViaEmail}
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={shareViaWhatsApp}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
            </div>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            💡 <strong>Próximamente:</strong> Podrás colaborar en tiempo real con otros usuarios en tus Focus Rooms
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareRoomModal;