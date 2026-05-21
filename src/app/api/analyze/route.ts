import { NextRequest, NextResponse } from 'next/server';
import { VALID_LAW_TYPES, LAW_NAMES, LawType } from '@/lib/types';
import { ARTICLE_TEXT_DB } from '@/lib/article-store';
import ZAI from 'z-ai-web-dev-sdk';

// ============================================================
// API التحليل القانوني بالذكاء الاصطناعي
// يستخدم z-ai-web-dev-sdk (GLM) للتحليل القانوني
// المصادر: منشورات قانونية، محكمة النقض، وزارة العدل، scc.gov.eg, moj.gov.eg
// ============================================================

interface AnalysisResult {
  ok: boolean;
  text?: string;
  shakly?: string[];
  mawdoo?: string[];
  thaghra?: string[];
  naqd?: { ref: string; text: string }[];
  taaleeq?: string[];
  muzakkira?: string;
  error?: string;
  source?: string;
}

/**
 * Build the Arabic legal analysis prompt
 */
function buildLegalPrompt(lawName: string, articleNum: string, articleText: string): string {
  return `أنت خبير قانوني مصري متخصص في التحليل القانوني الجنائي والمدني. مهمتك هي تحليل المادة القانونية التالية بشكل شامل ودقيق.

اسم القانون: ${lawName}
رقم المادة: ${articleNum}
نص المادة: ${articleText}

قم بتحليل هذه المادة وتقديم التحليل التالي بصيغة JSON فقط بدون أي نص إضافي:

{
  "shakly": ["دفوع شكلية 1", "دفوع شكلية 2", "دفوع شكلية 3 على الأقل"],
  "mawdoo": ["دفوع موضوعية 1", "دفوع موضوعية 2", "دفوع موضوعية 3 على الأقل"],
  "thaghra": ["ثغرة 1", "ثغرة 2", "ثغرة 3 على الأقل"],
  "naqd": [
    {"ref": "رقم الطعن والمحكمة", "text": "نص مبدأ النقض"},
    {"ref": "رقم الطعن والمحكمة", "text": "نص مبدأ النقض"}
  ],
  "taaleeq": ["تعليق قانوني 1 مع ذكر المصدر الرسمي مثل: منشورات قانونية، محكمة النقض، وزارة العدل، moj.gov.eg، scc.gov.eg، najd.gov.eg", "تعليق قانوني 2 مع المصدر"],
  "muzakkira": "مسودة مذكرة قانونية كاملة تتضمن: مقدمة ووقائع ودفوع شكلية وموضوعية وطلبات"
}

التعليمات المهمة:
1. الدفوع الشكلية: يجب أن تكون دفوع إجرائية حقيقية يمكن استخدامها في المحكمة (عدم اختصاص، بطلان إجراءات، عدم قبول، سقوط بالتقادم، إلخ)
2. الدفوع الموضوعية: دفوع تتعلق بأركان الجريمة أو الحق الموضوعي (انتفاء القصد الجنائي، الدفاع الشرعي، حسن النية، إلخ)
3. الثغرات: نقاط ضعف حقيقية في النص التشريعي أو في تطبيقه العملي
4. مبادئ النقض: أحكام حقيقية أو واقعية من محكمة النقض المصرية تتعلق بهذه المادة مع أرقام طعن
5. التعليقات: تعليقات قانونية مع ذكر المصادر الرسمية المصرية (منشورات قانونية، مواقع وزارة العدل، محكمة النقض)
6. المذكرة القانونية: مسودة مذكرة قانونية مهنية جاهزة للاستخدام تتضمن جميع العناصر

أجب بصيغة JSON فقط بدون أي نص قبل أو بعد. يجب أن يكون المحتوى دقيقاً وقانونياً ومبنياً على الفقه والقضاء المصري.`;
}

/**
 * Call z-ai-web-dev-sdk (GLM) for legal analysis
 */
async function callZAI(prompt: string): Promise<string> {
  const zai = await ZAI.create();

  const completion = await zai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'أنت خبير قانوني مصري متخصص في التحليل القانوني. أجب بصيغة JSON فقط بدون أي نص إضافي. يجب أن يكون المحتوى دقيقاً ومبنياً على الفقه والقضاء المصري.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 4096,
  });

  const text = completion?.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error('Empty response from AI');
  }

  return text;
}

/**
 * Parse the AI response text into structured analysis data
 */
function parseAIResponse(responseText: string): {
  shakly: string[];
  mawdoo: string[];
  thaghra: string[];
  naqd: { ref: string; text: string }[];
  taaleeq: string[];
  muzakkira: string;
} {
  try {
    // Try to extract JSON from the response
    let jsonStr = responseText;

    // Remove markdown code blocks if present
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    // Try to find JSON object in the text
    const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      jsonStr = objectMatch[0];
    }

    const parsed = JSON.parse(jsonStr);

    return {
      shakly: Array.isArray(parsed.shakly) ? parsed.shakly.filter((s: string) => typeof s === 'string') : [],
      mawdoo: Array.isArray(parsed.mawdoo) ? parsed.mawdoo.filter((s: string) => typeof s === 'string') : [],
      thaghra: Array.isArray(parsed.thaghra) ? parsed.thaghra.filter((s: string) => typeof s === 'string') : [],
      naqd: Array.isArray(parsed.naqd)
        ? parsed.naqd
            .filter((n: unknown) => typeof n === 'object' && n !== null)
            .map((n: Record<string, string>) => ({
              ref: String(n.ref || ''),
              text: String(n.text || ''),
            }))
            .filter((n: { ref: string; text: string }) => n.ref || n.text)
        : [],
      taaleeq: Array.isArray(parsed.taaleeq) ? parsed.taaleeq.filter((s: string) => typeof s === 'string') : [],
      muzakkira: typeof parsed.muzakkira === 'string' ? parsed.muzakkira : '',
    };
  } catch (e) {
    console.error('Failed to parse AI response as JSON:', e);
    // If parsing fails, try to extract useful content from the raw text
    return {
      shakly: [],
      mawdoo: [],
      thaghra: [],
      naqd: [],
      taaleeq: [],
      muzakkira: responseText,
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { law, num } = body;

    // Validate law type
    if (!law || !VALID_LAW_TYPES.includes(law as LawType)) {
      return NextResponse.json(
        { ok: false, error: 'فرع القانون غير صالح' } as AnalysisResult,
        { status: 400 }
      );
    }

    // Validate article number - must be digits only
    if (!num || !/^[0-9]+$/.test(String(num))) {
      return NextResponse.json(
        { ok: false, error: 'رقم المادة يجب أن يكون أرقاماً فقط' } as AnalysisResult,
        { status: 400 }
      );
    }

    const lawType = law as LawType;
    const articleNum = String(num);
    const lawName = LAW_NAMES[lawType];

    // Get article text from local store
    const key = `${lawType}-${articleNum}`;
    const articleText = ARTICLE_TEXT_DB[key] || null;

    if (!articleText) {
      return NextResponse.json({
        ok: false,
        error: `لم يتم العثور على نص المادة ${articleNum} من ${lawName} في قاعدة البيانات`,
      } as AnalysisResult, { status: 404 });
    }

    // Build the legal analysis prompt
    const prompt = buildLegalPrompt(lawName, articleNum, articleText);

    // Call AI via z-ai-web-dev-sdk
    let aiResponseText = '';
    try {
      aiResponseText = await callZAI(prompt);
    } catch (aiError) {
      console.error('AI API failed:', aiError);
      return NextResponse.json({
        ok: false,
        error: 'فشل الاتصال بخدمة الذكاء الاصطناعي. يرجى المحاولة لاحقاً.',
      } as AnalysisResult, { status: 503 });
    }

    // Parse the AI response
    const analysis = parseAIResponse(aiResponseText);

    const result: AnalysisResult = {
      ok: true,
      text: articleText,
      shakly: analysis.shakly,
      mawdoo: analysis.mawdoo,
      thaghra: analysis.thaghra,
      naqd: analysis.naqd,
      taaleeq: analysis.taaleeq,
      muzakkira: analysis.muzakkira,
      source: 'ai',
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { ok: false, error: 'حدث خطأ في الخادم أثناء التحليل' } as AnalysisResult,
      { status: 500 }
    );
  }
}
