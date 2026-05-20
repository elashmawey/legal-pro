import { NextRequest, NextResponse } from 'next/server';
import { VALID_LAW_TYPES, LAW_NAMES, LawType, AnalyzeResponse } from '@/lib/types';
import ZAI from 'z-ai-web-dev-sdk';

// Rate limiting - simple in-memory store
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return true;
  }

  entry.count++;
  return false;
}

// Lazy-initialize the ZAI client
let zaiInstance: InstanceType<typeof ZAI> | null = null;

async function getZAIClient() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { ok: false, error: 'تم تجاوز الحد المسموح من الطلبات. حاول مرة أخرى بعد دقيقة.' } as AnalyzeResponse,
        { status: 429 }
      );
    }

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

    // Validate text - must be substantial
    if (!text || typeof text !== 'string' || text.trim().length < 10) {
      return NextResponse.json(
        { ok: false, error: 'نص المادة مطلوب ويجب أن يكون 10 أحرف على الأقل' } as AnalyzeResponse,
        { status: 400 }
      );
    }

    // Sanitize text - limit length
    const sanitizedText = text.trim().slice(0, 10000);
    const lawName = LAW_NAMES[law as LawType];

    // Use z-ai-web-dev-sdk for AI analysis
    let aiResult: AnalyzeResponse;

    try {
      const zai = await getZAIClient();

      const systemPrompt = `أنت خبير تحليل قانوني مصري متخصص. مهمتك هي تحليل نص المادة القانونية المُقدمة لك بدقة.

قاعدة أساسية: تحليلك يجب أن يعتمد حصرياً على النص المُقدم. لا تقم بتأويل أو إضافة معانٍ غير موجودة في النص. إذا كان النص غير واضح، أشر إلى ذلك كثغرة.

يجب أن تستجيب بصيغة JSON فقط بدون أي نص قبله أو بعده. بدون أكواد Markdown. بدون شرح. فقط كائن JSON خام.

يجب أن يتبع JSON الهيكل التالي بالضبط:
{"shakly":["دفعة 1","دفعة 2"],"mawdoo":["دفعة 1","دفعة 2"],"thaghra":["ثغرة 1","ثغرة 2"],"naqd":[{"ref":"رقم الطعن","text":"نص المبدأ"}],"muzakkira":"نص مسودة المذكرة"}

المتطلبات:
1. shakly: قائمة بالدفوع الشكلية والإجرائية (الاختصاص، التقادم، بطلان الإجراءات، عدم قبول، الخ)
2. mawdoo: قائمة بالدفوع الموضوعية (انتفاء الأركان، علاقة السببية، القصد، حسن النية، الخ)
3. thaghra: قائمة بالثغرات التشريعية والغموض ونقاط الضعف في النص المُقدم
4. naqd: قائمة بمبادئ محكمة النقض المصرية ذات الصلة بمراجع طعن واقعية
5. muzakkira: مسودة مذكرة قانونية كاملة بلغة عربية قانونية رسمية

جميع المحتوى يجب أن يكون بالعربية باستخدام المصطلحات القانونية المصرية الرسمية.
تأكد من أن جميع قيم النصوص مُهربة بشكل صحيح لـ JSON صالح. لا تستخدم أسطراً جديدة غير مُهربة أو أحرف خاصة في قيم النصوص.
كل دفعة أو ثغرة يجب أن تكون محددة ومتعلقة بالنص المُقدم وليست عامة.`;

      const userPrompt = `حلل المادة ${num} من ${lawName} بناءً على النص التالي حصراً:

---
${sanitizedText}
---

ملاحظة هامة: حلل فقط النص المكتوب أعلاه. لا تضف معلومات من عندك عن هذه المادة. إذا كان النص يختلف عما تعرفه عن هذه المادة، التزم بالنص المُقدم.`;

      const response = await zai.chat.completions.create({
        model: 'glm-4-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.5,
      });

      // Extract the response content
      const content = response.choices?.[0]?.message?.content || '';

      // Try to parse JSON from the response with multiple fallback strategies
      let parsed: Record<string, unknown>;
      try {
        // Strategy 1: Direct parse
        try {
          parsed = JSON.parse(content);
        } catch {
          // Strategy 2: Extract from markdown code block
          const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (jsonMatch?.[1]) {
            parsed = JSON.parse(jsonMatch[1].trim());
          } else {
            // Strategy 3: Find the last valid JSON object (AI might add text after)
            const allObjects = content.match(/\{[\s\S]*\}/g);
            if (allObjects && allObjects.length > 0) {
              // Try each match from last to first
              let lastError: Error | null = null;
              for (let i = allObjects.length - 1; i >= 0; i--) {
                try {
                  parsed = JSON.parse(allObjects[i]);
                  break;
                } catch (e) {
                  lastError = e as Error;
                  if (i === 0) throw lastError;
                }
              }
            } else {
              throw new Error('لم يتم العثور على JSON صالح في رد الذكاء الاصطناعي');
            }
          }
        }
      } catch (parseError) {
        // Strategy 4: If all JSON parsing fails, try to extract structured data from text
        console.warn('JSON parsing failed, attempting text extraction:', parseError);

        // Try to extract arrays from the text response
        const extractList = (key: string): string[] => {
          const regex = new RegExp(`"${key}"\\s*:\\s*\\[([\\s\\S]*?)\\]`, 'g');
          const match = regex.exec(content);
          if (match) {
            try {
              const arr = JSON.parse(`[${match[1]}]`);
              return Array.isArray(arr) ? arr.map(String) : [];
            } catch {
              return [];
            }
          }
          return [];
        };

        const extractString = (key: string): string => {
          const regex = new RegExp(`"${key}"\\s*:\\s*"([\\s\\S]*?)"`, 'g');
          const match = regex.exec(content);
          return match ? match[1] : '';
        };

        parsed = {
          shakly: extractList('shakly'),
          mawdoo: extractList('mawdoo'),
          thaghra: extractList('thaghra'),
          naqd: [],
          muzakkira: extractString('muzakkira'),
        };
      }

      // Validate and construct the response
      aiResult = {
        ok: true,
        shakly: Array.isArray(parsed.shakly) ? parsed.shakly.map(String) : [],
        mawdoo: Array.isArray(parsed.mawdoo) ? parsed.mawdoo.map(String) : [],
        thaghra: Array.isArray(parsed.thaghra) ? parsed.thaghra.map(String) : [],
        naqd: Array.isArray(parsed.naqd)
          ? parsed.naqd.map(
              (n: unknown) => ({
                ref: String((n as Record<string, unknown>).ref || ''),
                text: String((n as Record<string, unknown>).text || ''),
              })
            )
          : [],
        muzakkira: typeof parsed.muzakkira === 'string' ? parsed.muzakkira : '',
      };
    } catch (aiError) {
      const errorMessage =
        aiError instanceof Error ? aiError.message : 'حدث خطأ في تحليل الذكاء الاصطناعي';
      console.error('AI Analysis error:', errorMessage);

      return NextResponse.json({
        ok: false,
        error: 'تعذّر التحليل بالذكاء الاصطناعي',
        detail: errorMessage,
      } as AnalyzeResponse);
    }

    return NextResponse.json(aiResult);
  } catch {
    return NextResponse.json(
      { ok: false, error: 'حدث خطأ في الخادم' } as AnalyzeResponse,
      { status: 500 }
    );
  }
}
