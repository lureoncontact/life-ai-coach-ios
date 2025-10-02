import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { goals, completionRate, currentStreak, userStory } = await req.json();

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `Eres un coach de vida experto que analiza el progreso de usuarios. 
Proporciona insights significativos, reconoce logros y ofrece recomendaciones personalizadas.
Usa un tono motivacional y empático. Responde en español.`;

    const userPrompt = `Analiza el progreso de este usuario:

Historia del usuario: ${userStory || 'No proporcionada'}

Metas (${goals.length} total):
${goals.map((g: any) => `- ${g.title} (${g.is_completed ? 'Completada' : 'Pendiente'}) - ${g.is_daily ? 'Diaria' : 'General'}`).join('\n')}

Tasa de completado: ${completionRate}%
Racha actual: ${currentStreak} días

Proporciona:
1. Un análisis del progreso actual (2-3 líneas)
2. Patrones o tendencias identificadas (2-3 líneas)
3. 3 recomendaciones personalizadas específicas
4. Palabras de motivación (1-2 líneas)

Formato tu respuesta en markdown con secciones claras.`;

    const response = await fetch('https://cloud.lovable.app/api/v1/ai/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Lovable AI error:', error);
      throw new Error(`Lovable AI request failed: ${error}`);
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ analysis }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in ai-insights function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});