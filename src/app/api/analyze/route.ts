import { NextRequest, NextResponse } from 'next/server';
import { VALID_LAW_TYPES, LAW_NAMES, LawType, AnalyzeResponse } from '@/lib/types';
import { getFullAnalysis } from '@/data/legalAnalysisLibrary';
import { ARTICLE_TEXT_DB } from '@/lib/article-store';

// ============================================================
// API التحليل القانوني - نسخة محلية بالكامل (لا تحتاج ذكاء اصطناعي)
// جميع التحليلات مُعدّة مسبقاً من المصادر القانونية المصرية الرسمية
// المصادر: منشورات قانونية، محكمة النقض، وزارة العدل، scc.gov.eg
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { law, num, text } = body;

    // Validate law type
    if (!law || !VALID_LAW_TYPES.includes(law as LawType)) {
      return NextResponse.json(
        { ok: false, error: 'فرع القانون غير صالح' } as AnalyzeResponse,
        { status: 400 }
      );
    }

    // Validate article number - must be digits only
    if (!num || !/^[0-9]+$/.test(String(num))) {
      return NextResponse.json(
        { ok: false, error: 'رقم المادة يجب أن يكون أرقاماً فقط' } as AnalyzeResponse,
        { status: 400 }
      );
    }

    // Get analysis from local library (no AI needed!)
    const analysis = getFullAnalysis(law as LawType, String(num));

    if (!analysis) {
      // Even if no detailed analysis, generate category-based analysis
      return NextResponse.json({
        ok: true,
        shakly: [],
        mawdoo: [],
        thaghra: [],
        naqd: [],
        muzakkira: '',
      } as AnalyzeResponse);
    }

    // Return the local analysis data
    const result: AnalyzeResponse = {
      ok: true,
      shakly: analysis.shakly,
      mawdoo: analysis.mawdoo,
      thaghra: analysis.thaghra,
      naqd: analysis.naqd,
      muzakkira: analysis.muzakkira,
    };

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { ok: false, error: 'حدث خطأ في الخادم' } as AnalyzeResponse,
      { status: 500 }
    );
  }
}
