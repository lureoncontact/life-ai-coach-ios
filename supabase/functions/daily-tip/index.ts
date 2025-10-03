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

    // Generic tips as fallback
    const genericTips = [
      "Empieza el día con una meta pequeña y alcanzable. El momentum es tu mejor aliado.",
      "La constancia vence al talento. Haz una cosa bien hoy, aunque sea pequeña.",
      "Tu racha actual es tu compromiso contigo mismo. Protégela.",
      "Los hábitos se construyen con decisiones diarias. ¿Qué decides hoy?",
      "El progreso no siempre es visible. Confía en el proceso.",
      "Cada día es una oportunidad para ser 1% mejor que ayer.",
      "No rompas la cadena. Tu yo del futuro te lo agradecerá.",
      "La disciplina es elegir entre lo que quieres ahora y lo que quieres más.",
      "Los pequeños cambios sostenidos crean grandes resultados.",
      "Hoy es un buen día para cumplir tus compromisos contigo mismo."
    ];

    // Build context about the user
    let userContext = `Usuario: ${userName}, Nivel: ${level}, Puntos: ${totalPoints}, Racha: ${currentStreak} días.`;
    let hasEnoughData = false;
    
    if (habits && habits.length > 0) {
      hasEnoughData = true;
      const habitsInfo = habits.map((h: any) => 
        `${h.title} (racha: ${h.streak}, completado hoy: ${h.completed_today ? 'sí' : 'no'})`
      ).join(", ");
      userContext += ` Hábitos: ${habitsInfo}.`;
    }

    if (recentMoods && recentMoods.length > 0) {
      hasEnoughData = true;
      const lastMood = recentMoods[0];
      userContext += ` Último estado de ánimo: ${lastMood.mood}.`;
      if (lastMood.notes) {
        userContext += ` Notas: ${lastMood.notes}`;
      }
    }

    if (focusRooms && focusRooms.length > 0) {
      hasEnoughData = true;
      const roomsInfo = focusRooms.map((r: any) => r.name).join(", ");
      userContext += ` Focus Rooms activos: ${roomsInfo}.`;
    }

    // If not enough data, return generic tip
    if (!hasEnoughData || !userName) {
      const randomTip = genericTips[Math.floor(Math.random() * genericTips.length)];
      return new Response(JSON.stringify({ tip: randomTip }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try to generate personalized tip
    try {
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
        console.error("AI Gateway error:", response.status, await response.text());
        throw new Error("AI generation failed");
      }

      const aiData = await response.json();
      const tip = aiData.choices?.[0]?.message?.content?.trim();

      if (!tip) {
        throw new Error("No tip generated");
      }

      return new Response(JSON.stringify({ tip }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (aiError) {
      console.error("AI generation error, using generic tip:", aiError);
      // Fallback to generic tip
      const randomTip = genericTips[Math.floor(Math.random() * genericTips.length)];
      return new Response(JSON.stringify({ tip: randomTip }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
