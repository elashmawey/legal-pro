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

    // Validate text
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { ok: false, error: 'نص المادة مطلوب' } as AnalyzeResponse,
        { status: 400 }
      );
    }

    // Sanitize text - limit length
    const sanitizedText = text.trim().slice(0, 5000);
    const lawName = LAW_NAMES[law as LawType];

    // Use z-ai-web-dev-sdk for AI analysis
    let aiResult: AnalyzeResponse;

    try {
      const zai = await getZAIClient();

      const systemPrompt = `You are an expert Egyptian legal analyst. Analyze the given legal article and provide a comprehensive analysis.

CRITICAL: You MUST respond with ONLY a valid JSON object. No text before or after the JSON. No markdown code blocks. No explanation. Just the raw JSON object.

The JSON must follow this exact structure:
{"shakly":["defense 1","defense 2"],"mawdoo":["defense 1","defense 2"],"thaghra":["loophole 1","loophole 2"],"naqd":[{"ref":"case reference","text":"principle text"}],"muzakkira":"legal memo draft text"}

Requirements:
1. shakly: List procedural defenses (jurisdiction, statute of limitations, procedural validity)
2. mawdoo: List substantive defenses (elements of crime/obligation, causation, intent)
3. thaghra: List legislative loopholes, ambiguities, and weaknesses
4. naqd: List Egyptian Court of Cassation principles with realistic case references
5. muzakkira: Write a complete legal memo draft in formal Egyptian legal Arabic

All content MUST be in Arabic with formal Egyptian legal terminology.
Ensure all string values are properly escaped for valid JSON. Do NOT use unescaped newlines or special characters in string values.`;

      const userPrompt = `حلل المادة ${num} من ${lawName}:\n\n${sanitizedText}`;

      const response = await zai.chat.completions.create({
        model: 'glm-4-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
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
