// supabase/functions/parse-input/index.ts
// Edge Function: Claude Haiku parses natural language into AtomItem tokens
// Deploy: supabase functions deploy parse-input

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

const SYSTEM_PROMPT = `You are MindRoot's input parser. Given a Portuguese text input, extract structured data.

Return ONLY valid JSON with these fields:
{
  "title": "cleaned title without tokens",
  "type": "task" | "habit" | "ritual" | "chore" | "project" | "note" | "reflection" | "journal",
  "module": "purpose" | "work" | "family" | "body" | "mind" | "soul" | null,
  "priority": "urgente" | "importante" | "manutencao" | "futuro" | null,
  "emotion_before": emotion or null,
  "is_chore": boolean,
  "due_date": "YYYY-MM-DD" or null,
  "due_time": "HH:mm" or null,
  "ritual_period": "aurora" | "zenite" | "crepusculo" | null,
  "tags": string[]
}

Emotions: calmo, focado, grato, animado, confiante, ansioso, cansado, frustrado, triste, perdido, neutro.
Modules: purpose (life purpose), work (professional), family, body (health/exercise), mind (learning/reading), soul (spiritual/reflection).

Examples:
- "comprar leite amanha" → type:task, due_date:tomorrow, module:null
- "meditar 10min toda manha" → type:ritual, ritual_period:aurora, module:soul
- "revisar PR do projeto X, to ansioso" → type:task, module:work, emotion_before:ansioso
- "lavar roupa" → type:chore, is_chore:true, module:null
- "refletir sobre minha semana" → type:journal, module:soul

Today is: ${new Date().toISOString().slice(0, 10)}.
Return ONLY JSON, no markdown, no backticks.`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY not set');
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { input } = await req.json();
    if (!input || typeof input !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing input field' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Parsing input:', input);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: input }],
      }),
    });

    // Log the full response if it fails
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Anthropic API error:', response.status, errorBody);
      return new Response(
        JSON.stringify({ error: `Anthropic API: ${response.status}`, details: errorBody }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Anthropic response:', JSON.stringify(data));

    const text = data.content?.[0]?.text || '{}';
    const parsed = JSON.parse(text);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Function error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
