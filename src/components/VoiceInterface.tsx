import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { AudioRecorder, encodeAudioForAPI, playAudioData, clearAudioQueue } from '@/utils/RealtimeAudio';

interface VoiceInterfaceProps {
  roomId: string;
  onTranscriptUpdate?: (transcript: string, isUser: boolean) => void;
}

const VoiceInterface = ({ roomId, onTranscriptUpdate }: VoiceInterfaceProps) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentTranscriptRef = useRef<string>('');
  const currentUserTranscriptRef = useRef<string>('');

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const connect = async () => {
    setIsConnecting(true);
    
    try {
      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Initialize audio context
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      }

      // Connect to WebSocket
      const wsUrl = `wss://mecywtbdycgfhsigztaf.supabase.co/functions/v1/realtime-voice?roomId=${roomId}`;
      console.log('Connecting to:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received event:', data.type);

          if (data.type === 'session.created') {
            console.log('Session created, waiting for configuration...');
          } else if (data.type === 'session.updated') {
            console.log('Session configured, starting recorder');
            await startRecorder();
            setIsConnected(true);
            setIsConnecting(false);
            toast({
              title: "Conectado",
              description: "Chat de voz activo. Puedes empezar a hablar.",
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
          } else if (data.type === 'response.audio_transcript.delta') {
            currentTranscriptRef.current += data.delta;
            setIsSpeaking(true);
          } else if (data.type === 'response.audio_transcript.done') {
            console.log('AI transcript:', currentTranscriptRef.current);
            if (onTranscriptUpdate && currentTranscriptRef.current) {
              onTranscriptUpdate(currentTranscriptRef.current, false);
            }
            currentTranscriptRef.current = '';
          } else if (data.type === 'conversation.item.input_audio_transcription.completed') {
            console.log('User transcript:', data.transcript);
            if (onTranscriptUpdate && data.transcript) {
              onTranscriptUpdate(data.transcript, true);
            }
          } else if (data.type === 'response.done' || data.type === 'response.audio.done') {
            setIsSpeaking(false);
          } else if (data.type === 'error') {
            console.error('OpenAI error:', data.error);
            toast({
              variant: "destructive",
              title: "Error",
              description: data.error?.message || "Error en la conexión de voz",
            });
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnecting(false);
        toast({
          variant: "destructive",
          title: "Error de conexión",
          description: "No se pudo conectar al servicio de voz",
        });
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
        setIsConnected(false);
        setIsConnecting(false);
        setIsSpeaking(false);
      };

    } catch (error) {
      console.error('Error starting conversation:', error);
      setIsConnecting(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'No se pudo iniciar el chat de voz',
      });
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
      console.log('Recorder started');
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
    setIsConnecting(false);
    setIsSpeaking(false);
  };

  return (
    <div className="flex items-center gap-2">
      {!isConnected && !isConnecting && (
        <Button 
          onClick={connect}
          variant="outline"
          size="icon"
          className="rounded-full"
        >
          <Mic className="w-5 h-5" />
        </Button>
      )}
      
      {isConnecting && (
        <Button 
          variant="outline"
          size="icon"
          className="rounded-full"
          disabled
        >
          <Loader2 className="w-5 h-5 animate-spin" />
        </Button>
      )}
      
      {isConnected && (
        <Button 
          onClick={disconnect}
          variant={isSpeaking ? "default" : "destructive"}
          size="icon"
          className={`rounded-full ${isSpeaking ? 'animate-pulse' : ''}`}
        >
          <MicOff className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
};

export default VoiceInterface;
