import { NextRequest, NextResponse } from 'next/server';
import { callGemini, SYSTEM_PROMPTS } from '@/lib/ai-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, messages, category, language } = body;

    if (action === 'generate-topic') {
      const catText = category ? ` in the category of "${category}"` : '';

      const response = await callGemini(
        SYSTEM_PROMPTS.opposite,
        [
          {
            role: 'user',
            content: `Generate a debatable topic${catText} and assign me a position (SUPPORT or OPPOSE).
${language ? `You MUST generate the topic and communicate exclusively in ${language}. Do NOT use English unless the requested language is English.` : ''}

Format your response as:
TOPIC: <topic>
POSITION: <SUPPORT or OPPOSE>`,
          },
        ],
        { temperature: 1.0, maxTokens: 256 }
      );

      return NextResponse.json({ response: response.trim() });
    }

    if (action === 'respond' || action === 'switch') {
      if (!messages || !Array.isArray(messages)) {
        return NextResponse.json(
          { error: 'Messages required' },
          { status: 400 }
        );
      }

      const aiMessages = messages.map(
        (m: { role: string; content: string }) => ({
          role: (m.role === 'ai' ? 'model' : 'user') as 'user' | 'model',
          content: m.content,
        })
      );

      if (action === 'switch') {
        aiMessages.push({
          role: 'user' as const,
          content:
            'Now trigger the SWITCH SIDES challenge. Tell me to argue for the opposite position. If I was supporting, tell me to oppose. If I was opposing, tell me to support. Be clear about it.',
        });
      }

      let finalSystemPrompt = SYSTEM_PROMPTS.opposite;
      if (language) {
        finalSystemPrompt = `You must speak and conduct the entire debate exclusively in ${language}. ` + SYSTEM_PROMPTS.opposite;
      }

      const response = await callGemini(
        finalSystemPrompt,
        aiMessages,
        {
          temperature: 0.8,
          maxTokens: 1024,
        }
      );

      return NextResponse.json({ response });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Opposite API error:', error);

    const message =
      error instanceof Error
        ? error.message
        : 'Failed to process opposite mode request';

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}