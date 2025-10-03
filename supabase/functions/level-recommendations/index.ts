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
    const { currentLevel, totalPoints, currentStreak, habits, recentMoods } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Generic recommendations as fallback
    const genericRecommendations = [
      "Enfócate en completar todos tus hábitos diarios. Cada hábito completado te acerca al siguiente nivel.",
      "Mantén tu racha activa. La consistencia es más poderosa que la intensidad.",
      "Revisa tus Focus Rooms y establece metas claras para cada área de tu vida.",
      "Completa tu check-in diario para que Nudge pueda darte mejor soporte personalizado.",
      "Divide tus grandes metas en acciones pequeñas y alcanzables para hoy.",
    ];

    // Build context
    let userContext = `Nivel actual: ${currentLevel}, Puntos: ${totalPoints}, Racha: ${currentStreak} días.`;
    let hasEnoughData = false;

    if (habits && habits.length > 0) {
      hasEnoughData = true;
      const completedToday = habits.filter((h: any) => h.completed_today).length;
      const avgStreak = habits.reduce((sum: number, h: any) => sum + h.streak, 0) / habits.length;
      userContext += ` Hábitos: ${completedToday}/${habits.length} completados hoy, racha promedio: ${avgStreak.toFixed(1)} días.`;
    }

    if (recentMoods && recentMoods.length > 0) {
      hasEnoughData = true;
      const lastMood = recentMoods[0]?.mood;
      userContext += ` Estado de ánimo reciente: ${lastMood}.`;
    }

    // If not enough data, return generic recommendation
    if (!hasEnoughData) {
      const randomRec = genericRecommendations[Math.floor(Math.random() * genericRecommendations.length)];
      return new Response(JSON.stringify({ recommendation: randomRec }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate personalized recommendation
    try {
      const nextLevel = currentLevel + 1;
      const pointsNeeded = (nextLevel * 100) - totalPoints;

      const systemPrompt = `Eres Nudge, un coach de vida experto en gamificación y formación de hábitos.
Genera una recomendación específica y accionable (máximo 3 oraciones) para ayudar al usuario a alcanzar el siguiente nivel.
La recomendación debe ser:
- Específica y personalizada basada en su situación actual
- Accionable con pasos concretos
- Motivadora pero realista
- En español, usando "tú"
NO uses emojis. Sé directo y práctico.`;

      const userPrompt = `El usuario está en nivel ${currentLevel} y quiere llegar al nivel ${nextLevel}.
Le faltan ${pointsNeeded} puntos.

${userContext}

Genera una recomendación personalizada para ayudarle a alcanzar el siguiente nivel.`;

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
          temperature: 0.7,
          max_tokens: 200
        }),
      });

      if (!response.ok) {
        console.error("AI Gateway error:", response.status, await response.text());
        throw new Error("AI generation failed");
      }

      const aiData = await response.json();
      const recommendation = aiData.choices?.[0]?.message?.content?.trim();

      if (!recommendation) {
        throw new Error("No recommendation generated");
      }

      return new Response(JSON.stringify({ recommendation }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (aiError) {
      console.error("AI generation error, using generic:", aiError);
      const randomRec = genericRecommendations[Math.floor(Math.random() * genericRecommendations.length)];
      return new Response(JSON.stringify({ recommendation: randomRec }), {
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
