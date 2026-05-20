import { NextRequest, NextResponse } from 'next/server';
import { getArticleText } from '@/lib/legal-db';
import { VALID_LAW_TYPES, LawType } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const law = searchParams.get('law');
    const num = searchParams.get('num');

    // Validate law type
    if (!law || !VALID_LAW_TYPES.includes(law as LawType)) {
      return NextResponse.json(
        { found: false, error: 'فرع القانون غير صالح' },
        { status: 400 }
      );
    }

    // Validate article number - must be digits only
    if (!num || !/^[0-9]+$/.test(num)) {
      return NextResponse.json(
        { found: false, error: 'رقم المادة يجب أن يكون أرقاماً فقط' },
        { status: 400 }
      );
    }

    const articleText = getArticleText(law as LawType, num);

    if (articleText) {
      return NextResponse.json({ found: true, article_text: articleText });
    }

    return NextResponse.json({ found: false });
  } catch {
    return NextResponse.json(
      { found: false, error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}
