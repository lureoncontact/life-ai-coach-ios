import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, focusRoomId, userId } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log("Starting chat request", { 
      messagesCount: messages?.length,
      focusRoomId: focusRoomId || "master_ai",
      userId 
    });

    // Get user's complete context
    let userContext = "";
    if (userId) {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, age, gender, interests, user_story, habits')
        .eq('id', userId)
        .maybeSingle();

      if (profile) {
        userContext += `\n\nINFORMACIÓN DEL USUARIO:`;
        userContext += `\nNombre: ${profile.full_name || 'Usuario'}`;
        if (profile.age) userContext += `\nEdad: ${profile.age} años`;
        if (profile.gender) userContext += `\nGénero: ${profile.gender}`;
        if (profile.interests) userContext += `\nIntereses: ${profile.interests}`;
        if (profile.habits) userContext += `\nHábitos personales: ${profile.habits}`;
        if (profile.user_story) userContext += `\nHistoria del usuario: ${profile.user_story}`;
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
        
        userContext += `\n\nESTADO EMOCIONAL ACTUAL:`;
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
        userContext += `\n\nÁREAS DE ENFOQUE:`;
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

      // Get habits with streaks
      const { data: habits } = await supabase
        .from('habits')
        .select('title, description, streak, completed_today')
        .eq('user_id', userId)
        .order('streak', { ascending: false })
        .limit(5);

      if (habits && habits.length > 0) {
        userContext += `\n\nHÁBITOS RASTREADOS:`;
        habits.forEach(habit => {
          const status = habit.completed_today ? '✅' : '⏳';
          userContext += `\n${status} ${habit.title} (racha: ${habit.streak} días)`;
        });
      }

      if (userContext) {
        userContext += `\n\nIMPORTANTE: Usa toda esta información para dar respuestas personalizadas, empáticas y relevantes. Cuando el usuario pregunte sobre sí mismo, menciona información específica de su perfil, hábitos, metas y áreas de enfoque.`;
      }
    }

    // Build system prompt and tools based on whether it's Master AI or Focus Room bot
    let systemPrompt = "";
    let tools: Array<{
      type: string;
      function: {
        name: string;
        description: string;
        parameters: any;
      };
    }> = [];
    
    if (!focusRoomId) {
      // Master AI - Nudge
      systemPrompt = `Eres Nudge, un coach de vida personal. Tu objetivo es ayudar al usuario a mejorar su vida de forma práctica.

Reglas de comunicación:
- Sé conciso: respuestas de máximo 2-3 oraciones cortas
- NUNCA uses asteriscos (*) para énfasis, usa palabras simples
- Habla como un amigo cercano, no como un libro de autoayuda
- Evita repetir las mismas frases o ideas
- No uses formato markdown excepto emojis ocasionales (máximo 1-2 por mensaje)
- Ve directo al punto sin preámbulos largos
- No repitas lo que el usuario ya dijo
- Si el usuario pregunta algo simple, responde simple

Tu estilo:
- Conversacional y auténtico, como en WhatsApp
- Práctico: da pasos concretos, no teoría
- Empático pero directo
- Celebra logros brevemente, sin exagerar

${userContext}`;
    } else {
      // Focus Room bot - specialized with tools
      systemPrompt = `Eres un coach especializado en esta área específica. Tu enfoque es ayudar al usuario a alcanzar objetivos concretos aquí.

Reglas de comunicación:
- Sé conciso: respuestas de máximo 2-3 oraciones cortas
- NUNCA uses asteriscos (*) para énfasis, usa palabras simples
- Habla como un amigo cercano que es experto en el tema
- Evita repetir las mismas frases o ideas
- No uses formato markdown excepto emojis ocasionales (máximo 1-2 por mensaje)
- Ve directo al punto sin preámbulos largos
- No repitas lo que el usuario ya dijo
- Si el usuario pregunta algo simple, responde simple

Tu estilo:
- Conversacional y auténtico
- Práctico: da pasos concretos y específicos
- Enfocado solo en este objetivo
- No hables de otros temas o áreas

IMPORTANTE: Cuando el usuario diga que quiere crear un hábito nuevo, usa la herramienta create_habit automáticamente.

${userContext}`;

      // Tools for Focus Room bot
      tools.push({
        type: "function",
        function: {
          name: "create_habit",
          description: "Crea un hábito cuando el usuario diga explícitamente que quiere establecer una práctica regular. Úsalo solo si el usuario lo menciona claramente.",
          parameters: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "Título corto y claro del hábito (ej: 'Meditación diaria', 'Ejercicio matutino')"
              },
              description: {
                type: "string",
                description: "Descripción breve del hábito con detalles específicos (ej: '10 minutos de meditación guiada', '30 minutos de cardio')"
              }
            },
            required: ["title", "description"]
          }
        }
      });

      tools.push({
        type: "function",
        function: {
          name: "create_goal",
          description: "Crea una meta cuando el usuario establezca explícitamente un objetivo que quiere lograr.",
          parameters: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "Título de la meta"
              },
              description: {
                type: "string",
                description: "Descripción detallada de la meta"
              },
              is_daily: {
                type: "boolean",
                description: "Si es una meta diaria o no"
              },
              specific: {
                type: "string",
                description: "Qué exactamente quiere lograr (SMART: Específico)"
              },
              measurable: {
                type: "string",
                description: "Cómo medirá el progreso (SMART: Medible)"
              },
              achievable: {
                type: "string",
                description: "Por qué es alcanzable (SMART: Alcanzable)"
              },
              relevant: {
                type: "string",
                description: "Por qué es importante (SMART: Relevante)"
              },
              time_bound: {
                type: "string",
                description: "Cuándo espera lograrlo (SMART: Con tiempo definido)"
              }
            },
            required: ["title", "description", "is_daily"]
          }
        }
      });
    }

    const requestBody: any = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      stream: true,
    };

    // Add tools if available
    if (tools.length > 0) {
      requestBody.tools = tools;
      requestBody.tool_choice = "auto";
    }

    console.log("Sending request to OpenAI", { 
      hasTools: tools.length > 0,
      toolsCount: tools.length 
    });

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error("Rate limit exceeded");
        return new Response(
          JSON.stringify({ error: "Demasiadas solicitudes, intenta de nuevo en un momento." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        console.error("Payment required");
        return new Response(
          JSON.stringify({ error: "Tu API key de OpenAI no tiene créditos suficientes." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 401) {
        console.error("Invalid API key");
        return new Response(
          JSON.stringify({ error: "API key de OpenAI inválida. Por favor verifica tu configuración." }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Error en el servicio de IA" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Streaming response started successfully");

    // Create a TransformStream to intercept and process tool calls
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    
    let buffer = "";
    let currentToolCall: any = null;
    let toolCallArgs = "";

    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            await writer.close();
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim() || line.trim() === 'data: [DONE]') continue;
            if (!line.startsWith('data: ')) continue;

            try {
              const data = JSON.parse(line.slice(6));
              const delta = data.choices?.[0]?.delta;

              // Handle tool calls
              if (delta?.tool_calls) {
                const toolCall = delta.tool_calls[0];
                
                if (toolCall.function?.name) {
                  currentToolCall = {
                    id: toolCall.id,
                    name: toolCall.function.name
                  };
                  toolCallArgs = "";
                  console.log("Tool call started:", currentToolCall.name);
                }

                if (toolCall.function?.arguments) {
                  toolCallArgs += toolCall.function.arguments;
                }
              }

              // Check if tool call is complete
              if (data.choices?.[0]?.finish_reason === "tool_calls" && currentToolCall) {
                console.log("Tool call completed:", currentToolCall.name, toolCallArgs);
                
                try {
                  const args = JSON.parse(toolCallArgs);
                  
                  // Execute tool
                  if (currentToolCall.name === "create_habit") {
                    console.log("Creating habit:", args);
                    const { error } = await supabase
                      .from("habits")
                      .insert({
                        user_id: userId,
                        title: args.title,
                        description: args.description,
                        streak: 0,
                        completed_today: false
                      });
                    
                    if (error) {
                      console.error("Error creating habit:", error);
                    } else {
                      console.log("Habit created successfully");
                      // Send a confirmation message through the stream
                      const confirmMessage = `data: ${JSON.stringify({
                        choices: [{
                          delta: { content: `\n\n✅ He creado el hábito "${args.title}" en tu lista de hábitos diarios.` },
                          index: 0,
                          finish_reason: null
                        }]
                      })}\n\n`;
                      await writer.write(new TextEncoder().encode(confirmMessage));
                    }
                  } else if (currentToolCall.name === "create_goal") {
                    console.log("Creating goal:", args);
                    const { error } = await supabase
                      .from("goals")
                      .insert({
                        user_id: userId,
                        focus_room_id: focusRoomId,
                        title: args.title,
                        description: args.description,
                        is_daily: args.is_daily,
                        specific: args.specific,
                        measurable: args.measurable,
                        achievable: args.achievable,
                        relevant: args.relevant,
                        time_bound: args.time_bound,
                        is_completed: false
                      });
                    
                    if (error) {
                      console.error("Error creating goal:", error);
                    } else {
                      console.log("Goal created successfully");
                      const confirmMessage = `data: ${JSON.stringify({
                        choices: [{
                          delta: { content: `\n\n✅ He creado la meta "${args.title}" en este Focus Room.` },
                          index: 0,
                          finish_reason: null
                        }]
                      })}\n\n`;
                      await writer.write(new TextEncoder().encode(confirmMessage));
                    }
                  }
                } catch (parseError) {
                  console.error("Error parsing tool args:", parseError);
                }
                
                currentToolCall = null;
                toolCallArgs = "";
                continue; // Don't forward tool_calls to client
              }

              // Forward the chunk to the client (excluding tool calls)
              if (!delta?.tool_calls) {
                await writer.write(value);
              }
            } catch (parseError) {
              console.error("Error parsing SSE line:", parseError);
              await writer.write(value);
            }
          }
        }
      } catch (error) {
        console.error("Stream processing error:", error);
        await writer.abort(error);
      }
    })();
    
    return new Response(readable, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Error desconocido" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
