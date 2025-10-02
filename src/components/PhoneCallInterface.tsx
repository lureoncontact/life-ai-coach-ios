import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PhoneOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import nudgeIcon from "@/assets/nudge_icon.png";
import { AudioRecorder, encodeAudioForAPI, playAudioData, clearAudioQueue } from '@/utils/RealtimeAudio';

interface PhoneCallInterfaceProps {
  onHangup: () => void;
}

const PhoneCallInterface = ({ onHangup }: PhoneCallInterfaceProps) => {
  const { toast } = useToast();
  const [duration, setDuration] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Start voice connection when component mounts
    connect();
    
    const interval = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
      disconnect();
    };
  }, []);

  const connect = async () => {
    try {
      console.log('Starting voice call connection...');
      
      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone permission granted');

      // Initialize audio context
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
        console.log('Audio context initialized');
      }

      // Get user ID from supabase
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || '';

      // Connect to WebSocket for Master AI with userId
      const wsUrl = `wss://mecywtbdycgfhsigztaf.supabase.co/functions/v1/realtime-voice?roomId=master_ai&userId=${userId}`;
      console.log('Connecting to:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket connected successfully');
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📩 Received event:', data.type);

          if (data.type === 'session.created') {
            console.log('Session created successfully');
          } else if (data.type === 'session.updated') {
            console.log('✅ Session configured, starting recorder');
            await startRecorder();
            setIsConnected(true);
            toast({
              title: "Conectado",
              description: "Ya puedes hablar con Nudge",
            });
          } else if (data.type === 'response.audio.delta') {
            const binaryString = atob(data.delta);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            if (audioContextRef.current) {
              await playAudioData(audioContextRef.current, bytes);
            }
            setIsSpeaking(true);
          } else if (data.type === 'response.done' || data.type === 'response.audio.done') {
            setIsSpeaking(false);
          } else if (data.type === 'error') {
            console.error('❌ OpenAI error:', data.error);
            toast({
              variant: "destructive",
              title: "Error",
              description: data.error?.message || "Error en la llamada",
            });
          }
        } catch (error) {
          console.error('❌ Error processing message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        toast({
          variant: "destructive",
          title: "Error de conexión",
          description: "No se pudo conectar la llamada. Verifica tu conexión a internet.",
        });
        setIsConnected(false);
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        // No mostrar toast al colgar normalmente
      };

    } catch (error) {
      console.error('❌ Error starting call:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'No se pudo iniciar la llamada',
      });
      setIsConnected(false);
    }
  };

  const startRecorder = async () => {
    try {
      recorderRef.current = new AudioRecorder((audioData) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const base64Audio = encodeAudioForAPI(audioData);
          wsRef.current.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: base64Audio
          }));
        }
      });
      await recorderRef.current.start();
      console.log('Recorder started for call');
    } catch (error) {
      console.error('Error starting recorder:', error);
      throw error;
    }
  };

  const disconnect = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    
    wsRef.current?.close();
    wsRef.current = null;
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    clearAudioQueue();
    setIsConnected(false);
    setIsSpeaking(false);
  };

  const handleHangup = () => {
    disconnect();
    onHangup();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-primary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center space-y-8 animate-scale-in">
        <div className="space-y-4">
          <div className={`w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center ${isSpeaking ? 'animate-pulse ring-4 ring-primary/50' : 'animate-pulse'}`}>
            <img src={nudgeIcon} alt="Nudge" className="w-16 h-16" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Nudge</h2>
            <p className="text-muted-foreground">
              {!isConnected ? 'Conectando...' : isSpeaking ? 'Nudge está hablando...' : 'En llamada - Habla con Nudge'}
            </p>
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
            className="w-16 h-16 rounded-full hover:scale-110 transition-transform"
            onClick={handleHangup}
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          {isConnected ? '🎤 Micrófono activo - Habla libremente' : 'Estableciendo conexión...'}
        </p>
      </Card>
    </div>
  );
};

export default PhoneCallInterface;
