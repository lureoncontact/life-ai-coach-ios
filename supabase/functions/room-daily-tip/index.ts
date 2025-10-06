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
    const { userName, currentStreak, totalPoints, level, roomContext, recentMoods } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Category-specific fallback tips
    const categoryTips: Record<string, string[]> = {
      health: [
        "La constancia en el ejercicio es más importante que la intensidad. Muévete hoy, aunque sea poco.",
        "Tu cuerpo es tu hogar permanente. Cuídalo con pequeñas decisiones diarias.",
        "El descanso es tan importante como el ejercicio. Asegúrate de dormir bien."
      ],
      mental: [
        "Unos minutos de meditación pueden transformar tu día. ¿Por qué no empezar ahora?",
        "La paz mental no es la ausencia de problemas, sino la capacidad de lidiar con ellos.",
        "Respira profundo. A veces lo único que necesitas es un momento de calma."
      ],
      career: [
        "Cada pequeño logro te acerca a tu meta profesional. ¿Qué harás hoy para avanzar?",
        "El éxito profesional es la suma de pequeños esfuerzos repetidos día tras día.",
        "Aprende algo nuevo hoy. El conocimiento es la mejor inversión en tu carrera."
      ],
      finance: [
        "Ahorrar no es privarse, es priorizar tu futuro sobre impulsos momentáneos.",
        "Cada peso ahorrado es un voto de confianza en tu futuro.",
        "Antes de comprar algo, pregúntate: ¿lo necesito o solo lo quiero?"
      ],
      relationships: [
        "Las relaciones se nutren de pequeños gestos consistentes, no de grandes eventos esporádicos.",
        "Escuchar activamente es el regalo más valioso que puedes dar a alguien.",
        "Hoy, dedica tiempo de calidad a alguien importante para ti."
      ],
      personal: [
        "El crecimiento personal no es un destino, es un viaje diario de pequeñas mejoras.",
        "Dedica tiempo a lo que amas. Es una inversión en tu felicidad.",
        "Lee algo que te inspire hoy. Alimenta tu mente con buenos contenidos."
      ]
    };

    // Build focused context about the room
    const { roomName, roomCategory, goals, completedGoals, totalGoals, incompleteGoals } = roomContext;
    
    let roomInfo = `Focus Room: "${roomName}" (categoría: ${roomCategory}). `;
    roomInfo += `Metas: ${completedGoals}/${totalGoals} completadas. `;
    
    if (incompleteGoals && incompleteGoals.length > 0) {
      roomInfo += `Metas pendientes: ${incompleteGoals.join(", ")}. `;
    }

    let userContext = `Usuario: ${userName}, Nivel: ${level}, Puntos: ${totalPoints}, Racha: ${currentStreak} días. ${roomInfo}`;

    if (recentMoods && recentMoods.length > 0) {
      const lastMood = recentMoods[0];
      userContext += ` Último estado de ánimo: ${lastMood.mood}.`;
    }

    // Check if we have enough data for AI generation
    const hasEnoughData = totalGoals > 0 || currentStreak > 0;

    if (!hasEnoughData) {
      // Return category-specific fallback
      const tips = categoryTips[roomCategory] || [
        "Cada día es una oportunidad para ser 1% mejor.",
        "El progreso no siempre es visible. Confía en el proceso."
      ];
      const randomTip = tips[Math.floor(Math.random() * tips.length)];
      return new Response(JSON.stringify({ tip: randomTip }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate personalized tip using AI
    try {
      const systemPrompt = `Eres Nudge, un coach de vida empático y directo especializado en ${roomCategory}.
Genera un consejo breve y específico (máximo 2 oraciones) para este Focus Room específico.
El consejo debe:
- Ser específico al área de "${roomName}" (${roomCategory})
- Mencionar las metas pendientes si las hay
- Ser accionable y motivador
- Usar "tú" y ser directo
- NO uses emojis
- Enfócate en acciones concretas para HOY`;

      const userPrompt = `${userContext}

Genera un consejo específico y accionable para ayudar al usuario a progresar en este Focus Room HOY.`;

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
        console.error("AI Gateway error:", response.status);
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
      console.error("AI generation error, using category-specific tip:", aiError);
      // Fallback to category-specific tip
      const tips = categoryTips[roomCategory] || [
        "Cada día es una oportunidad para mejorar.",
        "La constancia es la clave del éxito."
      ];
      
      let fallbackTip = tips[Math.floor(Math.random() * tips.length)];
      
      // Add specific context if there are incomplete goals
      if (incompleteGoals && incompleteGoals.length > 0) {
        fallbackTip = `Enfócate en completar "${incompleteGoals[0]}" hoy. ${fallbackTip}`;
      }
      
      return new Response(JSON.stringify({ tip: fallbackTip }), {
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
