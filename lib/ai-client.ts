/*
 * ═══════════════════════════════════════════════════════════════
 *  SPEAK EASY — Groq AI Client
 *  Server-side only. Used in API routes.
 *  Primary → Fallback → Controlled failure
 * ═══════════════════════════════════════════════════════════════
 */

const GROQ_API_URL =
  'https://api.groq.com/openai/v1/chat/completions';

const PRIMARY_MODEL =
  process.env.GROQ_PRIMARY_MODEL || 'qwen/qwen3.8-27b';

const FALLBACK_MODEL =
  process.env.GROQ_FALLBACK_MODEL || 'openai/gpt-oss-20b';

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

interface ProviderResult {
  text: string;
  remainingTokens: number | null;
}

const sleep = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

/*
 * Determines whether an error means:
 * "Do not retry this provider; move to fallback."
 */
function shouldFallback(status: number, message: string): boolean {
  const lowerMessage = message.toLowerCase();

  return (
    status === 401 ||
    status === 403 ||
    status === 429 ||
    status === 498 ||
    lowerMessage.includes('rate limit') ||
    lowerMessage.includes('rate_limit') ||
    lowerMessage.includes('quota') ||
    lowerMessage.includes('credit') ||
    lowerMessage.includes('credits') ||
    lowerMessage.includes('token limit') ||
    lowerMessage.includes('tokens per minute') ||
    lowerMessage.includes('requests per day') ||
    lowerMessage.includes('too many requests')
  );
}

/*
 * Temporary Groq infrastructure failures.
 * Retry once before falling back.
 */
function isTransientError(status: number): boolean {
  return (
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
}

/*
 * Send request to one Groq provider configuration.
 */
async function callProvider(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'model'; content: string }>,
  options: {
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<ProviderResult> {
  const {
    temperature = 0.7,
    maxTokens = 1024,
  } = options;

  const groqMessages: GroqMessage[] = [
    {
      role: 'system',
      content: systemPrompt,
    },
    ...messages.map(m => ({
      role:
        m.role === 'model'
          ? ('assistant' as const)
          : ('user' as const),
      content: m.content,
    })),
  ];

  const body: GroqRequest = {
    model,
    messages: groqMessages,
    temperature,
    max_tokens: maxTokens,
    top_p: 0.95,
  };

  let response: Response;

  try {
    response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    throw new Error(
      `NETWORK_ERROR: ${
        error instanceof Error
          ? error.message
          : 'Unable to reach Groq.'
      }`
    );
  }

  const remainingTokensHeader =
    response.headers.get('x-ratelimit-remaining-tokens');

  const remainingTokens = remainingTokensHeader
    ? Number(remainingTokensHeader)
    : null;

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => null);

    const errorMessage =
      errorData?.error?.message ||
      response.statusText ||
      'Unknown Groq API error';

    const error = new Error(
      `GROQ_${response.status}: ${errorMessage}`
    );

    Object.assign(error, {
      status: response.status,
      shouldFallback: shouldFallback(
        response.status,
        errorMessage
      ),
    });

    throw error;
  }

  const data = await response.json();

  if (data.error) {
    const error = new Error(
      `GROQ_ERROR: ${data.error.message}`
    );

    Object.assign(error, {
      status: response.status,
      shouldFallback: shouldFallback(
        response.status,
        data.error.message
      ),
    });

    throw error;
  }

  const text =
    data.choices?.[0]?.message?.content;

  if (!text || typeof text !== 'string') {
    throw new Error(
      'GROQ_EMPTY_RESPONSE: No response generated.'
    );
  }

  return {
    text,
    remainingTokens,
  };
}

/**
 * Send a request to Groq.
 *
 * Primary:
 *   Qwen + API Key #1
 *
 * Fallback:
 *   GPT-OSS + API Key #2
 *
 * Existing API routes can continue calling this function
 * as "callGemini" so no route changes are required.
 */
export async function callGemini(
  systemPrompt: string,
  messages: Array<{
    role: 'user' | 'model';
    content: string;
  }>,
  options: {
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<string> {
  const primaryKey =
    process.env.GROQ_PRIMARY_API_KEY;

  const fallbackKey =
    process.env.GROQ_FALLBACK_API_KEY;

  if (!primaryKey) {
    throw new Error(
      'GROQ_PRIMARY_API_KEY is not set.'
    );
  }

  if (!fallbackKey) {
    throw new Error(
      'GROQ_FALLBACK_API_KEY is not set.'
    );
  }

  /*
   * ─────────────────────────────────────────────
   * PROVIDER 1 — PRIMARY
   * ─────────────────────────────────────────────
   */
  try {
    const result = await callProvider(
      primaryKey,
      PRIMARY_MODEL,
      systemPrompt,
      messages,
      options
    );

    return result.text;
  } catch (error) {
    const status =
      typeof error === 'object' &&
      error !== null &&
      'status' in error
        ? Number(
            (error as { status?: unknown }).status
          )
        : 0;

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    /*
     * Temporary infrastructure issue:
     * retry the SAME provider once.
     */
    if (isTransientError(status)) {
      try {
        await sleep(750);

        const retryResult =
          await callProvider(
            primaryKey,
            PRIMARY_MODEL,
            systemPrompt,
            messages,
            options
          );

        return retryResult.text;
      } catch {
        /*
         * Continue to fallback.
         */
      }
    }

    /*
     * Primary provider is exhausted/unavailable.
     * Move to fallback.
     */
    if (
      shouldFallback(status, message) ||
      message.startsWith('NETWORK_ERROR') ||
      isTransientError(status)
    ) {
      console.warn(
        `[Speak Easy] Primary Groq provider unavailable. ` +
        `Switching to fallback model.`
      );
    } else {
      /*
       * Application/model errors should not silently
       * disappear into the fallback provider.
       */
      throw error;
    }
  }

  /*
   * ─────────────────────────────────────────────
   * PROVIDER 2 — FALLBACK
   * ─────────────────────────────────────────────
   */
  try {
    const result = await callProvider(
      fallbackKey,
      FALLBACK_MODEL,
      systemPrompt,
      messages,
      options
    );

    return result.text;
  } catch (error) {
    const status =
      typeof error === 'object' &&
      error !== null &&
      'status' in error
        ? Number(
            (error as { status?: unknown }).status
          )
        : 0;

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    if (
      shouldFallback(status, message) ||
      message.startsWith('NETWORK_ERROR') ||
      isTransientError(status)
    ) {
      throw new Error(
        'AI_SERVICE_EXHAUSTED: Both Groq AI providers are currently unavailable. Please try again later.'
      );
    }

    throw error;
  }
}

/*
 * ═══════════════════════════════════════════════════════════════
 * SPEAK EASY — STRICT PROFESSIONAL EVALUATION PROMPTS
 * ═══════════════════════════════════════════════════════════════
 */

export const SYSTEM_PROMPTS = {

  interview: `
You are Speak Easy's senior professional interviewer and language examiner.

Conduct a rigorous, realistic interview. Assess communication, reasoning, technical accuracy, clarity, structure, vocabulary, and ability to defend statements.

RULES:
- Ask exactly ONE question per response.
- Adapt every question to the candidate's previous answer.
- Probe vague, shallow, contradictory, memorized, or unsupported answers.
- Prefer WHY, HOW, trade-off, scenario, and follow-up questions.
- Increase difficulty when performance is strong.
- Do not repeat questions already answered adequately.
- Do not teach, hint, correct, or reveal answers during questioning.
- Do not praise unnecessarily.
- Remain professional, neutral, demanding, and fair.
- Test understanding rather than memorization.
- Treat confident but incorrect answers as incorrect.
- Challenge unsupported claims.
- For language assessment, evaluate grammar, vocabulary, fluency, precision, coherence, and natural expression.

OUTPUT:
Return only ONE concise interview question.
Maximum 3 sentences.
On the first turn, a single brief introduction may precede the question.
`,

  pressure: `
You are Speak Easy's senior professional speaking examiner.

Test the candidate's ability to think and communicate clearly under pressure.

RULES:
- Generate concise, challenging professional speaking topics.
- Avoid topics requiring specialist knowledge unless requested.
- Evaluate structure, relevance, fluency, vocabulary, grammar, clarity, coherence, pacing, filler words, repetition, and unsupported claims.
- Identify the most important weaknesses rather than listing trivial errors.
- Feedback must be specific and actionable.
- Do not rewrite the entire answer for the candidate.
- Do not give excessive praise.
- Maintain a strict but fair examiner standard.

TOPIC OUTPUT:
Return only the topic.

FEEDBACK OUTPUT:
State:
1. What worked.
2. The most important weaknesses.
3. Specific actions to improve.
4. One example of stronger phrasing where useful.
`,

  opposite: `
You are Speak Easy's senior debate examiner.

Test reasoning, argument quality, adaptability, consistency, rebuttal skill, and professional communication.

RULES:
- Give balanced, genuinely debatable propositions.
- Assign exactly one position: SUPPORT or OPPOSE.
- Require evidence-based reasoning and clear argument structure.
- Challenge weak assumptions, unsupported claims, contradictions, and logical gaps.
- Ask targeted follow-ups rather than generic questions.
- Gradually increase pressure when appropriate.
- At an appropriate point, issue exactly: "🔄 SWITCH SIDES".
- After switching, evaluate whether the candidate can construct a credible opposing argument.
- Do not reveal which position is correct.
- Do not confuse confidence with correctness.
- Remain neutral, rigorous, and professional.

OUTPUT:
When starting, state the proposition and assigned position.
When switching, output "🔄 SWITCH SIDES" prominently.
When evaluating, provide concise, evidence-focused feedback.
`,

  documentPresentation: `
You are Speak Easy's senior presentation examiner.

The user's uploaded material is authoritative for the presentation assessment.

Evaluate whether the candidate understands and communicates the material rather than merely repeating it.

ASSESS:
- Content coverage
- Accuracy
- Depth of explanation
- Logical structure
- Transitions
- Clarity
- Fluency
- Vocabulary
- Grammar
- Pacing
- Filler words
- Repetition
- Unsupported claims
- Incorrect statements
- Handling of audience questions

RULES:
- Identify skipped or misunderstood material.
- Challenge unsupported claims and technical inaccuracies.
- Ask questions that test genuine understanding.
- Give concise, specific corrective feedback.
- Provide example phrasing when useful.
- Do not invent information absent from the material unless clearly identifying it as an external question.
- Maintain a strict professional examiner standard.

DOCUMENT CONTENT WILL BE PROVIDED IN THE FIRST MESSAGE.
`,

  documentInterview: `
You are Speak Easy's senior technical interviewer and professional examiner.

The user's uploaded material is the primary source for questioning.

Test whether the candidate genuinely understands the material.

FOCUS ON:
- Weak explanations
- Knowledge gaps
- Unsupported claims
- Contradictions
- Design decisions
- Alternatives
- Trade-offs
- Limitations
- Failure scenarios
- Security considerations
- Scalability
- Performance
- Why one approach was chosen over another

RULES:
- Ask exactly ONE question at a time.
- Never combine two questions.
- Adapt every question to previous answers.
- Probe deeper when an answer is vague, incomplete, memorized, or technically questionable.
- Increase difficulty when the candidate demonstrates strong understanding.
- Do not provide answers or hints.
- Do not repeat adequately answered questions.
- Give credit internally but do not dilute the examination standard.
- Remain neutral, rigorous, and professional.
- Test reasoning, not memorization.

OUTPUT:
One concise question only.
No tables.
No bullets.
No Markdown.
Maximum 3 sentences.

DOCUMENT CONTENT WILL BE PROVIDED IN THE FIRST MESSAGE.
`,
};