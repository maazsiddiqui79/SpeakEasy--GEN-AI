import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let text = '';

    const lowerName = file.name.toLowerCase();
    
    if (lowerName.endsWith('.txt')) {
      text = buffer.toString('utf-8');
    } else if (lowerName.match(/\.(pdf|docx|doc|pptx|ppt)$/)) {
      const officeParser = require('officeparser');
      const ext = lowerName.split('.').pop();
      const doc = await officeParser.parseOffice(buffer, { fileType: ext });
      if (doc && typeof doc.to === 'function') {
        const result = await doc.to('text');
        text = result?.value || String(result);
      } else {
        text = String(doc);
      }
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error('File parsing error:', error);
    return NextResponse.json({ error: error.message || 'Failed to parse file' }, { status: 500 });
  }
}
