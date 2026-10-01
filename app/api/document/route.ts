import { NextRequest, NextResponse } from 'next/server';
import { callGemini, SYSTEM_PROMPTS } from '@/lib/ai-client';

// The model can occasionally ignore formatting instructions. Keep the turn usable:
// each document-interview response is one plain-text question, never a question list.
function oneQuestionOnly(response: string): string {
  const plainText = response
    .replace(/^\s*(?:[-*+]\s+|\d+[.)]\s*|#{1,6}\s*)/gm, '')
    .replace(/[*_`|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const question = plainText.match(/[^.!?]+\?/);
  return (question?.[0] || plainText).replace(/^\s*(?:question\s*:\s*)/i, '').trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, messages, subMode, documentContent, language } = body;

    if (!subMode || !['presentation', 'interview'].includes(subMode)) {
      return NextResponse.json(
        { error: 'Invalid subMode. Must be "presentation" or "interview".' },
        { status: 400 }
      );
    }

    let systemPrompt =
      subMode === 'presentation'
        ? SYSTEM_PROMPTS.documentPresentation
        : SYSTEM_PROMPTS.documentInterview;
        
    if (language) {
      systemPrompt = `You must speak and conduct this session exclusively in ${language}. ` + systemPrompt;
    }

    if (action === 'start') {
      if (!documentContent) {
        return NextResponse.json(
          { error: 'Document content is required' },
          { status: 400 }
        );
      }

      const startMessages: Array<{
        role: 'user' | 'model';
        content: string;
      }> = [
        {
          role: 'user',
          content: `Here is the document content I'll be ${
            subMode === 'presentation'
              ? 'presenting'
              : 'interviewed on'
          }:

${documentContent}

Please begin the ${
            subMode === 'presentation'
              ? 'presentation evaluation'
              : 'document-based interview'
          }.`,
        },
      ];

      const response = await callGemini(systemPrompt, startMessages, {
        temperature: 0.3,
        maxTokens: 180,
      });

      return NextResponse.json({
        response: subMode === 'interview' ? oneQuestionOnly(response) : response,
      });
    }

    if (action === 'respond') {
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

      const response = await callGemini(systemPrompt, aiMessages, {
        temperature: 0.3,
        maxTokens: 180,
      });

      return NextResponse.json({
        response: subMode === 'interview' ? oneQuestionOnly(response) : response,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Document API error:', error);

    const message =
      error instanceof Error
        ? error.message
        : 'Failed to process document mode request';

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
