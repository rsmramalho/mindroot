const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

const SYSTEM_PROMPT = `You are the Atom Engine auto-triage classifier. Given a Portuguese text input, classify it.

Return ONLY valid JSON:
{
  "title": "cleaned title (remove tokens like #mod_*, @hoje, etc)",
  "type": "one of the valid types below",
  "module": "one of the valid modules below",
  "confidence": 0-100,
  "reasoning": "1 sentence explaining your classification",
  "tags": ["extracted tags"],
  "due_date": "YYYY-MM-DD or null",
  "emotion": "detected emotion or null"
}

VALID TYPES (23):
note, reflection, recommendation, podcast, article, resource, list,
task, habit, recipe, workout, spec, checkpoint, project,
session_log, wrap, ritual, review, log, doc, research, template, lib

VALID MODULES (8):
work (professional, coding, business)
body (health, exercise, food, recipes)
mind (learning, reading, podcasts, articles)
family (home, kids, partner, relatives)
purpose (life meaning, spiritual, rituals)
bridge (meta, systems, cross-domain)
finance (money, investments, budgets)
social (friends, community, networking)

CONFIDENCE RULES:
- 95-100: Obvious classification, zero ambiguity. "comprar leite" = task/body 98%.
- 80-94: Strong signal but some ambiguity. "pensar sobre carreira" = reflection/work 85%.
- 60-79: Multiple valid interpretations. "ramen do centro" = recommendation/body 70%.
- 30-59: Vague input. "ideia sobre aquilo" = note/bridge 45%.
- 0-29: Nearly impossible to classify. "..." = 10%.

Be CONSERVATIVE with confidence. When in doubt, go lower.

EMOTIONS (optional): calmo, focado, grato, animado, confiante, ansioso, cansado, frustrado, triste, perdido, neutro

Today is: {{TODAY}}.
Return ONLY JSON. No markdown, no backticks.`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { input, context } = await req.json();
    if (!input || typeof input !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing input field' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const today = new Date().toISOString().slice(0, 10);
    const systemPrompt = SYSTEM_PROMPT.replace('{{TODAY}}', today);

    let userMessage = input;
    if (context) {
      userMessage = `Context (recent items):\n${context}\n\nClassify:\n${input}`;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Anthropic API error:', response.status, errorBody);
      return new Response(
        JSON.stringify({ error: `Anthropic API: ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '{}';

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {
        title: input, type: 'note', module: 'bridge',
        confidence: 20, reasoning: 'Failed to parse AI response',
        tags: [], due_date: null, emotion: null,
      };
    }

    parsed.confidence = Math.max(0, Math.min(100, parsed.confidence || 0));

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Triage error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
