import { NextRequest, NextResponse } from 'next/server';
import { callGemini, SYSTEM_PROMPTS } from '@/lib/ai-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, fromLanguage } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required for translation' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a professional translator. Translate the following text from ${fromLanguage || 'the original language'} to English. Return ONLY the translated English text, nothing else, no quotes, no markdown blocks.`;

    const response = await callGemini(systemPrompt, [{ role: 'user', content: text }], {
      temperature: 0.3,
      maxTokens: 1024,
    });

    return NextResponse.json({ translatedText: response.trim() });
  } catch (error) {
    console.error('Translation API error:', error);
    const message = error instanceof Error ? error.message : 'Failed to translate text';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
