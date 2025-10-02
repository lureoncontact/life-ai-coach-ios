import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { habits, stats } = await req.json();

    const prompt = `Eres un coach personal experto. Analiza los siguientes datos de hábitos y progreso del usuario:

Hábitos:
${habits.map((h: any) => `- ${h.title}: Racha de ${h.streak} días, ${h.completed_today ? 'completado hoy' : 'no completado hoy'}`).join('\n')}

Estadísticas:
- Racha actual: ${stats.current_streak} días
- Racha más larga: ${stats.longest_streak} días
- Total de hábitos: ${habits.length}
- Hábitos completados hoy: ${habits.filter((h: any) => h.completed_today).length}

Proporciona un análisis conciso (máximo 150 palabras) que incluya:
1. Áreas de oportunidad específicas
2. Reconocimiento de logros
3. Una recomendación práctica para mejorar

Sé empático, motivacional y directo.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Eres un coach personal experto y empático.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in habits-analysis function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
