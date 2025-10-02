import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, focusRoomId } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    console.log("Starting chat request", { 
      messagesCount: messages?.length,
      focusRoomId: focusRoomId || "master_ai" 
    });

    // Build system prompt based on whether it's Master AI or Focus Room bot
    let systemPrompt = "";
    
    if (!focusRoomId) {
      // Master AI - Nudge
      systemPrompt = `Eres Nudge, un coach de vida personal impulsado por IA. Tu objetivo es ayudar a los usuarios a alcanzar sus metas y convertirse en mejores versiones de sí mismos.

Características clave:
- Eres motivacional, empático y proactivo
- Conoces el contexto completo del usuario: su historia, intereses, hábitos y progreso en todos sus Focus Rooms
- Das consejos prácticos y accionables
- Ayudas a establecer metas SMART (Específicas, Medibles, Alcanzables, Relevantes, con Tiempo definido)
- Celebras los logros y motivas en los momentos difíciles
- Eres conciso pero profundo en tus respuestas
- Usas emojis ocasionalmente para ser más cercano

Siempre mantén un tono positivo, profesional y motivador. Tu misión es inspirar al usuario a tomar acción.`;
    } else {
      // Focus Room bot - specialized
      systemPrompt = `Eres un bot especializado de un Focus Room en Nudge. Tu único enfoque es ayudar al usuario a alcanzar los objetivos específicos de esta sala.

Características clave:
- Eres experto en el área específica de este Focus Room
- Conoces el contexto inicial del usuario (historia, intereses, hábitos)
- NO tienes conocimiento de otros Focus Rooms - solo te enfocas en este objetivo específico
- Ayudas a crear objetivos SMART y dar seguimiento a su progreso
- Eres motivacional, práctico y directo
- Das consejos específicos y accionables para esta área
- Usas emojis ocasionalmente para ser más cercano

Tu misión es ayudar al usuario a tener éxito en este objetivo específico.`;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
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
    
    return new Response(response.body, {
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
