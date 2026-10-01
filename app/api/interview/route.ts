import { NextRequest, NextResponse } from 'next/server';
import { callGemini, SYSTEM_PROMPTS } from '@/lib/ai-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, topic, customTopic, language } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const systemPrompt = SYSTEM_PROMPTS.interview;

    // Build context-aware messages
    const aiMessages: Array<{ role: 'user' | 'model'; content: string }> = [];

    // Add topic context if starting
    if (messages.length === 0 || (messages.length === 1 && messages[0].role === 'user')) {
      const topicContext = customTopic || topic || 'general professional interview';
      const languageContext = language ? `You MUST communicate exclusively in ${language}. Do NOT use English unless the requested language is English.` : '';
      aiMessages.push({
        role: 'user',
        content: `Start an interview session. Topic: ${topicContext}. Begin with a warm introduction and your first question. ${languageContext}`,
      });
    } else {
      // Convert existing exchanges to Gemini format
      for (const msg of messages) {
        aiMessages.push({
          role: msg.role === 'ai' ? 'model' : 'user',
          content: msg.content,
        });
      }
    }

    let finalSystemPrompt = systemPrompt;
    if (language) {
      finalSystemPrompt = `You must speak and conduct the entire interview exclusively in ${language}. ` + systemPrompt;
    }

    const response = await callGemini(finalSystemPrompt, aiMessages, {
      temperature: 0.8,
      maxTokens: 1024,
    });

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Interview API error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate interview response';

    if (message.includes('GROQ_API_KEY')) {
      return NextResponse.json(
        { error: 'API key not configured. Please add GROQ_API_KEY to your .env.local file.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
