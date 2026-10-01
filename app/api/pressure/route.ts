import { NextRequest, NextResponse } from 'next/server';
import { callGemini, SYSTEM_PROMPTS } from '@/lib/ai-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, messages, topic, language } = body;

    if (action === 'generate-topic') {
      const prompt = body.customTopic 
        ? `Generate a speaking prompt based on this custom topic: "${body.customTopic}". The topic should be a clear, debatable statement or question that someone can speak about for 1-2 minutes. Just provide the topic, nothing else.`
        : 'Search the internet for what is booming and trending right now. Generate a single impromptu speaking topic based on a trending issue. The topic should be a clear, debatable statement or question that someone can speak about for 1-2 minutes. Just provide the topic, nothing else.';
        
      const languageContext = language ? `\nYou MUST generate the topic in ${language}.` : '';
      const response = await callGemini(
        SYSTEM_PROMPTS.pressure,
        [{
          role: 'user',
          content: prompt + languageContext,
        }],
        { temperature: 1.0, maxTokens: 128 }
      );
      return NextResponse.json({ topic: response.trim() });
    }

    if (action === 'feedback') {
      if (!messages || !Array.isArray(messages)) {
        return NextResponse.json({ error: 'Messages required for feedback' }, { status: 400 });
      }

      const aiMessages = messages.map((m: { role: string; content: string }) => ({
        role: (m.role === 'ai' ? 'model' : 'user') as 'user' | 'model',
        content: m.content,
      }));

      let finalSystemPrompt = SYSTEM_PROMPTS.pressure;
      if (language) {
        finalSystemPrompt = `You must provide feedback exclusively in ${language}. ` + SYSTEM_PROMPTS.pressure;
      }

      const response = await callGemini(finalSystemPrompt, aiMessages, {
        temperature: 0.7,
        maxTokens: 1024,
      });

      return NextResponse.json({ response });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Pressure API error:', error);
    const message = error instanceof Error ? error.message : 'Failed to process pressure mode request';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
