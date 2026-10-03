import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/ai-client';

const GRAMMAR_SYSTEM_PROMPT = `You are a strict English grammar evaluator. Your ONLY job is to assess the grammatical accuracy of spoken text.

TASK:
Analyze the provided text and return a grammatical accuracy score from 0 to 100.

SCORING CRITERIA:
- Subject-verb agreement
- Tense consistency
- Proper use of articles (a, an, the)
- Correct preposition usage
- Sentence structure and completeness
- Pronoun-antecedent agreement
- Proper word order
- Correct use of modifiers
- Run-on sentences or fragments
- Punctuation-level errors inferred from speech patterns

SCORING GUIDE:
- 95-100: Near-perfect grammar with only trivial issues
- 85-94: Strong grammar with minor errors that don't affect meaning
- 70-84: Acceptable grammar with noticeable errors
- 50-69: Below average with frequent errors affecting clarity
- 30-49: Poor grammar with significant structural issues
- 0-29: Very poor grammar making text difficult to understand

IMPORTANT:
- This is SPOKEN text transcribed by speech recognition, so ignore capitalization and punctuation issues.
- Focus on GRAMMATICAL structure, not vocabulary choice or content quality.
- Be fair but rigorous.
- Consider that speech may contain natural disfluencies — focus on the underlying grammar.

OUTPUT FORMAT:
Return ONLY a JSON object, nothing else. No markdown, no explanation, no extra text.
{"score": <number 0-100>}`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript, language } = body;

    if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
      return NextResponse.json(
        { error: 'Transcript text is required' },
        { status: 400 }
      );
    }

    // For very short transcripts (< 5 words), skip AI call
    const wordCount = transcript.trim().split(/\s+/).length;
    if (wordCount < 3) {
      return NextResponse.json({ score: null, reason: 'Too short to evaluate' });
    }

    let systemPrompt = GRAMMAR_SYSTEM_PROMPT;
    if (language && language !== 'English') {
      systemPrompt = systemPrompt.replace(
        'You are a strict English grammar evaluator.',
        `You are a strict grammar evaluator for ${language}.`
      );
    }

    const response = await callGemini(
      systemPrompt,
      [
        {
          role: 'user',
          content: `Evaluate the grammatical accuracy of this spoken text:\n\n"${transcript}"`,
        },
      ],
      { temperature: 0.1, maxTokens: 64 }
    );

    // Parse the JSON response
    const cleanResponse = response.trim().replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    try {
      const parsed = JSON.parse(cleanResponse);
      const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0)));
      return NextResponse.json({ score });
    } catch {
      // If parsing fails, try to extract a number
      const numberMatch = cleanResponse.match(/(\d{1,3})/);
      if (numberMatch) {
        const score = Math.max(0, Math.min(100, parseInt(numberMatch[1], 10)));
        return NextResponse.json({ score });
      }
      // Default fallback
      return NextResponse.json({ score: null, reason: 'Could not parse AI response' });
    }
  } catch (error) {
    console.error('Grammar analysis API error:', error);
    const message = error instanceof Error ? error.message : 'Failed to analyze grammar';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
