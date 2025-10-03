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
    const { userName, currentStreak, totalPoints, level, habits, recentMoods, focusRooms } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context about the user
    let userContext = `Usuario: ${userName}, Nivel: ${level}, Puntos: ${totalPoints}, Racha: ${currentStreak} días.`;
    
    if (habits && habits.length > 0) {
      const habitsInfo = habits.map((h: any) => 
        `${h.title} (racha: ${h.streak}, completado hoy: ${h.completed_today ? 'sí' : 'no'})`
      ).join(", ");
      userContext += ` Hábitos: ${habitsInfo}.`;
    }

    if (recentMoods && recentMoods.length > 0) {
      const lastMood = recentMoods[0];
      userContext += ` Último estado de ánimo: ${lastMood.mood}.`;
      if (lastMood.notes) {
        userContext += ` Notas: ${lastMood.notes}`;
      }
    }

    if (focusRooms && focusRooms.length > 0) {
      const roomsInfo = focusRooms.map((r: any) => r.name).join(", ");
      userContext += ` Focus Rooms activos: ${roomsInfo}.`;
    }

    const systemPrompt = `Eres Nudge, un coach de vida empático y directo. 
Genera un tip breve y específico (máximo 2 oraciones) basado en el progreso del usuario.
El tip debe ser:
- Personalizado según su situación actual
- Accionable y específico
- Motivador pero realista
- En español, usando "tú"
NO uses emojis. Sé directo y útil.`;

    const userPrompt = `Contexto del usuario: ${userContext}

Genera un tip personalizado para ayudarle hoy.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 150
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const tip = aiData.choices?.[0]?.message?.content?.trim();

    if (!tip) {
      throw new Error("No tip generated");
    }

    return new Response(JSON.stringify({ tip }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
