import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const url = new URL(req.url);
  const roomId = url.searchParams.get("roomId");
  const userId = url.searchParams.get("userId");
  
  if (!roomId) {
    return new Response("roomId parameter is required", { status: 400 });
  }

  try {
    // Get room data and user context
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let room = null;
    
    // If it's not master_ai, fetch the room from database
    if (roomId !== 'master_ai') {
      const { data } = await supabase
        .from('focus_rooms')
        .select('*')
        .eq('id', roomId)
        .single();
      
      if (!data) {
        return new Response("Room not found", { status: 404 });
      }
      room = data;
    }

    // Get user context
    let userContext = "";
    if (userId) {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, age, gender, interests, user_story')
        .eq('id', userId)
        .maybeSingle();

      if (profile) {
        userContext += `\n\nINFORMACIÓN DEL USUARIO:`;
        userContext += `\nNombre: ${profile.full_name || 'Usuario'}`;
        if (profile.age) userContext += `\nEdad: ${profile.age} años`;
        if (profile.gender) userContext += `\nGénero: ${profile.gender}`;
        if (profile.interests) userContext += `\nIntereses: ${profile.interests}`;
        if (profile.user_story) userContext += `\nHistoria: ${profile.user_story}`;
      }

      // Get latest check-in
      const { data: latestCheckIn } = await supabase
        .from("daily_check_ins")
        .select("mood, notes, check_in_date")
        .eq("user_id", userId)
        .order("check_in_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestCheckIn) {
        const moodLabels: Record<string, string> = {
          great: "excelente",
          good: "bien",
          okay: "normal",
          bad: "mal"
        };
        
        const moodText = moodLabels[latestCheckIn.mood] || latestCheckIn.mood;
        const today = new Date().toISOString().split('T')[0];
        const isToday = latestCheckIn.check_in_date === today;
        
        userContext += `\n\nESTADO EMOCIONAL:`;
        userContext += `\nÚltimo check-in (${isToday ? 'hoy' : latestCheckIn.check_in_date}): Se siente ${moodText}`;
        
        if (latestCheckIn.notes) {
          userContext += `\nNotas: "${latestCheckIn.notes}"`;
        }
      }

      // Get active focus rooms
      const { data: focusRooms } = await supabase
        .from('focus_rooms')
        .select('name, area_category, description')
        .eq('user_id', userId)
        .limit(5);

      if (focusRooms && focusRooms.length > 0) {
        userContext += `\n\nÁREAS DE ENFOQUE DEL USUARIO:`;
        focusRooms.forEach(room => {
          userContext += `\n- ${room.name} (${room.area_category})`;
          if (room.description) userContext += `: ${room.description}`;
        });
      }

      // Get active goals
      const { data: goals } = await supabase
        .from('goals')
        .select('title, description')
        .eq('user_id', userId)
        .eq('is_completed', false)
        .limit(5);

      if (goals && goals.length > 0) {
        userContext += `\n\nMETAS ACTIVAS:`;
        goals.forEach(goal => {
          userContext += `\n- ${goal.title}`;
          if (goal.description) userContext += `: ${goal.description}`;
        });
      }

      // Get active habits
      const { data: habits } = await supabase
        .from('habits')
        .select('title, description, streak')
        .eq('user_id', userId)
        .order('streak', { ascending: false })
        .limit(5);

      if (habits && habits.length > 0) {
        userContext += `\n\nHÁBITOS:`;
        habits.forEach(habit => {
          userContext += `\n- ${habit.title} (racha: ${habit.streak} días)`;
          if (habit.description) userContext += `: ${habit.description}`;
        });
      }

      if (userContext) {
        userContext += `\n\nUSA ESTA INFORMACIÓN para personalizar la conversación y ser más empático y relevante.`;
      }
    }

    const { socket, response } = Deno.upgradeWebSocket(req);
    
    // Connect to OpenAI Realtime API
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }
    
    // For Deno WebSocket, we need to use the Authorization in the subprotocol
    const openAIUrl = `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01`;
    const openAISocket = new WebSocket(openAIUrl, [
      `realtime`,
      `openai-insecure-api-key.${OPENAI_API_KEY}`,
      `openai-beta.realtime-v1`
    ]);

    let sessionConfigured = false;

    // Build system instructions based on room data
    const buildSystemInstructions = () => {
      // Default instructions for master_ai
      if (!room) {
        return `Eres Nudge, el coach personal de vida del usuario. Tu propósito es ayudar a las personas a alcanzar sus metas, desarrollar buenos hábitos y vivir una vida más plena y satisfactoria.

Reglas de comunicación:
- Sé conciso: respuestas de máximo 2-3 oraciones cortas en cada intervención
- NUNCA uses asteriscos (*) para énfasis, usa palabras simples
- Habla como un amigo cercano, no como un libro de autoayuda
- Evita repetir las mismas frases o ideas
- Ve directo al punto sin preámbulos largos
- No repitas lo que el usuario ya dijo
- Si el usuario pregunta algo simple, responde simple

Tu estilo:
- Conversacional y auténtico, como en una llamada con un amigo
- Práctico: da pasos concretos, no teoría
- Empático pero directo
- Celebra logros brevemente, sin exagerar
- Mantén un tono cálido pero profesional

${userContext}`;
      }
      
      // Custom instructions for specific focus rooms
      let instructions = `Eres el bot de coaching especializado en "${room.name}". `;
      
      if (room.description) {
        instructions += `Descripción del área: ${room.description}. `;
      }
      
      instructions += `\n\nReglas de comunicación:
- Sé conciso: respuestas de máximo 2-3 oraciones cortas en cada intervención
- NUNCA uses asteriscos (*) para énfasis, usa palabras simples
- Habla como un amigo cercano que es experto en el tema
- Evita repetir las mismas frases o ideas
- Ve directo al punto sin preámbulos largos

Tu estilo:
- Conversacional y auténtico
- Práctico: da pasos concretos y específicos
- Enfocado solo en este objetivo
- Tono ${room.bot_tone || 'motivacional'}

`;
      
      if (room.bot_knowledge) {
        instructions += `Conocimiento específico: ${room.bot_knowledge}\n\n`;
      }
      
      instructions += `Ayuda al usuario a alcanzar sus metas en esta área con consejos prácticos y motivación.`;
      instructions += userContext;
      
      return instructions;
    };

    openAISocket.onopen = () => {
      console.log('✅ Connected to OpenAI Realtime API');
    };

    openAISocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('OpenAI event:', data.type);

        // Configure session after receiving session.created
        if (data.type === 'session.created' && !sessionConfigured) {
          sessionConfigured = true;
          console.log('Configuring session...');
          
          const sessionConfig = {
            type: 'session.update',
            session: {
              modalities: ['text', 'audio'],
              instructions: buildSystemInstructions(),
              voice: room?.bot_voice || 'alloy',
              input_audio_format: 'pcm16',
              output_audio_format: 'pcm16',
              input_audio_transcription: {
                model: 'whisper-1'
              },
              turn_detection: {
                type: 'server_vad',
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 1000
              },
              temperature: 0.8,
              max_response_output_tokens: 'inf'
            }
          };
          
          openAISocket.send(JSON.stringify(sessionConfig));
          console.log('Session configured');
        }

        // Forward all messages to client
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(event.data);
        }
      } catch (error) {
        console.error('Error processing OpenAI message:', error);
      }
    };

    openAISocket.onerror = (error) => {
      console.error('OpenAI WebSocket error:', error);
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ 
          type: 'error', 
          error: 'OpenAI connection error' 
        }));
      }
    };

    openAISocket.onclose = () => {
      console.log('OpenAI connection closed');
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };

    // Forward client messages to OpenAI
    socket.onmessage = (event) => {
      try {
        if (openAISocket.readyState === WebSocket.OPEN) {
          openAISocket.send(event.data);
        }
      } catch (error) {
        console.error('Error forwarding client message:', error);
      }
    };

    socket.onclose = () => {
      console.log('Client disconnected');
      if (openAISocket.readyState === WebSocket.OPEN) {
        openAISocket.close();
      }
    };

    socket.onerror = (error) => {
      console.error('Client WebSocket error:', error);
    };

    return response;
  } catch (error) {
    console.error('Error in realtime-voice function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
