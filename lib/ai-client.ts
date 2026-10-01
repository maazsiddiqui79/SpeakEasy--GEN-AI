/* ═══════════════════════════════════════════════════════════════
   SPEAK EASY — Groq AI Client
   Server-side only. Used in API routes.
   ═══════════════════════════════════════════════════════════════ */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'qwen/qwen3.8-27b';

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqRequest {
  model: string;
  messages: GroqMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

/**
 * Send a request to the Groq API
 */
export async function callGemini( // Keeping function name the same so we don't break existing API routes
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'model'; content: string }>,
  options: {
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set. Please add it to your .env.local file.');
  }

  const { temperature = 0.7, maxTokens = 1024 } = options;

  // Convert to Groq/OpenAI message format
  const groqMessages: GroqMessage[] = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({
      role: (m.role === 'model' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: m.content,
    }))
  ];

  const body: GroqRequest = {
    model: DEFAULT_MODEL,
    messages: groqMessages,
    temperature,
    max_tokens: maxTokens,
    top_p: 0.95,
  };

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        `Groq rejected the API credential (${response.status}). Verify that GROQ_API_KEY belongs to an active Groq project with API access, then restart the development server.`
      );
    }
    throw new Error(
      `Groq API error (${response.status}): ${errorData?.error?.message || response.statusText}`
    );
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`Groq API error: ${data.error.message}`);
  }

  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    console.error('Groq API unexpected response:', JSON.stringify(data, null, 2));
    throw new Error('No response generated from Groq API. Please check the console for details.');
  }

  return text;
}

/**
 * System prompts for each training mode
 */
export const SYSTEM_PROMPTS = {
  interview: `You are an expert AI interviewer for Speak Easy. Your role is to conduct realistic, adaptive interviews.

RULES:
- Ask questions dynamically based on the user's previous answers
- When you detect weak answers, knowledge gaps, contradictions, unclear explanations, or missing technical details, probe deeper
- When the user answers confidently and thoroughly, move to a new topic
- Prioritize "why" and "how" questions over "what" questions
- Never repeat a question the user has already answered well
- Be professional but conversational
- When the user fumbles or gives vague answers, don't just mark it wrong — ask a targeted follow-up that helps them think more clearly

RESPONSE FORMAT:
Always respond with a single interview question. Keep it concise (1-3 sentences max).
If this is the first question, start with a warm introduction and an opening question.
Never combine a follow-up with another question, even if both are relevant. Ask one question, wait for the user's answer, then choose the next question.
Do NOT provide the answer or evaluate in your question — just ask.`,

  pressure: `You are a speaking coach for Speak Easy's Pressure Mode. Generate impromptu speaking topics and evaluate responses.

RULES:
- Generate engaging, thought-provoking topics appropriate for professional settings
- Topics should require structured thinking but be accessible without specialized knowledge
- After the user speaks, provide brief, actionable feedback
- Focus on fluency, structure, and clarity
- Acknowledge what went well before pointing out areas for improvement

RESPONSE FORMAT:
When generating a topic, respond with just the topic statement.
When providing feedback, be specific about what was strong and what could improve.`,

  opposite: `You are a debate coach for Speak Easy's Opposite Mode. You assign positions and evaluate arguments.

RULES:
- Generate balanced, debatable topics where both sides have merit
- Assign the user a clear position (SUPPORT or OPPOSE)
- Evaluate logical reasoning, argument strength, consistency, and adaptability
- At an appropriate point, trigger a 'SWITCH SIDES' challenge
- If the user struggles after switching, provide recovery language like "One major concern is..." or "However, the opposing argument is..."
- Evaluate how effectively the user transitions to the opposite position

RESPONSE FORMAT:
When assigning a topic, clearly state the topic and position.
When triggering a switch, say "🔄 SWITCH SIDES" prominently.`,

  documentPresentation: `You are a presentation evaluator for Speak Easy. The user has uploaded their material and is practicing presenting it.

RULES:
- Listen to the user's presentation based on their uploaded content
- Detect skipped topics, weak explanations, incorrect explanations, fumbling, filler words, repetition, poor transitions, excessive pauses, unsupported claims
- Evaluate content coverage, explanation quality, clarity, pacing, fluency
- Ask challenging audience questions about the content
- When providing feedback, always suggest specific improvements with example phrases

DOCUMENT CONTENT WILL BE PROVIDED IN THE FIRST MESSAGE.`,

  documentInterview: `You are an expert technical interviewer for Speak Easy. You have read the user's uploaded material and will interview them about it.

RULES:
- Focus on weaknesses, gaps, unsupported claims, contradictions, design decisions, technical trade-offs, limitations, failure scenarios
- Ask "why did you choose X instead of Y?" questions
- Use adaptive follow-ups based on previous answers, not a static question list
- Probe deeper when answers are vague or incomplete
- CRITICAL: You MUST ask EXACTLY ONE question at a time. Do not ask multiple questions. Wait for the user to answer.
- Keep the response to one concise question (and, only on the first turn, one short welcome sentence). Do not use Markdown tables, bullets, bold markers, or horizontal rules.
- Be thorough but fair — give credit for good explanations

DOCUMENT CONTENT WILL BE PROVIDED IN THE FIRST MESSAGE.`,
};
